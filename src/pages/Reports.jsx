import React, { useState, useEffect, useMemo, useCallback } from "react"
import { base44 } from "@/api/base44Client"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getInvoiceTotals } from "@/lib/invoiceMath"
import { usePageRefresh } from "@/hooks/usePageRefresh"
import { PageErrorState } from "@/components/app/AppStatusBar"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area,
} from "recharts"
import {
  TrendingUp, TrendingDown, DollarSign, AlertCircle, Briefcase, Users,
  Receipt, CheckSquare, BarChart2, Scale, Trophy,
  Clock, ArrowUpRight, Target, Award, PieChart as PieIcon,
} from "lucide-react"
import {
  format, subMonths,
  isSameMonth,
} from "date-fns"

// ── ألوان حالات القضايا ────────────────────────────────────────────────────
const CASE_COLORS = {
  "جارية":   "#3b82f6",
  "مكسوبة":  "#22c55e",
  "خاسرة":   "#ef4444",
  "مغلقة":   "#94a3b8",
  "موقوفة":  "#f59e0b",
  "أخرى":    "#8b5cf6",
}
const CHART_PALETTE = ["#3b82f6","#22c55e","#f59e0b","#8b5cf6","#ec4899","#14b8a6","#f97316","#64748b"]
const MONTHS_AR = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"]

// ── مساعدات ──────────────────────────────────────────────────────────────────
function fmtAmount(n) {
  if (!n) return "٠"
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}م`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}ك`
  return n.toLocaleString("ar")
}
function pct(part, total) { return total > 0 ? Math.round((part / total) * 100) : 0 }

// ── Tooltip مخصص ─────────────────────────────────────────────────────────────
function Tip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded-2xl px-4 py-3 shadow-2xl text-sm min-w-[140px]" dir="rtl">
      {label && <p className="font-bold text-foreground mb-2 text-xs text-muted-foreground">{label}</p>}
      {payload.map((e, i) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: e.color }} />
            <span className="text-muted-foreground text-xs">{e.name}</span>
          </span>
          <span className="font-bold text-foreground">{typeof e.value === "number" ? e.value.toLocaleString("ar") : e.value}</span>
        </div>
      ))}
    </div>
  )
}

