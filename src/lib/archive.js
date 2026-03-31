// ── نظام الأرشيف — حذف ناعم مع إمكانية الاسترجاع ──────────────────────────
const ARCHIVE_KEY = 'helm_archive_v1'

function readArchive() {
  try { return JSON.parse(localStorage.getItem(ARCHIVE_KEY) || '[]') } catch { return [] }
}

function writeArchive(items) {
  try { localStorage.setItem(ARCHIVE_KEY, JSON.stringify(items)) } catch {}
}

// أرشفة سجل (حذف ناعم)
export function archiveRecord(entityName, record) {
  const items = readArchive()
  const entry = {
    id         : `${entityName}_${record.id}_${Date.now()}`,
    entityName,
    entityLabel: ENTITY_LABELS[entityName] || entityName,
    record     : { ...record },
    archivedAt : new Date().toISOString(),
  }
  // إزالة نسخة قديمة للسجل نفسه إن وُجدت
  const filtered = items.filter(i => !(i.entityName === entityName && i.record.id === record.id))
  writeArchive([entry, ...filtered].slice(0, 500)) // أقصى 500 سجل
  return entry
}

// استرجاع جميع المحذوفات
export function getArchive() {
  return readArchive()
}

// استرجاع محذوفات نوع معين
export function getArchiveByEntity(entityName) {
  return readArchive().filter(i => i.entityName === entityName)
}

// حذف من الأرشيف (حذف نهائي)
export function removeFromArchive(archiveId) {
  const items = readArchive().filter(i => i.id !== archiveId)
  writeArchive(items)
}

// مسح الأرشيف بالكامل
export function clearArchive() {
  writeArchive([])
}

// إحصائيات الأرشيف
export function getArchiveCount() {
  return readArchive().length
}

const ENTITY_LABELS = {
  Client      : 'موكّل',
  Case        : 'قضية',
  Session     : 'جلسة',
  Document    : 'مستند',
  Invoice     : 'فاتورة',
  Task        : 'مهمة',
  Expense     : 'مصروف',
  Notification: 'إشعار',
}

export { ENTITY_LABELS }
