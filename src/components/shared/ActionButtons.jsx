import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Eye, Pencil, Trash2, Loader2 } from 'lucide-react'
import { base44 } from '@/api/base44Client'
import { archiveRecord } from '@/lib/archive'

/**
 * أزرار الإجراءات القياسية — عرض / تعديل / حذف للأرشيف
 *
 * Props:
 *   entityName  — اسم الكيان في base44 (مثال: 'Client', 'Case')
 *   record      — السجل الكامل
 *   onEdit      — دالة تفتح نافذة التعديل
 *   onView      — دالة تفتح صفحة التفاصيل (اختياري)
 *   onDeleted   — callback بعد الحذف الناجح
 *   size        — 'sm' | 'default'
 *   showLabels  — إظهار النصوص بجانب الأيقونات
 */
export default function ActionButtons({
  entityName,
  record,
  onEdit,
  onView,
  onDeleted,
  size = 'sm',
  showLabels = false,
  className = '',
}) {
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async (e) => {
    e.stopPropagation()
    const name = record.full_name || record.title || record.invoice_number || record.case_title || 'هذا السجل'
    if (!window.confirm(`هل تريد حذف "${name}" وإرساله للأرشيف؟`)) return
    setDeleting(true)
    try {
      archiveRecord(entityName, record)
      await base44.entities[entityName].delete(record.id)
      onDeleted?.()
    } catch (err) {
      alert(`تعذر الحذف: ${err.message}`)
    } finally {
      setDeleting(false)
    }
  }

  const btnBase = 'gap-1.5 transition-all'
  const sm      = size === 'sm'

  return (
    <div className={`flex items-center gap-1 ${className}`} onClick={e => e.stopPropagation()}>
      {onView && (
        <Button
          variant="ghost"
          size={sm ? 'icon' : 'sm'}
          className={`${btnBase} ${sm ? 'h-8 w-8' : ''} text-muted-foreground hover:text-foreground`}
          onClick={(e) => { e.stopPropagation(); onView(record) }}
          title="عرض التفاصيل"
        >
          <Eye className="h-3.5 w-3.5" />
          {showLabels && !sm && 'عرض'}
        </Button>
      )}

      {onEdit && (
        <Button
          variant="ghost"
          size={sm ? 'icon' : 'sm'}
          className={`${btnBase} ${sm ? 'h-8 w-8' : ''} text-muted-foreground hover:text-primary`}
          onClick={(e) => { e.stopPropagation(); onEdit(record) }}
          title="تعديل"
        >
          <Pencil className="h-3.5 w-3.5" />
          {showLabels && !sm && 'تعديل'}
        </Button>
      )}

      <Button
        variant="ghost"
        size={sm ? 'icon' : 'sm'}
        className={`${btnBase} ${sm ? 'h-8 w-8' : ''} text-muted-foreground hover:text-destructive`}
        onClick={handleDelete}
        disabled={deleting}
        title="حذف للأرشيف"
      >
        {deleting
          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
          : <Trash2 className="h-3.5 w-3.5" />
        }
        {showLabels && !sm && 'حذف'}
      </Button>
    </div>
  )
}
