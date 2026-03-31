export function getInvoiceTotals(invoice = {}) {
  const subtotal = Math.max(0, Number(invoice.total_fees || 0) - Number(invoice.discount || 0))
  const vat = subtotal * (Number(invoice.vat_rate || 0) / 100)
  const total = subtotal + vat
  const paid = Number(invoice.paid_amount || 0)
  const remaining = Math.max(0, total - paid)
  return { subtotal, vat, total, paid, remaining }
}
