import { supabase } from '@/integrations/supabase/client'
import { base44 } from '@/api/base44Client'

export const HELM_BANK_INCOME_KEY = 'helm_bank_income_transactions_v1'

const EXPENSE_CATEGORIES = new Set([
  'رسوم قضائية','مواصلات','طباعة ومستلزمات','رسوم تسجيل','أتعاب خبراء','إيجار','رواتب','اتصالات','أخرى',
  'رسوم حكومية/قضائية','مواصلات ووقود','مطاعم وضيافة','مشتريات عامة','اشتراكات وتطبيقات','رسوم بنكية','تحويلات وسحوبات نقدية','تسوق إلكتروني/أقساط','صحة وصيدليات','مرافق وخدمات'
])

export function readJsonFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try { resolve(JSON.parse(String(reader.result || '{}'))) } catch { reject(new Error('الملف ليس JSON صحيح.')) }
    }
    reader.onerror = () => reject(new Error('تعذر قراءة الملف.'))
    reader.readAsText(file, 'utf-8')
  })
}

function cleanText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

function money(value) {
  return Number(value || 0).toFixed(2)
}

function simpleHash(value = '') {
  let hash = 2166136261
  const text = String(value || '')
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

function buildBankIdentity(row = {}, type = 'bank') {
  const ref = cleanText(row.bank_reference || row.reference || '')
  const date = String(row.expense_date || row.income_date || row.date || '').slice(0, 10)
  const amount = Number(row.amount || row.debit || row.credit || 0)
  const desc = cleanText(row.bank_description || row.description || row.title || '')
  const explicit = cleanText(row.bank_transaction_id || row.transaction_id || row.id || '')
  const key = explicit || simpleHash(`${type}|${date}|${money(amount)}|${ref}|${desc}`)
  return { key, ref, date, amount, desc, marker: `[BANK-TXN:${key}]` }
}

function extractBankMarker(notes = '') {
  return String(notes || '').match(/\[BANK-TXN:([^\]]+)\]/)?.[1] || String(notes || '').match(/\[ADIB-TXN:([^\]]+)\]/)?.[1] || ''
}

export function normalizeExpenseForPortal(row = {}) {
  const bank = buildBankIdentity(row, 'expense')
  const notes = cleanText(row.notes || '')
  const baseNotes = notes || `استيراد كشف بنك ADIB${bank.ref ? ` - مرجع: ${bank.ref}` : ''}`
  return {
    title: cleanText(row.title || bank.desc || 'مصروف من كشف البنك').slice(0, 250),
    amount: bank.amount,
    category: EXPENSE_CATEGORIES.has(row.category) ? row.category : 'أخرى',
    expense_date: bank.date || new Date().toISOString().slice(0, 10),
    case_title: row.case_title || '',
    client_name: row.client_name || '',
    payment_method: row.payment_method || 'بطاقة/تحويل بنكي',
    notes: baseNotes.includes(bank.marker) ? baseNotes : `${bank.marker} ${baseNotes}`,
    is_billable: Boolean(row.is_billable),
    status: row.status || 'مدفوع',
  }
}

export function normalizeIncomeForPortal(row = {}) {
  const bank = buildBankIdentity(row, 'income')
  const baseNotes = cleanText(row.notes || `استيراد كشف بنك ADIB${bank.ref ? ` - مرجع: ${bank.ref}` : ''}`)
  return {
    id: row.id || `bank-income-${bank.key}`,
    title: cleanText(row.title || bank.desc || 'دخل من كشف البنك').slice(0, 250),
    amount: bank.amount,
    category: row.category || 'دخل آخر',
    income_date: bank.date || new Date().toISOString().slice(0, 10),
    source: row.source || 'تحويل/إيداع بنكي',
    notes: baseNotes.includes(bank.marker) ? baseNotes : `${bank.marker} ${baseNotes}`,
    status: row.status || 'محصل',
    bank_reference: bank.ref,
    created_date: row.created_date || new Date().toISOString(),
    updated_date: new Date().toISOString(),
  }
}

export function readLocalIncome() {
  try {
    const rows = JSON.parse(localStorage.getItem(HELM_BANK_INCOME_KEY) || '[]')
    return Array.isArray(rows) ? rows : []
  } catch { return [] }
}

export function writeLocalIncome(rows = []) {
  localStorage.setItem(HELM_BANK_INCOME_KEY, JSON.stringify(rows))
  return rows
}

