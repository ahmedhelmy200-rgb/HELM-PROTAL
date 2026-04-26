import React, { useState, useEffect, useRef, useCallback } from 'react'
import { base44 } from '@/api/base44Client'
import { normalizeArabicText } from '@/lib/search'
import { createPageUrl } from '@/utils'
import { useNavigate } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Search, Briefcase, Users, CalendarDays, FileText,
  Receipt, X, Loader2, ArrowLeft, CheckSquare,
} from 'lucide-react'

const ENTITY_CONFIG = [
  { key: 'cases',     label: 'القضايا',    icon: Briefcase,   page: 'Cases',    fields: ['title','client_name','case_number','court'] },
  { key: 'clients',   label: 'الموكلون',   icon: Users,       page: 'Clients',  fields: ['full_name','phone','email','id_number'] },
  { key: 'sessions',  label: 'الجلسات',    icon: CalendarDays,page: 'Sessions', fields: ['case_title','client_name','court'] },
  { key: 'documents', label: 'المستندات',  icon: FileText,    page: 'Documents',fields: ['title','file_name','client_name','case_title'] },
  { key: 'invoices',  label: 'الفواتير',   icon: Receipt,     page: 'Invoices', fields: ['invoice_number','client_name','case_title'] },
  { key: 'tasks',     label: 'المهام',     icon: CheckSquare, page: 'Tasks',    fields: ['title','client_name','case_title'] },
]

function highlight(text, query) {
  if (!text || !query) return text
  const norm = normalizeArabicText(query)
  const parts = String(text).split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'))
  return parts.map((part, i) =>
    normalizeArabicText(part) === norm
      ? <mark key={i} className="bg-primary/20 text-primary rounded px-0.5 not-italic font-semibold">{part}</mark>
      : part
  )
}

function ResultItem({ item, config, query, onClick }) {
  const Icon = config.icon
  const primary   = item[config.fields[0]] || '—'
  const secondary = config.fields.slice(1).map(f => item[f]).filter(Boolean).join(' · ')

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted/60 transition-colors text-right group"
    >
      <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{highlight(primary, query)}</p>
        {secondary && <p className="text-xs text-muted-foreground truncate">{highlight(secondary, query)}</p>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Badge variant="outline" className="text-[10px] py-0 h-5">{config.label}</Badge>
        <ArrowLeft className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </button>
  )
}

export const GLOBAL_SEARCH_EVENT = 'helm:global-search'

