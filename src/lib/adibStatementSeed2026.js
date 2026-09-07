import { supabase } from '@/integrations/supabase/client'
import { normalizeText } from '@/lib/dataIntegrity'
import marApr from '@/lib/adib2026/adib-mar-apr'
import may from '@/lib/adib2026/adib-may'
import jun from '@/lib/adib2026/adib-jun'
import jul from '@/lib/adib2026/adib-jul'
import aug from '@/lib/adib2026/adib-aug'
import sep from '@/lib/adib2026/adib-sep'

export const ADIB_2026_DATASET_VERSION = 'adib-2026-03-01_2026-09-02-v1'
export const ADIB_2026_ACCOUNTING_CUTOFF = '2026-05-01'

const CHUNKS = [marApr, may, jun, jul, aug, sep]
const STAFF_ROLES = new Set(['admin', 'staff', 'lawyer', 'assistant', 'secretary'])
let runningPromise = null
let completedThisSession = false

const CLIENT_ALIASES = {
  'samar osama el abed': ['سمر اسامه العبد', 'سمر أسامة العبد', 'سمر اسامه محمد طه العبد', 'سمر أسامة محمد طه العبد'],
  'mohamed abdelghany mohamed a abdin': ['محمد عبدالغني محمد عبدين', 'محمد عبد الغني محمد عبدين'],
  'mohamed sherif elbahy elmetwalli elkashlan': ['محمد شريف الباهي المتولي الكشلان'],
  'karim mohamed shaker mohamed shendi': ['كريم محمد شاكر محمد شندي'],
  'sherin magdi ali elfadali': ['شيرين مجدي علي الفضالي'],
  'mohamed mahmoud abdelaziz nasef': ['محمد محمود عبدالعزيز ناصف', 'محمد محمود عبد العزيز ناصف'],
  'bdayt alkhir trading llc': ['بداية الخير للتجارة', 'بدايه الخير للتجاره', 'بداية الخير للتجارة ذ م م'],
  'mostafa sobhy abdelghanysayed ahmed': ['مصطفى صبحي عبدالغني سيد احمد', 'مصطفي صبحي عبد الغني سيد احمد'],
  'abdelkader farouk ali h heweidi': ['عبدالقادر فاروق علي الهويدي', 'عبد القادر فاروق علي الهويدي'],
  'mina reda halim mikhael youssef': ['مينا رضا حليم ميخائيل يوسف'],
  'rania ismail abdelhai mohamed assi': ['رانيا اسماعيل عبدالحي محمد عاصي', 'رانيا إسماعيل عبد الحي محمد عاصي'],
  'mohamed seddik elbasel gaber elnagd': ['محمد صديق الباسل جابر النجد'],
  'sherif ashraf abouelhamd elsayed': ['شريف اشرف ابو الحمد السيد', 'شريف أشرف أبو الحمد السيد'],
  'btissam el azzabi': ['ابتسام العزابي'],
  'wahat alarabya trvel tour sps llc': ['واحة العربية للسفر والسياحة', 'واحه العربيه للسفر والسياحه'],
}

function parseChunk(text = '') {
  return String(text || '')
    .split('\n')
    .map((line) => line.trimEnd())
    .filter(Boolean)
    .map((line) => {
      const [id, date, direction, amount, bankReference, classification, category, clientName, statementCode, ...descriptionParts] = line.split('\t')
      return {
        id,
        date,
        direction,
        amount: Number(amount || 0),
        bankReference: String(bankReference || '').trim(),
        classification: String(classification || '').trim(),
        category: String(category || '').trim(),
        clientName: String(clientName || '').trim(),
        statementCode: String(statementCode || '').trim(),
        description: descriptionParts.join('\t').trim(),
      }
    })
    .filter((row) => row.id && row.date && row.amount > 0)
}

export const ADIB_2026_ROWS = CHUNKS.flatMap(parseChunk)

