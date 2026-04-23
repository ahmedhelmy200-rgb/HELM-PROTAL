import React from 'react'
import { Button } from '@/components/ui/button'

export default function PaginationControls({ page = 1, pageSize = 20, total = 0, onPageChange, className = '' }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  if (total <= pageSize) return null
  return (
    <div dir="rtl" className={`flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3 ${className}`}>
      <div className="text-sm text-muted-foreground">الصفحة {page} من {totalPages} · إجمالي السجلات {total}</div>
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={() => onPageChange?.(page - 1)} disabled={page <= 1}>السابق</Button>
        <Button variant="outline" onClick={() => onPageChange?.(page + 1)} disabled={page >= totalPages}>التالي</Button>
      </div>
    </div>
  )
}
