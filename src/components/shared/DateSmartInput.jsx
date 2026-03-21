import React, { useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { CalendarDays, Clock3 } from 'lucide-react'

function todayDate() {
  const d = new Date()
  return d.toISOString().slice(0, 10)
}

function currentDateTimeLocal() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function DateSmartInput({ type = 'date', value, onChange, placeholder, className = '' }) {
  const inputRef = useRef(null)
  const isDateTime = type === 'datetime-local'

  const openPicker = () => {
    const input = inputRef.current
    if (!input) return
    if (typeof input.showPicker === 'function') {
      input.showPicker()
      return
    }
    input.focus()
  }

  const setQuickValue = () => {
    onChange?.(isDateTime ? currentDateTimeLocal() : todayDate())
  }

  return (
    <div className="date-smart-wrap">
      <div className="relative">
        <Input
          ref={inputRef}
          type={type}
          value={value || ''}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          className={`pr-10 ${className}`.trim()}
        />
        {isDateTime ? (
          <Clock3 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        ) : (
          <CalendarDays className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        )}
      </div>
      <div className="flex items-center gap-2 mt-2">
        <Button type="button" variant="outline" size="sm" onClick={openPicker} className="text-xs h-8">
          فتح {isDateTime ? 'التاريخ والوقت' : 'التقويم'}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={setQuickValue} className="text-xs h-8">
          {isDateTime ? 'الآن' : 'اليوم'}
        </Button>
      </div>
    </div>
  )
}