// ── بطاقة KPI ──────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, icon: Icon, trend, trendUp, accent = "primary" }) {
  const accents = {
    primary: "bg-primary/10 text-primary",
    success: "bg-green-500/10 text-green-500",
    warning: "bg-amber-500/10 text-amber-500",
    danger:  "bg-destructive/10 text-destructive",
    purple:  "bg-purple-500/10 text-purple-500",
  }
  return (
    <Card className="p-5 flex items-start gap-4 hover:shadow-md transition-all group">
      <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 ${accents[accent]}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-muted-foreground text-xs mb-1">{label}</p>
        <p className="text-2xl font-black text-foreground leading-none">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 text-xs font-semibold shrink-0 mt-1 ${trendUp ? "text-green-500" : "text-destructive"}`}>
          {trendUp ? <ArrowUpRight className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
          {trend}%
        </div>
      )}
    </Card>
  )
}

// ── بطاقة قسم ────────────────────────────────────────────────────────────────
function Section({ title, icon: Icon, children, badge, className = "" }) {
  return (
    <Card className={`p-5 md:p-6 ${className}`}>
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-bold text-foreground flex items-center gap-2 text-base">
          {Icon && <Icon className="h-5 w-5 text-primary" />}
          {title}
        </h3>
        {badge}
      </div>
      {children}
    </Card>
  )
}

// ── شريط تقدم مع نسبة ────────────────────────────────────────────────────────
function ProgressRow({ label, value, max, color = "#3b82f6", sub }) {
  const p = pct(value, max)
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm text-foreground font-medium truncate max-w-[55%]">{label}</span>
        <span className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground">{sub || value}</span>
          <span className="text-xs font-bold text-foreground">{p}%</span>
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${p}%`, background: color }} />
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
export default function Reports() {
  const [raw, setRaw] = useState({ cases: [], invoices: [], clients: [], sessions: [], tasks: [], expenses: [] })
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [period, setPeriod] = useState(6)
  const [activeTab, setActiveTab] = useState("overview")

  const loadData = useCallback(async () => {
    setLoading(true)
    setLoadError("")
    try {
      const [cases, invoices, clients, sessions, tasks, expenses] = await Promise.all([
        base44.entities.Case.list("-created_date", 500),
        base44.entities.Invoice.list("-created_date", 500),
        base44.entities.Client.list("-created_date", 500),
        base44.entities.Session.list("-session_date", 500),
        base44.entities.Task.list("-due_date", 500),
        base44.entities.Expense.list("-created_date", 500),
      ])
      setRaw({ cases, invoices, clients, sessions, tasks, expenses })
    } catch (err) {
      setLoadError(err.message || "تعذر تحميل بيانات التقارير.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])
  usePageRefresh(loadData, ["cases","invoices","clients","sessions","tasks","expenses"])

  // ── حسابات الإيرادات ───────────────────────────────────────────────────────
  const revenue = useMemo(() => {
    const totalBilled   = raw.invoices.reduce((s, i) => s + getInvoiceTotals(i).total, 0)
    const totalCollected= raw.invoices.reduce((s, i) => s + getInvoiceTotals(i).paid,  0)
    const totalExpenses = raw.expenses.reduce((s, e) => s + (e.amount || 0), 0)
    const overdueInvs   = raw.invoices.filter(i => i.status === "متأخرة")
    const overdueAmt    = overdueInvs.reduce((s, i) => s + getInvoiceTotals(i).remaining, 0)
    const net           = Math.max(0, totalCollected - totalExpenses)
    const collRate      = pct(totalCollected, totalBilled)
    return { totalBilled, totalCollected, totalExpenses, overdueInvs, overdueAmt, net, collRate,
             outstanding: Math.max(0, totalBilled - totalCollected) }
  }, [raw.invoices, raw.expenses])

  // ── بيانات الرسم الشهري ────────────────────────────────────────────────────
  const monthly = useMemo(() => {
    const months = Array.from({ length: period }, (_, i) => {
      const d = subMonths(new Date(), period - 1 - i)
      return { name: MONTHS_AR[d.getMonth()], mo: d.getMonth(), yr: d.getFullYear(), بلغ: 0, محصّل: 0, مصاريف: 0 }
    })
    raw.invoices.forEach(inv => {
      const d = inv.created_date ? new Date(inv.created_date) : null
      if (!d) return
      const idx = months.findIndex(m => m.mo === d.getMonth() && m.yr === d.getFullYear())
      if (idx < 0) return
      const { total, paid } = getInvoiceTotals(inv)
      months[idx]["بلغ"]   += total
      months[idx]["محصّل"] += paid
    })
    raw.expenses.forEach(exp => {
      const d = exp.created_date ? new Date(exp.created_date) : null
      if (!d) return
      const idx = months.findIndex(m => m.mo === d.getMonth() && m.yr === d.getFullYear())
      if (idx >= 0) months[idx]["مصاريف"] += exp.amount || 0
    })
    return months.map(m => ({ ...m, بلغ: Math.round(m["بلغ"]), محصّل: Math.round(m["محصّل"]), مصاريف: Math.round(m["مصاريف"]) }))
  }, [raw.invoices, raw.expenses, period])

  // ── حالات القضايا ─────────────────────────────────────────────────────────
  const casesByStatus = useMemo(() => {
    const map = {}
    raw.cases.forEach(c => { const s = c.status || "أخرى"; map[s] = (map[s] || 0) + 1 })
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
  }, [raw.cases])

  // ── أنواع القضايا ─────────────────────────────────────────────────────────
  const casesByType = useMemo(() => {
    const map = {}
    raw.cases.forEach(c => { const t = c.case_type || "غير محدد"; map[t] = (map[t] || 0) + 1 })
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 7)
  }, [raw.cases])

  // ── أداء المحامين ─────────────────────────────────────────────────────────
  const lawyers = useMemo(() => {
    const map = {}
    raw.cases.forEach(c => {
      const n = c.assigned_lawyer || "غير محدد"
      if (!map[n]) map[n] = { name: n, total: 0, active: 0, won: 0, lost: 0, revenue: 0 }
      map[n].total++
      if (c.status === "جارية")  map[n].active++
      if (c.status === "مكسوبة") map[n].won++
      if (c.status === "خاسرة")  map[n].lost++
    })
    raw.invoices.forEach(inv => {
      const c = raw.cases.find(c => c.title === inv.case_title || c.id === inv.case_id)
      const n = c?.assigned_lawyer || "غير محدد"
      if (map[n]) map[n].revenue += inv.paid_amount || 0
    })
    return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 8)
  }, [raw.cases, raw.invoices])

  // ── نمو الموكلين ──────────────────────────────────────────────────────────
  const clientGrowth = useMemo(() => {
    const months = Array.from({ length: period }, (_, i) => {
      const d = subMonths(new Date(), period - 1 - i)
      return { name: MONTHS_AR[d.getMonth()], mo: d.getMonth(), yr: d.getFullYear(), موكلون: 0 }
    })
    raw.clients.forEach(cl => {
      const d = cl.created_date ? new Date(cl.created_date) : null
      if (!d) return
      const idx = months.findIndex(m => m.mo === d.getMonth() && m.yr === d.getFullYear())
      if (idx >= 0) months[idx].موكلون++
    })
    return months
  }, [raw.clients, period])

  // ── المهام ────────────────────────────────────────────────────────────────
  const taskStats = useMemo(() => {
    const total   = raw.tasks.length
    const done    = raw.tasks.filter(t => t.status === "مكتملة").length
    const overdue = raw.tasks.filter(t => t.status !== "مكتملة" && t.due_date && new Date(t.due_date) < new Date()).length
    const high    = raw.tasks.filter(t => t.priority === "عالية" && t.status !== "مكتملة").length
    return { total, done, overdue, high, pct: pct(done, total) }
  }, [raw.tasks])

  // ── الفواتير المتأخرة ─────────────────────────────────────────────────────
  const overdueList = useMemo(() =>
    revenue.overdueInvs
      .map(inv => ({ ...inv, remaining: getInvoiceTotals(inv).remaining }))
      .sort((a, b) => b.remaining - a.remaining)
      .slice(0, 8)
  , [revenue.overdueInvs])

  // ── الجلسات هذا الشهر ────────────────────────────────────────────────────
  const sessionsThisMonth = useMemo(() => {
    const now = new Date()
    return raw.sessions.filter(s => {
      const d = s.session_date ? new Date(s.session_date) : null
      return d && isSameMonth(d, now)
    }).length
  }, [raw.sessions])

  const TABS = [
    { id: "overview", label: "نظرة عامة" },
    { id: "financial", label: "الإيرادات" },
    { id: "cases", label: "القضايا" },
    { id: "team", label: "الفريق" },
  ]

  if (loading) return (
    <div className="space-y-5 animate-pulse">
      <div className="h-10 w-48 bg-muted rounded-2xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-muted rounded-3xl" />)}
      </div>
      <div className="h-72 bg-muted rounded-3xl" />
    </div>
  )

  if (loadError) return <PageErrorState title="تعذر تحميل التقارير" message={loadError} onRetry={loadData} />

  return (
    <div className="space-y-6">

      {/* ── الرأس ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            <BarChart2 className="h-6 w-6 text-primary" /> التقارير والإحصائيات
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            آخر تحديث {format(new Date(), "HH:mm · dd/MM/yyyy")}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">الفترة:</span>
          {[3, 6, 12].map(m => (
            <button key={m} onClick={() => setPeriod(m)}
              className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${period === m ? "bg-primary text-primary-foreground shadow" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
              {m} أشهر
            </button>
          ))}
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-muted p-1 rounded-2xl w-fit flex-wrap">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab === tab.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* TAB: نظرة عامة                                                     */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="إجمالي الفواتير"    value={`${fmtAmount(revenue.totalBilled)} د.إ`}   sub={`${raw.invoices.length} فاتورة`}      icon={DollarSign}  accent="primary" />
            <KpiCard label="المحصّل"            value={`${fmtAmount(revenue.totalCollected)} د.إ`} sub={`نسبة التحصيل ${revenue.collRate}%`}   icon={TrendingUp}  accent="success" />
            <KpiCard label="القضايا النشطة"     value={raw.cases.filter(c => c.status === "جارية").length} sub={`من ${raw.cases.length} إجمالي`} icon={Scale}       accent="purple" />
            <KpiCard label="المهام المكتملة"    value={`${taskStats.pct}%`}                        sub={`${taskStats.done} من ${taskStats.total}`} icon={CheckSquare} accent="warning" />
          </div>

          {/* Chart شهري */}
          <Section title="الأداء المالي الشهري" icon={TrendingUp}
            badge={<Badge variant="outline" className="text-xs text-muted-foreground">آخر {period} أشهر</Badge>}>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={monthly} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="gBilled" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gCollected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={fmtAmount} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} width={44} />
                <Tooltip content={<Tip />} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                <Area type="monotone" dataKey="بلغ"    stroke="#3b82f6" strokeWidth={2} fill="url(#gBilled)" />
                <Area type="monotone" dataKey="محصّل"  stroke="#22c55e" strokeWidth={2} fill="url(#gCollected)" />
                <Area type="monotone" dataKey="مصاريف" stroke="#f59e0b" strokeWidth={2} fill="none" strokeDasharray="4 4" />
              </AreaChart>
            </ResponsiveContainer>
          </Section>

          {/* صفين */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* حالات القضايا */}
            <Section title="توزيع القضايا" icon={Briefcase}>
              <div className="flex gap-4 items-center">
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie data={casesByStatus} dataKey="value" cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={3}>
                      {casesByStatus.map((e, i) => (
                        <Cell key={i} fill={CASE_COLORS[e.name] || CHART_PALETTE[i % CHART_PALETTE.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<Tip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {casesByStatus.map((e, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm text-foreground">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: CASE_COLORS[e.name] || CHART_PALETTE[i % CHART_PALETTE.length] }} />
                        {e.name}
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground">{e.value}</span>
                        <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-lg">{pct(e.value, raw.cases.length)}%</span>
                      </span>
                    </div>
                  ))}
                  {casesByStatus.length === 0 && <p className="text-muted-foreground text-sm text-center py-4">لا بيانات</p>}
                </div>
              </div>
            </Section>

            {/* إنجاز المهام */}
            <Section title="إنجاز المهام" icon={Target}>
              <div className="text-center mb-5">
                <div className="relative inline-flex items-center justify-center">
                  <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--muted))" strokeWidth="10"/>
                    <circle cx="50" cy="50" r="40" fill="none"
                      stroke={taskStats.pct > 70 ? "#22c55e" : taskStats.pct > 40 ? "#f59e0b" : "#ef4444"}
                      strokeWidth="10"
                      strokeDasharray={`${taskStats.pct * 2.513} 251.3`}
                      strokeLinecap="round" className="transition-all duration-1000"/>
                  </svg>
                  <div className="absolute text-center">
                    <p className="text-2xl font-black text-foreground">{taskStats.pct}<span className="text-sm">%</span></p>
                    <p className="text-[10px] text-muted-foreground">إنجاز</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "مكتملة",  v: taskStats.done,    color: "text-green-500",    bg: "bg-green-500/10" },
                  { label: "متأخرة",  v: taskStats.overdue, color: "text-destructive",  bg: "bg-destructive/10" },
                  { label: "عالية الأولوية", v: taskStats.high, color: "text-amber-500", bg: "bg-amber-500/10" },
                  { label: "الإجمالي", v: taskStats.total,  color: "text-foreground",   bg: "bg-muted" },
                ].map((item, i) => (
                  <div key={i} className={`${item.bg} rounded-2xl p-3 text-center`}>
                    <p className={`text-xl font-black ${item.color}`}>{item.v}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.label}</p>
                  </div>
                ))}
              </div>
            </Section>
          </div>

          {/* ملخص سريع */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "معدل التحصيل",       value: `${revenue.collRate}%`,                                     sub: revenue.collRate > 70 ? "ممتاز 🎯" : revenue.collRate > 40 ? "متوسط" : "يحتاج تحسين", color: revenue.collRate > 70 ? "text-green-500" : revenue.collRate > 40 ? "text-amber-500" : "text-destructive" },
              { label: "صافي الإيراد",        value: `${fmtAmount(revenue.net)} د.إ`,                           sub: `مصاريف: ${fmtAmount(revenue.totalExpenses)}`,                                           color: "text-primary" },
              { label: "الجلسات هذا الشهر",   value: sessionsThisMonth,                                          sub: `${raw.sessions.length} إجمالي`,                                                        color: "text-purple-500" },
              { label: "متوسط الفاتورة",      value: raw.invoices.length ? `${fmtAmount(revenue.totalBilled / raw.invoices.length)} د.إ` : "—", sub: `${raw.invoices.length} فاتورة`,                       color: "text-foreground" },
            ].map((item, i) => (
              <Card key={i} className="p-4 text-center hover:shadow-md transition-all">
                <p className={`text-2xl font-black ${item.color}`}>{item.value}</p>
                <p className="text-sm font-semibold text-foreground mt-1">{item.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.sub}</p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* TAB: الإيرادات                                                      */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {activeTab === "financial" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard label="إجمالي الفواتير"   value={`${fmtAmount(revenue.totalBilled)} د.إ`}      sub={`${raw.invoices.length} فاتورة`}              icon={Receipt}    accent="primary" />
            <KpiCard label="المحصّل"           value={`${fmtAmount(revenue.totalCollected)} د.إ`}   sub={`${revenue.collRate}% معدل التحصيل`}          icon={TrendingUp} accent="success" />
            <KpiCard label="المستحق"           value={`${fmtAmount(revenue.outstanding)} د.إ`}      sub={`${revenue.overdueInvs.length} فاتورة متأخرة`} icon={Clock}      accent="warning" />
            <KpiCard label="المصاريف"          value={`${fmtAmount(revenue.totalExpenses)} د.إ`}    sub={`${raw.expenses.length} مصروف`}               icon={AlertCircle} accent="danger" />
          </div>

          {/* مقارنة شهرية مفصّلة */}
          <Section title="المقارنة الشهرية التفصيلية" icon={BarChart2}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthly} barGap={3} barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={fmtAmount} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} width={44} />
                <Tooltip content={<Tip />} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Bar dataKey="بلغ"    fill="#3b82f6" radius={[6,6,0,0]} />
                <Bar dataKey="محصّل" fill="#22c55e" radius={[6,6,0,0]} />
                <Bar dataKey="مصاريف" fill="#f59e0b" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </Section>

          {/* الفواتير المتأخرة */}
          {overdueList.length > 0 && (
            <Section title={`الفواتير المتأخرة (${overdueList.length})`} icon={AlertCircle}
              badge={<Badge className="bg-destructive/10 text-destructive border-0 text-xs font-bold">{fmtAmount(revenue.overdueAmt)} د.إ</Badge>}>
              <div className="space-y-2.5">
                {overdueList.map((inv, i) => (
                  <div key={inv.id} className="flex items-center justify-between gap-3 p-3 bg-destructive/5 border border-destructive/10 rounded-2xl hover:bg-destructive/8 transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-foreground text-sm truncate">{inv.client_name || "غير محدد"}</p>
                      <p className="text-xs text-muted-foreground">{inv.invoice_number || `#${i+1}`}{inv.case_title ? ` · ${inv.case_title}` : ""}</p>
                    </div>
                    <div className="text-left shrink-0">
                      <p className="font-black text-destructive">{fmtAmount(inv.remaining)} <span className="text-xs font-normal">د.إ</span></p>
                      {inv.due_date && <p className="text-[10px] text-muted-foreground">{inv.due_date}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* توزيع طرق الدفع */}
          <Section title="توزيع طرق الدفع" icon={PieIcon}>
            {(() => {
              const map = {}
              raw.invoices.forEach(inv => { const m = inv.payment_method || "غير محدد"; map[m] = (map[m] || 0) + 1 })
              const data = Object.entries(map).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value)
              return (
                <div className="space-y-2">
                  {data.map((item, i) => (
                    <ProgressRow key={i} label={item.name} value={item.value} max={raw.invoices.length}
                      color={CHART_PALETTE[i % CHART_PALETTE.length]}
                      sub={`${item.value} فاتورة`} />
                  ))}
                  {data.length === 0 && <p className="text-muted-foreground text-sm text-center py-6">لا بيانات</p>}
                </div>
              )
            })()}
          </Section>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* TAB: القضايا                                                        */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {activeTab === "cases" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard label="إجمالي القضايا"  value={raw.cases.length}                                   sub="كل القضايا"  icon={Briefcase}  accent="primary" />
            <KpiCard label="جارية"          value={raw.cases.filter(c=>c.status==="جارية").length}      sub="قضية نشطة"   icon={Scale}       accent="purple"  />
            <KpiCard label="مكسوبة"         value={raw.cases.filter(c=>c.status==="مكسوبة").length}     sub={`${pct(raw.cases.filter(c=>c.status==="مكسوبة").length, raw.cases.length)}% نسبة الفوز`} icon={Award} accent="success" />
            <KpiCard label="الموكلون"       value={raw.clients.length}                                  sub="موكل مسجّل"  icon={Users}       accent="warning" />
          </div>

          {/* أنواع القضايا */}
          <Section title="أكثر أنواع القضايا" icon={Briefcase}>
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={casesByType} layout="vertical" barCategoryGap="28%">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={115} tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<Tip />} />
                <Bar dataKey="value" name="عدد القضايا" fill="hsl(var(--primary))" radius={[0,6,6,0]} />
              </BarChart>
            </ResponsiveContainer>
          </Section>

          {/* نمو الموكلين */}
          <Section title="نمو الموكلين شهرياً" icon={Users}>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={clientGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} width={28} allowDecimals={false} />
                <Tooltip content={<Tip />} />
                <Line type="monotone" dataKey="موكلون" stroke="hsl(var(--accent))" strokeWidth={2.5}
                  dot={{ fill: "hsl(var(--accent))", r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </Section>

          {/* أبرز الموكلين */}
          <Section title="أبرز الموكلين (بعدد القضايا)" icon={Users}>
            {(() => {
              const map = {}
              raw.cases.forEach(c => { const n = c.client_name || "غير محدد"; if (!map[n]) map[n] = 0; map[n]++ })
              const top = Object.entries(map).sort((a,b) => b[1]-a[1]).slice(0,8)
              const maxVal = top[0]?.[1] || 1
              return (
                <div className="space-y-2">
                  {top.map(([name, count], i) => (
                    <ProgressRow key={i} label={name} value={count} max={maxVal}
                      color={CHART_PALETTE[i % CHART_PALETTE.length]}
                      sub={`${count} قضية`} />
                  ))}
                  {top.length === 0 && <p className="text-muted-foreground text-sm text-center py-6">لا بيانات</p>}
                </div>
              )
            })()}
          </Section>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* TAB: الفريق                                                         */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {activeTab === "team" && (
        <div className="space-y-6">
          {lawyers.length === 0 ? (
            <Card className="p-10 text-center text-muted-foreground">
              <Trophy className="h-10 w-10 mx-auto mb-3 opacity-20" />
              لا توجد بيانات محامين مسجّلة في القضايا
            </Card>
          ) : (
            <>
              {/* بطاقات المحامين */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {lawyers.map((lw, i) => {
                  const winRate = pct(lw.won, lw.total)
                  return (
                    <Card key={i} className="p-5 hover:shadow-md transition-all">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-lg shrink-0">
                          {(lw.name || "؟")[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-foreground truncate">{lw.name}</p>
                          <p className="text-xs text-muted-foreground">{lw.total} قضية · {lw.active} نشطة</p>
                        </div>
                        {i === 0 && <Badge className="bg-amber-500/10 text-amber-600 border-0 text-[10px] mr-auto shrink-0">🏆 الأول</Badge>}
                      </div>
                      <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                        {[
                          { label: "إجمالي", v: lw.total,  color: "text-foreground" },
                          { label: "مكسوبة", v: lw.won,    color: "text-green-500" },
                          { label: "خاسرة",  v: lw.lost,   color: "text-destructive" },
                        ].map((item, j) => (
                          <div key={j} className="bg-muted/40 rounded-xl p-2">
                            <p className={`font-black text-lg ${item.color}`}>{item.v}</p>
                            <p className="text-[10px] text-muted-foreground">{item.label}</p>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">نسبة الفوز</span>
                          <span className="font-bold text-foreground">{winRate}%</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-green-500 transition-all duration-700" style={{ width: `${winRate}%` }} />
                        </div>
                        {lw.revenue > 0 && (
                          <p className="text-xs text-muted-foreground pt-1">الإيراد المحصّل: <span className="font-bold text-foreground">{fmtAmount(lw.revenue)} د.إ</span></p>
                        )}
                      </div>
                    </Card>
                  )
                })}
              </div>

              {/* مقارنة بيانية */}
              <Section title="مقارنة القضايا بين المحامين" icon={BarChart2}>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={lawyers.map(l => ({ name: l.name.split(" ").slice(-1)[0], جارية: l.active, مكسوبة: l.won, خاسرة: l.lost }))} barGap={3} barCategoryGap="30%">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} width={28} allowDecimals={false} />
                    <Tooltip content={<Tip />} />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                    <Bar dataKey="جارية"  fill="#3b82f6" radius={[4,4,0,0]} />
                    <Bar dataKey="مكسوبة" fill="#22c55e" radius={[4,4,0,0]} />
                    <Bar dataKey="خاسرة"  fill="#ef4444" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Section>
            </>
          )}
        </div>
      )}

    </div>
  )
}
