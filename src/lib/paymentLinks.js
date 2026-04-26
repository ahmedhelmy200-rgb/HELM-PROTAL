// توليد روابط الدفع وإدارة حالات الدفع

export function generatePaymentToken(invoiceId) {
  // token بسيط للتحقق من الفاتورة (يمكن تحسينه بـ JWT في الإنتاج)
  const payload = { id: invoiceId, ts: Date.now() }
  return btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

export function parsePaymentToken(token) {
  try {
    const padded = token.replace(/-/g, '+').replace(/_/g, '/')
    const json = atob(padded + '==')
    return JSON.parse(json)
  } catch {
    return null
  }
}

export function buildPaymentUrl(invoiceId, baseUrl) {
  const token = generatePaymentToken(invoiceId)
  const base  = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '')
  return `${base}/Payment?token=${token}`
}

// رسالة واتساب مع رابط الدفع
export function buildPaymentWhatsAppMessage(invoice, paymentUrl, officeSettings = {}) {
  const { total, remaining } = calcTotals(invoice)
  const office = officeSettings.office_name || 'المكتب القانوني'
  const phone  = officeSettings.phone || ''

  return `مرحباً ${invoice.client_name || 'الموكّل الكريم'}،

💳 رابط الدفع الإلكتروني لفاتورتك:

• رقم الفاتورة: ${invoice.invoice_number || '—'}
• المبلغ المستحق: *${remaining.toLocaleString('ar')} ${invoice.currency || 'د.إ'}*

🔗 ادفع الآن بأمان:
${paymentUrl}

يدعم البطاقات الائتمانية والمدى وApple Pay وGoogle Pay.

${phone}
${office}`
}

// رسالة إيميل مع رابط الدفع
export function buildPaymentEmailBody(invoice, paymentUrl, officeSettings = {}) {
  const { total, remaining } = calcTotals(invoice)
  const office = officeSettings.office_name || 'المكتب القانوني'

  return {
    subject: `رابط الدفع — فاتورة ${invoice.invoice_number || ''}`,
    body: `مرحباً ${invoice.client_name || ''},\n\nيسعدنا إعلامك بأن فاتورتك جاهزة للدفع الإلكتروني:\n\nرقم الفاتورة: ${invoice.invoice_number || '—'}\nالمبلغ المستحق: ${remaining.toLocaleString()} ${invoice.currency || 'د.إ'}\n\nرابط الدفع:\n${paymentUrl}\n\nيمكنك الدفع بأي بطاقة ائتمانية أو مدى أو Apple Pay أو Google Pay.\n\n${office}`,
  }
}

function calcTotals(invoice) {
  const sub       = Math.max(0, (invoice.total_fees || 0) - (invoice.discount || 0))
  const vat       = sub * ((invoice.vat_rate || 0) / 100)
  const total     = sub + vat
  const paid      = invoice.paid_amount || 0
  const remaining = Math.max(0, total - paid)
  return { total, paid, remaining }
}