function money(value) {
  return Number(value || 0).toFixed(2)
}

function marker(row) {
  return `[ADIB-TXN:${row.id}]`
}

function paymentMarker(row) {
  return `[ADIB-PAYMENT:${row.id}]`
}

function accountingComposite(row) {
  return `${row.date}|${money(row.amount)}|${row.bankReference}`
}

function isAfterAccountingCutoff(row) {
  return String(row.date || '') > ADIB_2026_ACCOUNTING_CUTOFF
}

function isCompanyName(name = '') {
  return /\b(llc|l\.l\.c|sps|trading|travel|tour|company|establishment)\b/i.test(name)
}

function normalizedNameCandidates(bankName = '') {
  const key = normalizeText(bankName)
  return new Set([key, ...(CLIENT_ALIASES[key] || []).map(normalizeText)].filter(Boolean))
}

function findExistingClient(bankName, clients = []) {
  const candidates = normalizedNameCandidates(bankName)
  if (!candidates.size) return null
  const matches = clients.filter((client) => candidates.has(normalizeText(client?.full_name)))
  if (!matches.length) return null
  return matches.sort((a, b) => String(a.created_date || '').localeCompare(String(b.created_date || '')))[0]
}

function paymentNote(row, countedInIncome) {
  const coverage = countedInIncome
    ? 'مدرجة في الدخل التفصيلي.'
    : 'دفعة تاريخية مغطاة بملخص ADIB السابق؛ لا تُجمع مرة ثانية في الإيرادات.'
  return `${paymentMarker(row)} ${row.date} — ${money(row.amount)} د.إ — مرجع ${row.bankReference || 'بدون مرجع'} — ${coverage}`
}

function expenseTitle(row) {
  let value = String(row.description || 'مصروف من كشف ADIB').trim()
  value = value.replace(/^POS-\d{2}\/\d{2}\/\d{2}-/i, '')
  value = value.replace(/^UPOS Purchase \d{2}\/\d{2}\/\d{4} \d{2}:\d{2}\s*/i, '')
  return value.slice(0, 240) || 'مصروف من كشف ADIB'
}

function incomeTitle(row) {
  if (row.classification === 'client_payment') return `تحصيل موكل — ${row.clientName}`
  if (row.classification === 'refund') return `استرداد مصروف — ${expenseTitle(row)}`
  return `تحصيل بنكي غير مسند — ${expenseTitle(row)}`
}

async function insertBatches(table, rows, batchSize = 100) {
  let inserted = 0
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize)
    const { error } = await supabase.from(table).insert(batch)
    if (error) throw error
    inserted += batch.length
  }
  return inserted
}

async function syncClientPayments(rows) {
  const paymentRows = rows.filter((row) => row.classification === 'client_payment' && row.clientName)
  if (!paymentRows.length) return { createdClients: 0, updatedClients: 0, paymentNotesAdded: 0 }

  const { data: existingClients, error: clientsError } = await supabase
    .from('clients')
    .select('id,full_name,client_type,phone,email,notes,status,created_date')
    .limit(5000)
  if (clientsError) throw clientsError

  const clients = Array.isArray(existingClients) ? [...existingClients] : []
  const grouped = new Map()
  paymentRows.forEach((row) => {
    const key = normalizeText(row.clientName)
    if (!grouped.has(key)) grouped.set(key, { bankName: row.clientName, rows: [] })
    grouped.get(key).rows.push(row)
  })

  let createdClients = 0
  let updatedClients = 0
  let paymentNotesAdded = 0

  for (const group of grouped.values()) {
    let client = findExistingClient(group.bankName, clients)
    const sortedRows = [...group.rows].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))

    if (!client) {
      const newNotes = [
        `أضيف تلقائياً من كشف ADIB — الاسم البنكي: ${group.bankName}.`,
        ...sortedRows.map((row) => paymentNote(row, isAfterAccountingCutoff(row))),
      ].join('\n')
      const payload = {
        full_name: group.bankName,
        client_type: isCompanyName(group.bankName) ? 'شركة' : 'فرد',
        phone: '',
        email: '',
        address: '',
        nationality: '',
        notes: newNotes,
        status: 'نشط',
      }
      const { data, error } = await supabase.from('clients').insert(payload).select('*').single()
      if (error) throw error
      client = data
      clients.push(data)
      createdClients += 1
      paymentNotesAdded += sortedRows.length
      continue
    }

    let notes = String(client.notes || '').trim()
    const additions = sortedRows
      .filter((row) => !notes.includes(paymentMarker(row)))
      .map((row) => paymentNote(row, isAfterAccountingCutoff(row)))

    if (!additions.length) continue
    notes = [notes, ...additions].filter(Boolean).join('\n')
    const { error } = await supabase
      .from('clients')
      .update({ notes, updated_date: new Date().toISOString() })
      .eq('id', client.id)
    if (error) throw error
    client.notes = notes
    updatedClients += 1
    paymentNotesAdded += additions.length
  }

  return { createdClients, updatedClients, paymentNotesAdded }
}