export async function loadIncomeTransactions() {
  const local = readLocalIncome()
  try {
    const { data, error } = await supabase.from('income_transactions').select('*').order('income_date', { ascending: false }).limit(1000)
    if (error) throw error
    return { items: data?.length ? data : local, source: data?.length ? 'supabase' : 'local' }
  } catch {
    return { items: local, source: 'local' }
  }
}

export async function importExpensesToPortal(expenses = []) {
  const rows = expenses.map(normalizeExpenseForPortal).filter((e) => e.amount > 0 && e.title)
  if (!rows.length) return { imported: 0, skipped: 0, source: 'none' }
  try {
    const existing = await base44.entities.Expense.list('-created_date', 5000)
    const existingKeys = new Set((existing || []).map((row) => extractBankMarker(row.notes)).filter(Boolean))
    const fresh = rows.filter((row) => {
      const key = extractBankMarker(row.notes)
      if (!key || existingKeys.has(key)) return !key
      existingKeys.add(key)
      return true
    })
    if (!fresh.length) return { imported: 0, skipped: rows.length, source: 'supabase' }
    const created = await base44.entities.Expense.bulkCreate(fresh)
    return { imported: created?.length || fresh.length, skipped: rows.length - fresh.length, source: 'supabase' }
  } catch (error) {
    const old = JSON.parse(localStorage.getItem('helm_expenses_local_fallback_v2') || '[]')
    const oldRows = Array.isArray(old) ? old : []
    const existingKeys = new Set(oldRows.map((row) => extractBankMarker(row.notes)).filter(Boolean))
    const fresh = rows.filter((row) => {
      const key = extractBankMarker(row.notes)
      if (!key || existingKeys.has(key)) return !key
      existingKeys.add(key)
      return true
    })
    const merged = [...fresh.map((r, i) => ({ ...r, id: `expense-bank-${Date.now()}-${i}`, created_date: new Date().toISOString(), updated_date: new Date().toISOString() })), ...oldRows]
    localStorage.setItem('helm_expenses_local_fallback_v2', JSON.stringify(merged))
    return { imported: fresh.length, skipped: rows.length - fresh.length, source: 'local', error: error?.message || String(error) }
  }
}

export async function importIncomeToPortal(income = []) {
  const rows = income.map(normalizeIncomeForPortal).filter((e) => e.amount > 0 && e.title)
  if (!rows.length) return { imported: 0, skipped: 0, source: 'none' }
  try {
    const { data: existing, error: existingError } = await supabase.from('income_transactions').select('id,notes').limit(5000)
    if (existingError) throw existingError
    const existingIds = new Set((existing || []).map((row) => String(row.id || '')))
    const existingKeys = new Set((existing || []).map((row) => extractBankMarker(row.notes)).filter(Boolean))
    const fresh = rows.filter((row) => {
      const key = extractBankMarker(row.notes)
      if (existingIds.has(String(row.id || '')) || (key && existingKeys.has(key))) return false
      existingIds.add(String(row.id || ''))
      if (key) existingKeys.add(key)
      return true
    })
    if (!fresh.length) return { imported: 0, skipped: rows.length, source: 'supabase' }
    const { data, error } = await supabase.from('income_transactions').insert(fresh).select()
    if (error) throw error
    return { imported: data?.length || fresh.length, skipped: rows.length - fresh.length, source: 'supabase' }
  } catch (error) {
    const old = readLocalIncome()
    const existingIds = new Set(old.map((row) => String(row.id || '')))
    const existingKeys = new Set(old.map((row) => extractBankMarker(row.notes)).filter(Boolean))
    const fresh = rows.filter((row) => {
      const key = extractBankMarker(row.notes)
      if (existingIds.has(String(row.id || '')) || (key && existingKeys.has(key))) return false
      existingIds.add(String(row.id || ''))
      if (key) existingKeys.add(key)
      return true
    })
    writeLocalIncome([...fresh, ...old])
    return { imported: fresh.length, skipped: rows.length - fresh.length, source: 'local', error: error?.message || String(error) }
  }
}

export function bankImportSummary(data = {}) {
  const expenses = Array.isArray(data.expenses) ? data.expenses : []
  const income = Array.isArray(data.income) ? data.income : []
  const review = Array.isArray(data.excluded_review) ? data.excluded_review : Array.isArray(data.review) ? data.review : []
  return {
    expenses,
    income,
    review,
    expenseTotal: expenses.reduce((s, x) => s + Number(x.amount || 0), 0),
    incomeTotal: income.reduce((s, x) => s + Number(x.amount || 0), 0),
  }
}
