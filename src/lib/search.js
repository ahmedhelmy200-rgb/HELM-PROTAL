export function normalizeArabicText(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
    .replace(/[إأآا]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[\u200c\u200d]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

export function includesNormalized(haystack, needle) {
  const normalizedNeedle = normalizeArabicText(needle)
  if (!normalizedNeedle) return true
  return normalizeArabicText(haystack).includes(normalizedNeedle)
}

export function searchInFields(record, fields, query) {
  if (!query) return true
  return fields.some((field) => includesNormalized(record?.[field], query))
}