export default function GlobalSearch() {
  const navigate    = useNavigate()
  const inputRef    = useRef(null)
  const [open, setOpen]       = useState(false)
  const [query, setQuery]     = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [cache, setCache]     = useState({}) // query → results

  // فتح/إغلاق بـ Ctrl+K
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(o => !o)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    const eventHandler = () => setOpen(true)
    window.addEventListener('keydown', handler)
    window.addEventListener(GLOBAL_SEARCH_EVENT, eventHandler)
    return () => {
      window.removeEventListener('keydown', handler)
      window.removeEventListener(GLOBAL_SEARCH_EVENT, eventHandler)
    }
  }, [])

  // focus عند الفتح
  useEffect(() => {
    if (open) { setTimeout(() => inputRef.current?.focus(), 50) }
    else { setQuery(''); setResults([]) }
  }, [open])

  // بحث مع debounce
  const doSearch = useCallback(async (q) => {
    if (!q || q.trim().length < 2) { setResults([]); return }
    const trimmed = q.trim()
    if (cache[trimmed]) { setResults(cache[trimmed]); return }

    setLoading(true)
    try {
      const ENTITY_MAP = {
        cases: 'Case', clients: 'Client', sessions: 'Session',
        documents: 'Document', invoices: 'Invoice', tasks: 'Task',
      }
      const all = await Promise.all(
        ENTITY_CONFIG.map(cfg =>
          (base44.entities[ENTITY_MAP[cfg.key]]
            ? base44.entities[ENTITY_MAP[cfg.key]].list('-created_date', 200)
            : Promise.resolve([]))
            .then(rows => ({ cfg, rows: Array.isArray(rows) ? rows : [] }))
            .catch(() => ({ cfg, rows: [] }))
        )
      )

      const norm = normalizeArabicText(trimmed)
      const grouped = []
      for (const { cfg, rows } of all) {
        const matched = rows.filter(row =>
          cfg.fields.some(f => normalizeArabicText(row[f] || '').includes(norm))
        ).slice(0, 4)
        if (matched.length) grouped.push({ cfg, items: matched })
      }

      setCache(prev => ({ ...prev, [trimmed]: grouped }))
      setResults(grouped)
    } catch { setResults([]) }
    finally { setLoading(false) }
  }, [cache])

  useEffect(() => {
    const t = setTimeout(() => doSearch(query), 300)
    return () => clearTimeout(t)
  }, [query])

  const handleSelect = (cfg) => {
    navigate(createPageUrl(cfg.page))
    setOpen(false)
  }

  const totalCount = results.reduce((s, g) => s + g.items.length, 0)

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4" dir="rtl">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />

      {/* modal */}
      <div className="relative w-full max-w-xl bg-card border border-border rounded-3xl shadow-2xl overflow-hidden">
        {/* حقل البحث */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
          {loading
            ? <Loader2 className="h-5 w-5 text-muted-foreground animate-spin shrink-0" />
            : <Search className="h-5 w-5 text-muted-foreground shrink-0" />
          }
          <Input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="ابحث في كل البيانات… (Ctrl+K)"
            className="border-0 shadow-none focus-visible:ring-0 h-8 text-base bg-transparent px-0"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center h-6 px-1.5 rounded-md border border-border bg-muted text-[10px] font-mono text-muted-foreground shrink-0">Esc</kbd>
        </div>

        {/* النتائج */}
        <div className="max-h-[55vh] overflow-y-auto p-2">
          {!query && (
            <div className="py-10 text-center space-y-2">
              <Search className="h-8 w-8 text-muted-foreground mx-auto opacity-40" />
              <p className="text-sm text-muted-foreground">ابدأ الكتابة للبحث في القضايا، الموكلين، الجلسات والمستندات</p>
              <p className="text-xs text-muted-foreground opacity-60">يدعم البحث العربي بدون تشكيل</p>
            </div>
          )}

          {query.length === 1 && (
            <p className="text-center text-sm text-muted-foreground py-6">اكتب حرفين على الأقل…</p>
          )}

          {query.length >= 2 && !loading && totalCount === 0 && (
            <div className="py-10 text-center">
              <p className="text-sm text-muted-foreground">لا توجد نتائج لـ "<strong>{query}</strong>"</p>
            </div>
          )}

          {results.map(({ cfg, items }) => (
            <div key={cfg.key} className="mb-3">
              <div className="flex items-center gap-2 px-3 py-1.5 mb-1">
                <cfg.icon className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{cfg.label}</span>
                <span className="text-xs text-muted-foreground">({items.length})</span>
              </div>
              {items.map(item => (
                <ResultItem
                  key={item.id}
                  item={item}
                  config={cfg}
                  query={query}
                  onClick={() => handleSelect(cfg)}
                />
              ))}
            </div>
          ))}
        </div>

        {/* footer */}
        <div className="border-t border-border px-4 py-2.5 flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><kbd className="h-5 px-1.5 rounded border border-border bg-card font-mono text-[10px]">↑↓</kbd>تنقل</span>
            <span className="flex items-center gap-1"><kbd className="h-5 px-1.5 rounded border border-border bg-card font-mono text-[10px]">↵</kbd>فتح</span>
          </div>
          {totalCount > 0 && <span className="text-xs text-muted-foreground">{totalCount} نتيجة</span>}
        </div>
      </div>
    </div>
  )
}

function capitalize(s) {
  if (!s) return s
  // map entity keys to proper entity names
  const map = {
    'case': 'Case', 'client': 'Client', 'session': 'Session',
    'document': 'Document', 'invoice': 'Invoice', 'task': 'Task',
    'expense': 'Expense',
  }
  return map[s.toLowerCase()] || s.charAt(0).toUpperCase() + s.slice(1)
}
