import { supabase } from '@/integrations/supabase/client'
import { getInvoiceTotals } from '@/lib/invoiceMath'

const ENTITY_PLAN = [
  ['Client', 'clients'],
  ['Case', 'cases'],
  ['Broker', 'brokers'],
  ['Session', 'sessions'],
  ['Task', 'tasks'],
  ['Document', 'documents'],
  ['Invoice', 'invoices'],
  ['Expense', 'expenses'],
  ['FutureDebt', 'future_debts'],
  ['LegalTemplate', 'legal_templates'],
  ['Notification', 'notifications'],
  ['Event', 'events'],
  ['Conversation', 'conversations'],
  ['Message', 'messages'],
  ['ConnectionRequest', 'connection_requests'],
  ['FounderProfile', 'founder_profiles'],
  ['OfficeSettings', 'office_settings'],
]

const DIRECT_TABLES = [
  'contacts',
  'income_transactions',
  'income',
  'archived_records',
  'user_activity_logs',
  'communications',
  'payment_settings',
  'social_connections',
  'social_posts',
]

function asMoney(value) {
  const n = Number(value || 0)
  return Number.isFinite(n) ? n : 0
}

function smartDate(value) {
  if (!value) return new Date().toISOString().slice(0, 10)
  try { return new Date(value).toISOString().slice(0, 10) } catch { return String(value).slice(0, 10) }
}

function smartTime(value) {
  if (!value) return '09:00'
  try {
    const d = new Date(value)
    if (!Number.isNaN(d.getTime())) return d.toTimeString().slice(0, 5)
  } catch {}
  const match = String(value).match(/(?:T|\s)(\d{2}:\d{2})/)
  return match?.[1] || '09:00'
}

function smartPriority(value, fallback = 'normal') {
  const s = String(value || '').trim().toLowerCase()
  if (['high', 'urgent', 'عالي', 'عاجل', 'مرتفع'].some((v) => s.includes(v))) return 'high'
  if (['low', 'منخفض', 'ضعيف'].some((v) => s.includes(v))) return 'low'
  return fallback
}

function stableId(prefix, row, fallback = '') {
  return String(row?.id || row?.email || row?.phone || row?.case_number || row?.invoice_number || row?.bank_reference || `${prefix}-${fallback}`)
}

async function safeEntityList(base44, entityName) {
  try {
    const api = base44?.entities?.[entityName]
    if (!api?.list) return []
    const rows = await api.list('id', 5000)
    return Array.isArray(rows) ? rows : []
  } catch {
    return []
  }
}