async function syncIncome(rows) {
  const candidates = rows.filter((row) => (
    isAfterAccountingCutoff(row)
    && row.direction === 'D'
    && ['client_payment', 'unassigned_income', 'refund'].includes(row.classification)
  ))
  if (!candidates.length) return { insertedIncome: 0, skippedIncome: 0 }

  const { data: existingRows, error } = await supabase
    .from('income_transactions')
    .select('id,amount,income_date,bank_reference,notes')
    .limit(5000)
  if (error) throw error

  const existingIds = new Set((existingRows || []).map((row) => String(row.id || '')))
  const existingMarkers = new Set()
  const existingComposites = new Set()
  ;(existingRows || []).forEach((row) => {
    const note = String(row.notes || '')
    const match = note.match(/\[ADIB-TXN:([^\]]+)\]/)
    if (match?.[1]) existingMarkers.add(match[1])
    existingComposites.add(`${String(row.income_date || '').slice(0, 10)}|${money(row.amount)}|${String(row.bank_reference || '').trim()}`)
  })

  const fresh = candidates.filter((row) => (
    !existingIds.has(`adib-income-${row.id}`)
    && !existingMarkers.has(row.id)
    && !existingComposites.has(accountingComposite(row))
  ))

  const payload = fresh.map((row) => ({
    id: `adib-income-${row.id}`,
    title: incomeTitle(row),
    amount: row.amount,
    category: row.category || (row.classification === 'client_payment' ? 'تحصيل موكل' : 'دخل آخر'),
    income_date: row.date,
    source: row.classification === 'client_payment' ? 'تحويل/إيداع موكل' : row.classification === 'refund' ? 'استرداد بنكي' : 'تحويل/إيداع بنكي',
    notes: `${marker(row)} كشف ADIB ${row.statementCode === 'J' ? 'يونيو-سبتمبر' : 'مارس-مايو'} 2026. ${row.clientName ? `الموكل/الدافع: ${row.clientName}. ` : ''}الوصف البنكي: ${row.description}`,
    status: row.classification === 'unassigned_income' ? 'محصل - غير مسند' : 'محصل',
    bank_reference: row.bankReference,
    created_date: new Date().toISOString(),
    updated_date: new Date().toISOString(),
  }))

  const insertedIncome = await insertBatches('income_transactions', payload)
  return { insertedIncome, skippedIncome: candidates.length - fresh.length }
}

