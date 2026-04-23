import React, { useEffect, useState } from 'react'
import { subscribeAppEvent } from '@/lib/app-events'
import { Keyboard, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

const shortcuts = [
  { keys: ['Ctrl', 'N'], label: 'إنشاء سجل جديد', scope: 'كل الصفحات' },
  { keys: ['Ctrl', 'F'], label: 'فتح البحث', scope: 'كل الصفحات' },
  { keys: ['Ctrl', '?'], label: 'عرض الاختصارات', scope: 'عام' },
  { keys: ['Esc'],       label: 'إغلاق النافذة الحالية', scope: 'النوافذ' },
]

export const APP_SHORTCUT_HELP = 'app:shortcut:help'

export default function KeyboardShortcutsModal() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const off = subscribeAppEvent(APP_SHORTCUT_HELP, () => setOpen(true))
    return off
  }, [])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="relative bg-card border border-border rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg text-foreground flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-primary" /> اختصارات لوحة المفاتيح
          </h2>
          <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => setOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-2">
          {shortcuts.map((s, i) => (
            <div key={i} className="flex items-center justify-between py-2.5 px-3 rounded-2xl hover:bg-muted/50 transition-colors">
              <div>
                <p className="text-sm font-medium text-foreground">{s.label}</p>
                <p className="text-xs text-muted-foreground">{s.scope}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {s.keys.map((key, j) => (
                  <React.Fragment key={j}>
                    <kbd className="inline-flex items-center justify-center min-w-[30px] h-7 px-2 bg-muted border border-border rounded-lg text-xs font-mono font-bold text-foreground shadow-sm">
                      {key}
                    </kbd>
                    {j < s.keys.length - 1 && <span className="text-muted-foreground text-xs">+</span>}
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-center pt-2 border-t border-border">
          الاختصارات لا تعمل أثناء الكتابة في حقول الإدخال
        </p>
      </div>
    </div>
  )
}