async function safeTableList(table) {
  try {
    const { data, error } = await supabase.from(table).select('*').limit(5000)
    if (error) throw error
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

function mapClient(row, category = 'office') {
  return {
    id: stableId(category === 'office' ? 'client' : 'contact', row, row?.full_name || row?.name || 'unknown'),
    name: row?.full_name || row?.name || row?.client_name || 'موكل بدون اسم',
    email: row?.email || '',
    phone: row?.phone || row?.mobile || '',
    emiratesId: row?.id_number || row?.emirates_id || '',
    address: row?.address || '',
    type: row?.client_type === 'شركة' || row?.type === 'Corporate' || row?.company ? 'Corporate' : 'Individual',
    totalCases: Number(row?.total_cases || 0),
    createdAt: smartDate(row?.created_date || row?.created_at),
    notes: [row?.notes, row?.company ? `الجهة: ${row.company}` : '', row?.category ? `التصنيف: ${row.category}` : ''].filter(Boolean).join('\n'),
    tags: Array.isArray(row?.tags) ? row.tags : [],
    category,
  }
}

function identityKey(row) {
  const email = String(row?.email || '').trim().toLowerCase()
  const phone = String(row?.phone || row?.mobile || '').replace(/\D+/g, '')
  const name = String(row?.full_name || row?.name || '').trim().toLowerCase().replace(/\s+/g, ' ')
  return email ? `e:${email}` : phone ? `p:${phone}` : name ? `n:${name}` : ''
}

function mergeOtherContacts(officeClients, contacts = [], brokers = []) {
  const seen = new Set(officeClients.map(identityKey).filter(Boolean))
  const out = []
  ;[...contacts, ...brokers].forEach((row, index) => {
    const key = identityKey(row)
    if (key && seen.has(key)) return
    if (key) seen.add(key)
    out.push(mapClient({ ...row, id: row.id || `other-${index}` }, 'other'))
  })
  return out
}

function mapDocument(row) {
  return {
    id: stableId('document', row, row?.file_name || row?.title || ''),
    name: row?.file_name || row?.title || 'مستند',
    type: row?.category || row?.document_type || row?.type || 'Document',
    mimeType: row?.mime_type || row?.file_type || undefined,
    category: row?.category || undefined,
    uploadDate: smartDate(row?.created_date || row?.upload_date),
    content: row?.file_url || undefined,
    status: row?.status === 'Signed' ? 'Signed' : 'Draft',
    description: row?.notes || row?.description || '',
  }
}

function mapCase(row, documents = []) {
  const id = stableId('case', row, row?.case_number || row?.title || '')
  const relatedDocs = documents
    .filter((doc) => String(doc.case_id || '') === id || (row?.title && doc.case_title === row.title) || (row?.case_number && doc.case_number === row.case_number))
    .map(mapDocument)
  return {
    id,
    caseNumber: row?.case_number || row?.number || row?.case_no || '',
    title: row?.title || row?.case_title || 'قضية بدون عنوان',
    caseType: row?.case_type || row?.type || '',
    clientId: String(row?.client_id || row?.client_email || row?.client_name || ''),
    clientName: row?.client_name || row?.client || '',
    opponentName: row?.opponent_name || row?.opponent || '',
    court: row?.court || '',
    status: row?.status || 'نشط',
    nextHearingDate: smartDate(row?.next_session_date || row?.next_hearing_date || row?.session_date || row?.updated_date),
    assignedLawyer: row?.assigned_lawyer || row?.lawyer || '',
    createdAt: smartDate(row?.created_date || row?.created_at),
    documents: relatedDocs,
    totalFee: asMoney(row?.total_fee || row?.fees || row?.amount),
    paidAmount: asMoney(row?.paid_amount || row?.paid),
  }
}

function mapInvoice(row) {
  const totals = getInvoiceTotals(row || {})
  return {
    id: stableId('invoice', row, row?.invoice_number || ''),
    invoiceNumber: row?.invoice_number || row?.number || '',
    caseId: String(row?.case_id || ''),
    caseTitle: row?.case_title || '',
    clientId: String(row?.client_id || row?.client_name || ''),
    clientName: row?.client_name || '',
    amount: asMoney(totals.total || row?.amount || row?.total),
    date: smartDate(row?.issue_date || row?.invoice_date || row?.date || row?.created_date),
    status: row?.status === 'مدفوعة' ? 'Paid' : row?.status === 'جزئية' ? 'Partial' : 'Unpaid',
    description: row?.description || row?.notes || '',
    finalAmount: asMoney(totals.total || row?.final_amount),
  }
}

function mapExpense(row) {
  return {
    id: stableId('expense', row, `${row?.expense_date || ''}-${row?.amount || 0}`),
    category: row?.category || row?.title || 'أخرى',
    amount: asMoney(row?.amount),
    date: smartDate(row?.expense_date || row?.date || row?.created_date),
    description: row?.notes || row?.description || row?.title || '',
    status: row?.status === 'معلق' || row?.status === 'Pending' ? 'Pending' : 'Paid',
  }
}

function mapTask(row) {
  return {
    id: `task-${stableId('task', row, row?.title || '')}`,
    title: row?.title || 'تذكير',
    dueDate: smartDate(row?.due_date || row?.created_date),
    dueTime: row?.due_time || smartTime(row?.due_date),
    priority: smartPriority(row?.priority),
    done: row?.status === 'مكتملة',
    note: row?.description || row?.notes || row?.case_title || '',
    source: { type: 'manual' },
  }
}

function mapSession(row) {
  const caseId = row?.case_id ? String(row.case_id) : ''
  return {
    id: `session-${stableId('session', row, row?.case_number || '')}`,
    title: `جلسة${row?.case_number ? ` — ${row.case_number}` : ''}${row?.case_title ? ` — ${row.case_title}` : ''}`,
    dueDate: smartDate(row?.session_date || row?.date || row?.created_date),
    dueTime: smartTime(row?.session_date || row?.date),
    priority: row?.status === 'قادمة' ? 'high' : 'normal',
    done: !['قادمة', 'مؤجلة'].includes(String(row?.status || '')),
    note: [row?.court, row?.client_name, row?.result, row?.notes].filter(Boolean).join(' — '),
    source: caseId ? { type: 'case_hearing', caseId } : { type: 'manual' },
  }
}

function mapFutureDebt(row) {
  return {
    id: `debt-${stableId('debt', row, row?.client_name || '')}`,
    title: `استحقاق مالي${row?.client_name ? ` — ${row.client_name}` : ''}`,
    dueDate: smartDate(row?.due_date || row?.date || row?.created_date),
    dueTime: '09:00',
    priority: 'high',
    done: Boolean(row?.is_paid || row?.status === 'مدفوع'),
    note: [`المبلغ: ${asMoney(row?.amount)} د.إ`, row?.description, row?.notes].filter(Boolean).join(' — '),
    source: { type: 'manual' },
  }
}

function mapDocumentToNote(row) {
  return {
    id: `document-${stableId('document', row, row?.file_name || row?.title || '')}`,
    title: row?.title || row?.file_name || 'مستند',
    content: [row?.notes, row?.description, row?.client_name, row?.case_title, row?.file_url].filter(Boolean).join('\n'),
    createdAt: row?.created_date || row?.created_at || new Date().toISOString(),
    updatedAt: row?.updated_date || row?.updated_at || row?.created_date || new Date().toISOString(),
    pinned: false,
  }
}

function mapIncomeToReceipt(row, index) {
  return {
    id: `income-${stableId('income', row, index)}`,
    receiptNumber: String(row?.bank_reference || row?.reference || row?.id || `INC-${index + 1}`),
    kind: 'in',
    date: smartDate(row?.income_date || row?.date || row?.created_date),
    amount: asMoney(row?.amount || row?.credit),
    method: row?.source || row?.payment_method || 'تحويل/إيداع بنكي',
    note: row?.notes || row?.title || row?.description || '',
    clientId: row?.client_id || undefined,
    clientName: row?.client_name || row?.payer_name || undefined,
    caseId: row?.case_id || undefined,
    caseNumber: row?.case_number || undefined,
    caseTitle: row?.case_title || undefined,
  }
}

function mapActivityLog(row, index) {
  return {
    id: stableId('log', row, index),
    timestamp: row?.created_at || row?.created_date || row?.timestamp || new Date().toISOString(),
    user: row?.actor_email || row?.user_email || row?.email || row?.actor_name || 'HELM Portal',
    action: row?.action || row?.event_type || row?.description || row?.table_name || 'Portal activity',
    role: row?.actor_role || row?.role || 'staff',
  }
}

function buildConfig(settings) {
  return {
    officeName: settings?.office_name || settings?.name || 'مكتب المستشار أحمد حلمي',
    officeSlogan: settings?.office_slogan || 'للاستشارات القانونية',
    officePhone: settings?.phone || '0544144149',
    officeEmail: settings?.email || 'ahmedhelmy200@gmail.com',
    officeAddress: settings?.address || 'الإمارات العربية المتحدة',
    officeWebsite: settings?.website || 'helm-smart.vercel.app',
    primaryColor: settings?.primary_color || '#0f172a',
    secondaryColor: settings?.secondary_color || '#d4af37',
    backgroundColor: '#f8fafc',
    fontFamily: settings?.app_font || 'Cairo',
    logo: settings?.logo_url || null,
    stamp: settings?.stamp_url || null,
    services: Array.isArray(settings?.services) ? settings.services : [],
    caseTypes: Array.isArray(settings?.case_types) ? settings.case_types : [],
    courts: Array.isArray(settings?.courts) ? settings.courts : [],
    invoiceTemplates: Array.isArray(settings?.invoice_templates) ? settings.invoice_templates : [],
    officeTemplates: Array.isArray(settings?.office_templates) ? settings.office_templates : [],
    invoiceFormatting: settings?.invoice_formatting || { prefix: 'INV-', suffix: '', nextSequence: 1001 },
    features: settings?.features || { enableAI: false, enableAnalysis: false, enableWhatsApp: true },
  }
}

function canonicalRow(row) {
  if (!row || typeof row !== 'object') return JSON.stringify(row)
  return Object.keys(row)
    .sort()
    .map((key) => `${key}:${JSON.stringify(row[key])}`)
    .join('|')
}

function hashText(text, seed = 2166136261) {
  let hash = seed >>> 0
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 16777619) >>> 0
  }
  return hash >>> 0
}

