import { getInvoiceTotals } from './invoiceMath'
import { format, isValid, differenceInDays } from 'date-fns'

function safeFmt(v, pat, fallback = '') {
  if (!v) return fallback
  try { const d = new Date(v); return isValid(d) ? format(d, pat) : fallback } catch { return fallback }
}

// ── بناء رابط واتساب ─────────────────────────────────────────────────────────
export function buildWhatsAppUrl(phone, message) {
  const clean = String(phone || '').replace(/\D+/g, '')
  const text  = encodeURIComponent(message)
  return clean ? `https://wa.me/${clean}?text=${text}` : `https://wa.me/?text=${text}`
}

export function openWhatsApp(phone, message) {
  window.open(buildWhatsAppUrl(phone, message), '_blank', 'noopener,noreferrer')
}

// ── قوالب الجلسات ─────────────────────────────────────────────────────────────
export function sessionReminderMessage(session, officeSettings = {}) {
  const date    = safeFmt(session.session_date, 'dd/MM/yyyy', '—')
  const time    = safeFmt(session.session_date, 'HH:mm', '—')
  const office  = officeSettings.office_name || 'المكتب القانوني'
  const phone   = officeSettings.phone || ''

  return `مرحباً ${session.client_name || 'الموكّل الكريم'}،

📋 تذكير بجلسة قضيتك:
• القضية: ${session.case_title || '—'}
• التاريخ: ${date}
• الوقت: ${time}
• المحكمة: ${session.court || '—'}${session.hall ? `\n• القاعة: ${session.hall}` : ''}

يرجى الحضور قبل موعد الجلسة بـ 30 دقيقة.
للاستفسار: ${phone}

${office}`
}

export function sessionTomorrowMessage(session, officeSettings = {}) {
  const time   = safeFmt(session.session_date, 'HH:mm', '—')
  const office = officeSettings.office_name || 'المكتب القانوني'
  const phone  = officeSettings.phone || ''

  return `مرحباً ${session.client_name || 'الموكّل الكريم'}،

⚖️ تذكير: لديك جلسة *غداً*
• القضية: ${session.case_title || '—'}
• الساعة: ${time}
• المحكمة: ${session.court || '—'}${session.hall ? `\n• القاعة: ${session.hall}` : ''}

للاستفسار أو التأكيد يرجى التواصل معنا.
${phone}

${office}`
}

export function sessionResultMessage(session, officeSettings = {}) {
  const date   = safeFmt(session.session_date, 'dd/MM/yyyy', '—')
  const office = officeSettings.office_name || 'المكتب القانوني'
  const phone  = officeSettings.phone || ''

  return `مرحباً ${session.client_name || 'الموكّل الكريم'}،

✅ تحديث بشأن جلسة قضيتك:
• القضية: ${session.case_title || '—'}
• تاريخ الجلسة: ${date}
• نتيجة الجلسة: ${session.result || 'سيتم إبلاغكم قريباً'}${session.next_session_date ? `\n• الجلسة القادمة: ${safeFmt(session.next_session_date, 'dd/MM/yyyy HH:mm')}` : ''}

للمزيد من التفاصيل يسعدنا التواصل معكم.
${phone}

${office}`
}

// ── قوالب الفواتير ────────────────────────────────────────────────────────────
export function invoiceReminderMessage(invoice, officeSettings = {}) {
  const { total, paid, remaining } = getInvoiceTotals(invoice)
  const office = officeSettings.office_name || 'المكتب القانوني'
  const phone  = officeSettings.phone || ''
  const iban   = officeSettings.iban   || ''
  const bank   = officeSettings.bank_name || ''

  return `مرحباً ${invoice.client_name || 'الموكّل الكريم'}،

💰 تذكير بفاتورة مستحقة السداد:
• رقم الفاتورة: ${invoice.invoice_number || '—'}${invoice.case_title ? `\n• القضية: ${invoice.case_title}` : ''}
• إجمالي الفاتورة: ${total.toLocaleString('ar')} د.إ
• المسدّد: ${paid.toLocaleString('ar')} د.إ
• المتبقي: *${remaining.toLocaleString('ar')} د.إ*${invoice.due_date ? `\n• تاريخ الاستحقاق: ${invoice.due_date}` : ''}${bank ? `\n\n🏦 ${bank}` : ''}${iban ? `\n• IBAN: ${iban}` : ''}

نرجو السداد في أقرب وقت. للاستفسار:
${phone}

${office}`
}