async function syncExpenses(rows) {
  const candidates = rows.filter((row) => isAfterAccountingCutoff(row) && row.direction === 'W' && row.classification === 'expense')
  if (!candidates.length) return { insertedExpenses: 0, skippedExpenses: 0 }

  const { data: existingRows, error } = await supabase
    .from('expenses')
    .select('id,amount,expense_date,notes,title')
    .limit(10000)
  if (error) throw error

  const existingMarkers = new Set()
  const existingCompositeHints = new Set()
  ;(existingRows || []).forEach((row) => {
    const note = String(row.notes || '')
    const match = note.match(/\[ADIB-TXN:([^\]]+)\]/)
    if (match?.[1]) existingMarkers.add(match[1])
    const refMatch = note.match(/(?:مرجع|reference|ref)\s*[:#-]?\s*([^\s؛,]+)/i)
    if (refMatch?.[1]) existingCompositeHints.add(`${String(row.expense_date || '').slice(0, 10)}|${money(row.amount)}|${refMatch[1]}`)
  })

  const fresh = candidates.filter((row) => !existingMarkers.has(row.id) && !existingCompositeHints.has(accountingComposite(row)))
  const payload = fresh.map((row) => ({
    title: expenseTitle(row),
    amount: row.amount,
    category: row.category || 'أخرى',
    expense_date: row.date,
    case_title: '',
    client_name: '',
    payment_method: 'بطاقة/تحويل بنكي',
    notes: `${marker(row)} استيراد كشف ADIB؛ مرجع: ${row.bankReference}; الوصف البنكي: ${row.description}${row.category === 'تحويلات وسحوبات نقدية' ? '؛ يلزم ربط مستند الصرف/المستفيد عند توفره.' : ''}`,
    is_billable: false,
    status: 'مدفوع',
  }))

  const insertedExpenses = await insertBatches('expenses', payload)
  return { insertedExpenses, skippedExpenses: candidates.length - fresh.length }
}

export function getAdib2026DatasetSummary() {
  const detailed = ADIB_2026_ROWS.filter(isAfterAccountingCutoff)
  const expenses = detailed.filter((row) => row.direction === 'W' && row.classification === 'expense')
  const income = detailed.filter((row) => row.direction === 'D' && ['client_payment', 'unassigned_income', 'refund'].includes(row.classification))
  const clientPayments = ADIB_2026_ROWS.filter((row) => row.classification === 'client_payment')
  return {
    statementRows: ADIB_2026_ROWS.length,
    expenseCount: expenses.length,
    expenseTotal: expenses.reduce((sum, row) => sum + row.amount, 0),
    incomeCount: income.length,
    incomeTotal: income.reduce((sum, row) => sum + row.amount, 0),
    clientPaymentCount: clientPayments.length,
    clientPaymentTotal: clientPayments.reduce((sum, row) => sum + row.amount, 0),
  }
}

async function runSeed() {
  const clientResult = await syncClientPayments(ADIB_2026_ROWS)
  const incomeResult = await syncIncome(ADIB_2026_ROWS)
  const expenseResult = await syncExpenses(ADIB_2026_ROWS)
  const changed = clientResult.createdClients + clientResult.updatedClients + incomeResult.insertedIncome + expenseResult.insertedExpenses > 0
  completedThisSession = true
  try { sessionStorage.setItem(`helm:${ADIB_2026_DATASET_VERSION}:done`, '1') } catch {}
  return { changed, ...clientResult, ...incomeResult, ...expenseResult, summary: getAdib2026DatasetSummary() }
}

export async function seedAdibStatements2026({ role, force = false } = {}) {
  if (!STAFF_ROLES.has(String(role || ''))) return { skipped: true, reason: 'role' }
  if (!force && completedThisSession) return { skipped: true, reason: 'session' }
  if (!force) {
    try {
      if (sessionStorage.getItem(`helm:${ADIB_2026_DATASET_VERSION}:done`) === '1') {
        completedThisSession = true
        return { skipped: true, reason: 'session-storage' }
      }
    } catch {}
  }
  if (runningPromise) return runningPromise
  runningPromise = runSeed().finally(() => { runningPromise = null })
  return runningPromise
}

export default seedAdibStatements2026
