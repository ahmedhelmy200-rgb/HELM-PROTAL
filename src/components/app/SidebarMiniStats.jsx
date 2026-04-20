import React, { useEffect, useState, useCallback } from 'react'
import { base44 } from '@/api/base44Client'
import { subscribeAppEvent } from '@/lib/app-events'
import { APP_DATA_CHANGED } from '@/lib/app-events'
import { Scale, CheckSquare, Receipt, CalendarDays } from 'lucide-react'
import { isToday, isTomorrow, addDays } from 'date-fns'

export default function SidebarMiniStats() {
  const [stats, setStats] = useState(null)

  const load = useCallback(async () => {
    try {
      const [cases, tasks, invoices, sessions] = await Promise.all([
        base44.entities.Case.list('-created_date', 200),
        base44.entities.Task.list('-due_date', 200),
        base44.entities.Invoice.list('-created_date', 200),
        base44.entities.Session.list('-session_date', 200),
      ])
      const now = new Date()
      const tomorrow = addDays(now, 1)
      setStats({
        activeCases:    cases.filter(c => c.status === 'جارية').length,
        pendingTasks:   tasks.filter(t => t.status !== 'مكتملة').length,
        overdueInvoices:invoices.filter(i => i.status === 'متأخرة').length,
        todaySessions:  sessions.filter(s => s.session_date && isToday(new Date(s.session_date))).length,
        tomorrowSessions: sessions.filter(s => s.session_date && isTomorrow(new Date(s.session_date))).length,
      })
    } catch {
      // fail silently in sidebar
    }
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const off = subscribeAppEvent(APP_DATA_CHANGED, () => load())
    return off
  }, [load])

  if (!stats) return null

  const items = [
    { icon: Scale,       label: 'نشطة',    value: stats.activeCases,    warn: false },
    { icon: CheckSquare, label: 'مهام',     value: stats.pendingTasks,   warn: stats.pendingTasks > 5 },
    { icon: Receipt,     label: 'متأخرة',  value: stats.overdueInvoices, warn: stats.overdueInvoices > 0 },
    { icon: CalendarDays,label: 'اليوم',   value: stats.todaySessions,  warn: stats.todaySessions > 0, positive: true },
  ]

  return (
    <div className="mx-3 mb-2 p-3 rounded-2xl bg-white/5 border border-white/8">
      <p className="text-[10px] text-white/40 uppercase tracking-widest mb-2 font-semibold">لمحة سريعة</p>
      <div className="grid grid-cols-2 gap-1.5">
        {items.map((item, i) => {
          const Icon = item.icon
          return (
            <div key={i} className={`flex items-center gap-1.5 rounded-xl px-2 py-1.5 ${item.warn && !item.positive ? 'bg-amber-400/10' : item.positive && item.value > 0 ? 'bg-green-400/10' : 'bg-white/5'}`}>
              <Icon className={`h-3 w-3 shrink-0 ${item.warn && !item.positive ? 'text-amber-300' : item.positive && item.value > 0 ? 'text-green-300' : 'text-white/40'}`} />
              <span className={`text-xs font-bold ${item.warn && !item.positive ? 'text-amber-200' : item.positive && item.value > 0 ? 'text-green-200' : 'text-white/70'}`}>{item.value}</span>
              <span className="text-[10px] text-white/40 truncate">{item.label}</span>
            </div>
          )
        })}
      </div>
      {stats.tomorrowSessions > 0 && (
        <p className="text-[10px] text-amber-300/80 mt-2 text-center">⚡ {stats.tomorrowSessions} جلسة غداً</p>
      )}
    </div>
  )
}