export function invoiceOverdueMessage(invoice, officeSettings = {}) {
  const { total, remaining } = getInvoiceTotals(invoice)
  const daysPast = invoice.due_date ? differenceInDays(new Date(), new Date(invoice.due_date)) : 0
  const office = officeSettings.office_name || 'المكتب القانوني'
  const phone  = officeSettings.phone || ''

  return `مرحباً ${invoice.client_name || 'الموكّل الكريم'}،

⚠️ فاتورة متأخرة تحتاج اهتمامكم:
• رقم الفاتورة: ${invoice.invoice_number || '—'}${invoice.case_title ? `\n• القضية: ${invoice.case_title}` : ''}
• المبلغ المتبقي: *${remaining.toLocaleString('ar')} د.إ*${daysPast > 0 ? `\n• متأخر منذ: ${daysPast} يوم` : ''}

يرجى التواصل معنا لترتيب السداد أو الاتفاق على خطة دفع مناسبة.
${phone}

${office}`
}

export function invoicePaidThankMessage(invoice, officeSettings = {}) {
  const { total } = getInvoiceTotals(invoice)
  const office = officeSettings.office_name || 'المكتب القانوني'

  return `مرحباً ${invoice.client_name || 'الموكّل الكريم'}،

✅ تم استلام سداد فاتورتكم بنجاح!
• رقم الفاتورة: ${invoice.invoice_number || '—'}
• المبلغ: ${total.toLocaleString('ar')} د.إ

شكراً لثقتكم بـ${office}. نسعد دائماً بخدمتكم. 🤝`
}

// ── قوالب القضايا ─────────────────────────────────────────────────────────────
export function caseUpdateMessage(caseData, note, officeSettings = {}) {
  const office = officeSettings.office_name || 'المكتب القانوني'
  const phone  = officeSettings.phone || ''

  return `مرحباً ${caseData.client_name || 'الموكّل الكريم'}،

📁 تحديث بشأن قضيتك:
• القضية: ${caseData.title || '—'}${caseData.case_number ? `\n• رقم القضية: ${caseData.case_number}` : ''}
• الحالة: ${caseData.status || '—'}

${note || 'يرجى التواصل معنا للمزيد من التفاصيل.'}

${phone}
${office}`
}

// ── قوالب الترحيب ─────────────────────────────────────────────────────────────
export function welcomeNewClientMessage(client, officeSettings = {}) {
  const office = officeSettings.office_name || 'المكتب القانوني'
  const phone  = officeSettings.phone || ''
  const portalUrl = typeof window !== 'undefined' ? window.location.origin : ''

  return `مرحباً ${client.full_name || 'الموكّل الكريم'}،

🎉 أهلاً بك في ${office}!

تم تسجيل ملفك لدينا بنجاح. يمكنك الآن:
✅ متابعة قضاياك مباشرة
✅ الاطلاع على فواتيرك
✅ رفع المستندات ومتابعتها${portalUrl ? `\n\nرابط بوابتك الخاصة:\n${portalUrl}` : ''}

للاستفسار أو الدعم:
${phone}

نتطلع لتقديم أفضل خدمة قانونية لكم. 🤝`
}

// ── أنواع القوالب للواجهة ────────────────────────────────────────────────────
export const TEMPLATE_TYPES = {
  SESSION_TOMORROW : { id: 'session_tomorrow',  label: 'تذكير جلسة غداً',      icon: '📅', color: 'text-primary'    },
  SESSION_REMINDER : { id: 'session_reminder',  label: 'تذكير موعد جلسة',      icon: '⏰', color: 'text-blue-500'   },
  SESSION_RESULT   : { id: 'session_result',    label: 'نتيجة الجلسة',          icon: '✅', color: 'text-green-500'  },
  INVOICE_REMINDER : { id: 'invoice_reminder',  label: 'تذكير سداد فاتورة',     icon: '💰', color: 'text-amber-500'  },
  INVOICE_OVERDUE  : { id: 'invoice_overdue',   label: 'فاتورة متأخرة',         icon: '⚠️', color: 'text-destructive' },
  INVOICE_PAID     : { id: 'invoice_paid',      label: 'تأكيد استلام السداد',   icon: '🎉', color: 'text-green-500'  },
  CASE_UPDATE      : { id: 'case_update',       label: 'تحديث قضية',            icon: '📁', color: 'text-purple-500' },
  WELCOME_CLIENT   : { id: 'welcome_client',    label: 'ترحيب بموكّل جديد',     icon: '👋', color: 'text-accent'     },
}
