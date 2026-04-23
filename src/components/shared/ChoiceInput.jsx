import React from 'react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ChevronDown } from 'lucide-react'

export default function ChoiceInput({
  value,
  onChange,
  options = [],
  placeholder,
  id,
  listId,
  helper = 'يمكنك البدء بالكتابة أو اختيار قيمة جاهزة',
  className = '',
}) {
  const finalListId = listId || `${id || 'choice'}-list`

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          id={id}
          list={finalListId}
          value={value || ''}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          className={`pr-10 ${className}`.trim()}
        />
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <datalist id={finalListId}>
          {options.filter(Boolean).map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {options.slice(0, 6).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange?.(option)}
            className="inline-flex"
          >
            <Badge variant="secondary" className="choice-badge text-[11px]">
              {option}
            </Badge>
          </button>
        ))}
      </div>
      {helper ? <p className="text-[11px] text-muted-foreground">{helper}</p> : null}
    </div>
  )
}