function fingerprintMirror(mirror) {
  let hash = 2166136261
  const keys = Object.keys(mirror).filter((key) => Array.isArray(mirror[key])).sort()
  keys.forEach((key) => {
    const rows = mirror[key] || []
    hash = hashText(`${key}:${rows.length}`, hash)
    const signatures = rows.map(canonicalRow).sort()
    signatures.forEach((signature) => { hash = hashText(signature, hash) })
  })
  return `portal-${(hash >>> 0).toString(16).padStart(8, '0')}`
}

export async function collectFullPortalMirror(base44) {
  const entityResults = await Promise.all(ENTITY_PLAN.map(async ([entityName, key]) => [key, await safeEntityList(base44, entityName)]))
  const tableResults = await Promise.all(DIRECT_TABLES.map(async (table) => [table, await safeTableList(table)]))
  const mirror = Object.fromEntries([...entityResults, ...tableResults])
  mirror.exported_at = new Date().toISOString()
  mirror.source = 'helm-portal'
  mirror.schema_version = 3
  mirror.counts = Object.fromEntries(Object.entries(mirror).filter(([, value]) => Array.isArray(value)).map(([key, value]) => [key, value.length]))
  return mirror
}

export async function buildCompleteHelmSmartPayload(base44) {
  const mirror = await collectFullPortalMirror(base44)
  const officeRows = mirror.clients || []
  const smartOfficeClients = officeRows.map((row) => mapClient(row, 'office'))
  const otherContacts = mergeOtherContacts(officeRows, mirror.contacts || [], mirror.brokers || [])
  const documents = mirror.documents || []
  const smartCases = (mirror.cases || []).map((row) => mapCase(row, documents))
  const smartInvoices = (mirror.invoices || []).map(mapInvoice)
  const smartExpenses = (mirror.expenses || []).map(mapExpense)
  const incomeSource = (mirror.income_transactions || []).length ? mirror.income_transactions : (mirror.income || [])
  const receipts = incomeSource.filter((row) => asMoney(row?.amount || row?.credit) > 0).map(mapIncomeToReceipt)
  const reminders = [
    ...(mirror.tasks || []).map(mapTask),
    ...(mirror.sessions || []).map(mapSession),
    ...(mirror.future_debts || []).map(mapFutureDebt),
  ]
  const notes = documents.map(mapDocumentToNote)
  const logs = (mirror.user_activity_logs || []).map(mapActivityLog)
  const settings = (mirror.office_settings || [])[0] || null

  const byClientId = new Map()
  const byClientName = new Map()
  smartCases.forEach((item) => {
    if (item.clientId) byClientId.set(item.clientId, (byClientId.get(item.clientId) || 0) + 1)
    if (item.clientName) byClientName.set(item.clientName, (byClientName.get(item.clientName) || 0) + 1)
  })

  const clients = [...smartOfficeClients, ...otherContacts].map((client) => ({
    ...client,
    totalCases: byClientId.get(client.id) || byClientName.get(client.name) || client.totalCases || 0,
  }))

  const totalRawRecords = Object.values(mirror.counts || {}).reduce((sum, value) => sum + Number(value || 0), 0)
  const fingerprint = fingerprintMirror(mirror)
  mirror.fingerprint = fingerprint

  return {
    source: 'helm-portal',
    syncedAt: new Date().toISOString(),
    syncVersion: 'full-portal-mirror-v3',
    config: buildConfig(settings),
    clients,
    cases: smartCases,
    invoices: smartInvoices,
    expenses: smartExpenses,
    receipts,
    logs,
    reminders,
    notes,
    portalMirror: mirror,
    syncMeta: {
      fingerprint,
      totalRawRecords,
      counts: mirror.counts,
      mapped: {
        clients: clients.length,
        cases: smartCases.length,
        invoices: smartInvoices.length,
        expenses: smartExpenses.length,
        receipts: receipts.length,
        reminders: reminders.length,
        notes: notes.length,
        logs: logs.length,
      },
    },
  }
}

export default buildCompleteHelmSmartPayload
