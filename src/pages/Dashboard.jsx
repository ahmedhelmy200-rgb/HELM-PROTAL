import React, { useState, useEffect, useMemo, useCallback } from "react"
import { Link } from "react-router-dom"
import { createPageUrl } from "@/utils"
import { base44 } from "@/api/base44Client"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Briefcase, Receipt, CalendarDays, CheckSquare,
  Clock, AlertTriangle, Bell, FileText,
  ShieldCheck, MessageCircle, Upload, Activity,
  Wallet, Sparkles, TrendingUp, Users, ChevronRight,
  CalendarPlus, Star, BarChart3, Target, Award,
} from "lucide-react"
import {
  format, isToday, isTomorrow, differenceInHours, isValid, subMonths,
} from "date-fns"
import { useAuth } from '@/lib/AuthContext'
import { usePageRefresh } from "@/hooks/usePageRefresh"
import StatCard from "../components/helm/StatCard"
import StatusBadge from "../components/helm/StatusBadge"
import ClientContactCard from '@/components/helm/ClientContactCard'
import { checkAndCreateReminders } from "../components/helm/NotificationBell"
import { PageErrorState } from "@/components/app/AppStatusBar"
import { getInvoiceTotals } from "@/lib/invoiceMath"
import { buildGoogleCalendarUrl, addSessionToGoogleCalendar, hasCalendarPermission } from "@/lib/googleCalendar"
import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts"

function safeFmt(v, pat, fb = "—") {
  if (!v) return fb
  try { const d = new Date(v); return isValid(d) ? format(d, pat) : fb } catch { return fb }
}
function fmtMoney(n) {
  if (!n) return "٠"
  if (n >= 1_000_000) return `${(n/1_000_000).toFixed(1)}م`
  if (n >= 1_000) return `${(n/1_000).toFixed(1)}ك`
  return n.toLocaleString("ar")
}

function CalendarBtn({ session, compact }) {
  const [state,  setState]  = useState("idle")
  const [hasApi, setHasApi] = useState(null)
  useEffect(() => { hasCalendarPermission().then(setHasApi) }, [])

  const handle = async (e) => {
    e.stopPropagation()
    if (state === "done") return
    if (!hasApi) { const u = buildGoogleCalendarUrl(session); if (u) window.open(u, "_blank"); return }
    setState("adding")
    try { await addSessionToGoogleCalendar(session); setState("done") }
    catch { const u = buildGoogleCalendarUrl(session); if (u) window.open(u, "_blank"); setState("idle") }
  }

  if (compact) return (
    <button onClick={handle} title="أضف لتقويم Google"
      className="h-7 w-7 rounded-lg flex items-center justify-center bg-white/8 hover:bg-white/15 transition-colors shrink-0">
      {state === "done"
        ? <Star className="h-3.5 w-3.5 text-green-400 fill-green-400" />
        : <CalendarPlus className="h-3.5 w-3.5 text-sky-300" />}
    </button>
  )
  return (
    <button onClick={handle}
      className="flex items-center gap-1.5 text-xs text-sky-300 hover:text-sky-200 transition-colors">
      {state === "done"
        ? <><Star className="h-3.5 w-3.5 fill-sky-300" />أُضيف</>
        : <><CalendarPlus className="h-3.5 w-3.5" />أضف للتقويم</>}
    </button>
  )
}

function MiniChart({ data, color = "#3b82f6" }) {
  return (
    <ResponsiveContainer width="100%" height={40}>
      <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="mg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={color} stopOpacity={0.25} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Tooltip content={({ active, payload }) =>
          active && payload?.[0]
            ? <div className="text-[10px] bg-black/80 text-white px-2 py-1 rounded-lg">{payload[0].value.toLocaleString("ar")}</div>
            : null}
        />
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill="url(#mg)" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

function KPI({ label, value, sub, chartData, color, icon: Icon, to }) {
  const C = {
    blue  : { ring: "from-blue-500/20 to-blue-700/10",   icon: "text-blue-300",   bar: "#3b82f6" },
    green : { ring: "from-green-500/20 to-green-700/10",  icon: "text-green-300",  bar: "#22c55e" },
    amber : { ring: "from-amber-500/20 to-amber-700/10",  icon: "text-amber-300",  bar: "#f59e0b" },
    purple: { ring: "from-purple-500/20 to-purple-700/10",icon: "text-purple-300", bar: "#8b5cf6" },
    cyan  : { ring: "from-cyan-500/20 to-cyan-700/10",    icon: "text-cyan-300",   bar: "#06b6d4" },
  }[color] || { ring: "from-blue-500/20 to-blue-700/10", icon: "text-blue-300", bar: "#3b82f6" }

  const inner = (
    <div className={`bg-gradient-to-br ${C.ring} border border-white/8 rounded-3xl p-4 h-full hover:border-white/15 transition-all group`}>
      <div className="flex items-start justify-between mb-3">
        <div className="h-9 w-9 rounded-2xl bg-white/8 flex items-center justify-center group-hover:bg-white/12 transition-colors">
          <Icon className={`h-4 w-4 ${C.icon}`} />
        </div>
      </div>
      <p className="text-2xl font-black text-white leading-none mb-1">{value}</p>
      <p className="text-xs text-white/55 font-medium">{label}</p>
      {sub && <p className="text-[10px] text-white/35 mt-0.5">{sub}</p>}
      {chartData && <div className="mt-3 -mx-1"><MiniChart data={chartData} color={C.bar} /></div>}
    </div>
  )
  return to ? <Link to={createPageUrl(to)} className="block h-full">{inner}</Link> : inner
}

export default function Dashboard() {
  const { user } = useAuth()
  const [data,      setData]      = useState({ cases:[], clients:[], sessions:[], tasks:[], notifications:[], invoices:[], documents:[], officeSettings:null })
  const [loading,   setLoading]   = useState(true)
  const [loadError, setLoadError] = useState("")
  const isClient = user?.role === "client"

  const loadAll = useCallback(async () => {
    if (!user?.email) return
    setLoading(true); setLoadError("")
    try {
      if (isClient) {
        const [cases, invoices, documents, notifications, sessions, settings] = await Promise.all([
          base44.entities.Case.list("-created_date", 50),
          base44.entities.Invoice.list("-created_date", 50),
          base44.entities.Document.list("-created_date", 20),
          base44.entities.Notification.filter({ user_email: user.email, is_read: false }),
          base44.entities.Session.list("-session_date", 20),
          base44.entities.OfficeSettings.list(),
        ])
        setData({ cases, invoices, documents, notifications, sessions, officeSettings: settings?.[0]||null, clients:[], tasks:[] })
        return
      }
      const [cases, clients, sessions, tasks, notifications, invoices, documents, settings] = await Promise.all([
        base44.entities.Case.list("-created_date", 100),
        base44.entities.Client.list("-created_date", 100),
        base44.entities.Session.list("-session_date", 100),
        base44.entities.Task.list("-due_date", 100),
        base44.entities.Notification.filter({ user_email: user.email, is_read: false }),
        base44.entities.Invoice.list("-created_date", 100),
        base44.entities.Document.list("-created_date", 50),
        base44.entities.OfficeSettings.list(),
      ])
      setData({ cases, clients, sessions, tasks, notifications, invoices, documents, officeSettings: settings?.[0]||null })
      await checkAndCreateReminders(user.email)
    } catch (e) { setLoadError(e.message || "تعذر تحميل لوحة التحكم.") }
    finally     { setLoading(false) }
  }, [user?.email, isClient])

  useEffect(() => { loadAll() }, [loadAll])
  usePageRefresh(loadAll, ["cases","clients","sessions","tasks","notifications","invoices","documents"])

  const now = new Date()
  const greeting = useMemo(() => {
    const h = now.getHours()
    return h < 12 ? "صباح الخير" : h < 17 ? "مساء الخير" : "مساء النور"
  }, [])

  const activeCases = data.cases.filter(c => c.status === "جارية").length
  const pendingTasks = data.tasks.filter(t => t.status !== "مكتملة").length
  const todayTasks = data.tasks.filter(t => t.status !== "مكتملة" && t.due_date && isToday(new Date(t.due_date)))
  const upcomingSessions = data.sessions
    .filter(s => s.status === "قادمة" && isValid(new Date(s.session_date)) && new Date(s.session_date) >= now)
    .sort((a, b) => new Date(a.session_date) - new Date(b.session_date)).slice(0, 5)
  const urgentTasks = data.tasks.filter(t => {
    if (t.status === "مكتملة" || !t.due_date) return false
    const h = differenceInHours(new Date(t.due_date), now)
    return h >= 0 && h <= 24
  })

  const revenueStats = useMemo(() => {
    const total     = data.invoices.reduce((s,i) => s + getInvoiceTotals(i).total, 0)
    const collected = data.invoices.reduce((s,i) => s + getInvoiceTotals(i).paid,  0)
    const overdue   = data.invoices.filter(i => i.status === "متأخرة").length
    const overdueAmt= data.invoices.filter(i => i.status === "متأخرة").reduce((s,i) => s + getInvoiceTotals(i).remaining, 0)
    return { total, collected, outstanding: Math.max(0, total-collected), overdue, overdueAmt }
  }, [data.invoices])

  const revenueChart = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = subMonths(now, 5-i)
      return { name: format(d, "M/yy"), v: 0, mo: d.getMonth(), yr: d.getFullYear() }
    })
    data.invoices.forEach(inv => {
      const d = inv.created_date ? new Date(inv.created_date) : null
      if (!d || !isValid(d)) return
      const idx = months.findIndex(m => m.mo === d.getMonth() && m.yr === d.getFullYear())
      if (idx >= 0) months[idx].v += getInvoiceTotals(inv).paid
    })
    return months.map(m => ({ ...m, v: Math.round(m.v) }))
  }, [data.invoices])

  const recentActivity = useMemo(() => [
    ...data.cases.slice(0,3).map(c   => ({ icon:Briefcase,   color:"text-blue-300",  label:c.title,             sub:c.status,                              date:c.updated_date||c.created_date })),
    ...data.sessions.slice(0,2).map(s => ({ icon:CalendarDays,color:"text-cyan-300",  label:s.case_title||"جلسة", sub:`${s.court||""} · ${safeFmt(s.session_date,"dd/MM HH:mm")}`, date:s.session_date })),
    ...data.tasks.filter(t=>t.status!=="مكتملة").slice(0,2).map(t => ({ icon:CheckSquare, color:"text-amber-300", label:t.title, sub:t.priority, date:t.due_date })),
  ].sort((a,b) => (b.date||"").localeCompare(a.date||"")).slice(0,5), [data.cases, data.sessions, data.tasks])

  const clientStats = useMemo(() => {
    const totalInvoices = data.invoices.reduce((s,i) => s + getInvoiceTotals(i).total, 0)
    const totalPaid     = data.invoices.reduce((s,i) => s + getInvoiceTotals(i).paid,  0)
    const overdueCount  = data.invoices.filter(i => i.status === "متأخرة").length
    return { totalInvoices, totalPaid, totalRemaining: Math.max(0, totalInvoices-totalPaid), overdueCount }
  }, [data.invoices])

  const nextClientSession = useMemo(() =>
    data.sessions.filter(s => s.session_date && isValid(new Date(s.session_date)) && new Date(s.session_date) >= now)
      .sort((a,b) => new Date(a.session_date)-new Date(b.session_date))[0] || null
  , [data.sessions])

  if (loading) return (
    <div className="space-y-5 animate-pulse">
      <div className="h-44 bg-white/5 rounded-3xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{[...Array(4)].map((_,i) => <div key={i} className="h-28 bg-white/5 rounded-3xl" />)}</div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">{[...Array(2)].map((_,i) => <div key={i} className="h-52 bg-white/5 rounded-3xl" />)}</div>
    </div>
  )
  if (loadError) return <PageErrorState message={loadError} onRetry={loadAll} />

  /* ── CLIENT ─────────────────────────────────────────────────────────────── */
  if (isClient) return (
    <div className="space-y-5 page-enter">
      <section className="hero-electric-panel text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(56,189,248,.14),transparent_40%)] pointer-events-none" />
        <div className="relative flex flex-col xl:flex-row xl:items-center gap-6 xl:justify-between">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-white/10 text-sky-200 border-white/10"><ShieldCheck className="h-3.5 w-3.5" /> بوابة الموكّل الآمنة</Badge>
              {nextClientSession && <Badge className="bg-white/10 text-white border-white/10"><CalendarDays className="h-3.5 w-3.5" /> الجلسة القادمة {isToday(new Date(nextClientSession.session_date)) ? "اليوم" : isTomorrow(new Date(nextClientSession.session_date)) ? "غداً" : safeFmt(nextClientSession.session_date,"dd/MM")} · {safeFmt(nextClientSession.session_date,"HH:mm")}</Badge>}
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold">{greeting}، {user?.full_name?.split(" ")[0] || "الموكّل الكريم"}</h1>
            <p className="text-white/60 text-sm leading-7">كل ما يخص ملفك القانوني في مكان واحد.</p>
            <div className="flex flex-wrap gap-2">
              {[{to:"Cases",label:"قضاياي",icon:Briefcase},{to:"Invoices",label:"فواتيري",icon:Receipt},{to:"Documents",label:"مستنداتي",icon:FileText}].map(item => (
                <Link key={item.to} to={createPageUrl(item.to)}>
                  <Button className="bg-white/10 hover:bg-white/18 text-white gap-1.5 border border-white/10 h-9 text-sm"><item.icon className="h-4 w-4" />{item.label}</Button>
                </Link>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 xl:w-64 shrink-0">
            {[{label:"القضايا النشطة",v:data.cases.filter(c=>c.status==="جارية").length},{label:"إجمالي الفواتير",v:`${fmtMoney(clientStats.totalInvoices)} د.إ`},{label:"المدفوع",v:`${fmtMoney(clientStats.totalPaid)} د.إ`},{label:"المتبقي",v:`${fmtMoney(clientStats.totalRemaining)} د.إ`}].map((s,i) => (
              <div key={i} className="hero-side-stat"><p className="hero-side-label">{s.label}</p><p className="hero-side-value">{s.v}</p></div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard title="قضاياي" value={data.cases.length} icon={Briefcase} color="primary" to="Cases" />
        <StatCard title="فواتيري" value={data.invoices.length} icon={Receipt} color="accent" subtitle={clientStats.overdueCount ? `${clientStats.overdueCount} متأخرة` : undefined} to="Invoices" />
        <StatCard title="مستنداتي" value={data.documents.length} icon={FileText} color="success" to="Documents" />
        <StatCard title="الإشعارات" value={data.notifications.length} icon={Bell} color="warning" to="Notifications" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <Card className="dashboard-card-elevated rounded-3xl p-5 text-white">
          <div className="flex items-center justify-between mb-4"><h2 className="font-bold flex items-center gap-2"><Receipt className="h-5 w-5 text-sky-300" /> أحدث الفواتير</h2><Link to={createPageUrl("Invoices")} className="text-sky-300 text-xs">عرض الكل</Link></div>
          <div className="space-y-2">
            {data.invoices.slice(0,4).map(inv => {
              const { remaining } = getInvoiceTotals(inv)
              const canPay = remaining > 0 && inv.status !== "مدفوعة"
              return (
                <div key={inv.id} className="dashboard-row-card">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm">{inv.invoice_number||"فاتورة"}</p>
                    <p className="text-xs text-white/50">{inv.case_title||"—"} · {fmtMoney(getInvoiceTotals(inv).total)} د.إ</p>
                    {canPay && <p className="text-[11px] text-amber-300">متبقي: {fmtMoney(remaining)} د.إ</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={inv.status} />
                    {canPay && <a href={`/Payment?token=${btoa(JSON.stringify({id:inv.id,ts:Date.now()})).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_")}`} target="_blank" rel="noreferrer" className="text-[11px] font-bold bg-green-500/20 hover:bg-green-500/30 text-green-300 px-2 py-1 rounded-lg transition-colors">💳 ادفع</a>}
                  </div>
                </div>
              )
            })}
            {data.invoices.length === 0 && <p className="text-white/40 text-sm text-center py-6">لا توجد فواتير</p>}
          </div>
        </Card>

        <Card className="dashboard-card-elevated rounded-3xl p-5 text-white">
          <h2 className="font-bold flex items-center gap-2 mb-4"><Sparkles className="h-5 w-5 text-sky-300" /> إجراءات سريعة</h2>
          <div className="space-y-2">
            {[{icon:Upload,label:"رفع مستند",to:"Documents",color:"text-sky-300"},{icon:Wallet,label:"متابعة الفواتير",to:"Invoices",color:"text-green-300"},{icon:CalendarDays,label:"الجلسات القادمة",to:"Sessions",color:"text-purple-300"}].map(item => (
              <Link key={item.to} to={createPageUrl(item.to)} className="dashboard-row-card hover:border-white/18 transition-colors group flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm"><item.icon className={`h-4 w-4 ${item.color}`} />{item.label}</span>
                <ChevronRight className="h-4 w-4 text-white/30 group-hover:text-white/60" />
              </Link>
            ))}
            {data.officeSettings?.phone && <a href={`https://wa.me/${String(data.officeSettings.phone).replace(/\D+/g,"")}`} target="_blank" rel="noreferrer" className="dashboard-row-card hover:border-white/18 transition-colors group flex items-center justify-between"><span className="flex items-center gap-2 text-sm"><MessageCircle className="h-4 w-4 text-green-300" />واتساب المكتب</span><ChevronRight className="h-4 w-4 text-white/30 group-hover:text-white/60" /></a>}
          </div>
        </Card>
      </div>
      <ClientContactCard user={user} officeSettings={data.officeSettings} />
    </div>
  )

  /* ── STAFF ──────────────────────────────────────────────────────────────── */
  return (
    <div className="space-y-5 page-enter">
      {/* Hero */}
      <section className="hero-electric-panel text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(56,189,248,.14),transparent_40%)] pointer-events-none" />
        <div className="relative flex flex-col xl:flex-row xl:items-center gap-6 xl:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2 items-center">
              <Badge className="bg-white/10 text-sky-200 border-white/10 text-xs">{format(now,"EEEE، dd MMMM yyyy")}</Badge>
              {data.notifications.length > 0 && <Badge className="bg-amber-400/20 text-amber-200 border-amber-200/15 text-xs"><Bell className="h-3 w-3" /> {data.notifications.length} تنبيه</Badge>}
              {urgentTasks.length > 0 && <Badge className="bg-red-400/20 text-red-200 border-red-300/15 text-xs"><AlertTriangle className="h-3 w-3" /> {urgentTasks.length} عاجل</Badge>}
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold">{greeting}، {user?.full_name?.split(" ")[0] || "المستشار"}</h1>
            <p className="text-white/50 text-sm">{activeCases > 0 ? `${activeCases} قضية نشطة` : "لا قضايا نشطة"}{pendingTasks > 0 ? ` · ${pendingTasks} مهمة معلّقة` : ""}{upcomingSessions.length > 0 ? ` · ${upcomingSessions.length} جلسة قادمة` : ""}</p>
            <div className="flex flex-wrap gap-2">
              {[{to:"Cases",label:"القضايا",count:activeCases},{to:"Sessions",label:"الجلسات",count:upcomingSessions.length},{to:"Tasks",label:"المهام",count:pendingTasks},{to:"Clients",label:"الموكلون",count:data.clients.length}].map(item => (
                <Link key={item.to} to={createPageUrl(item.to)}><div className="hero-side-stat min-w-[100px] text-center hover:bg-white/12 transition-colors"><p className="hero-side-label">{item.label}</p><p className="hero-side-value">{item.count}</p></div></Link>
              ))}
            </div>
          </div>
          <div className="xl:w-68 shrink-0 space-y-3">
            <div className="hero-side-stat">
              <div className="flex items-center justify-between mb-2">
                <p className="hero-side-label flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5" /> الإيراد المحصّل</p>
                <p className="text-[10px] text-white/35">آخر 6 أشهر</p>
              </div>
              <p className="hero-side-value">{fmtMoney(revenueStats.collected)} <span className="text-sm font-normal text-white/55">د.إ</span></p>
              <MiniChart data={revenueChart} color="#38bdf8" />
            </div>
            {revenueStats.overdue > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/12 border border-red-400/15">
                <AlertTriangle className="h-4 w-4 text-red-300 shrink-0" />
                <div><p className="text-[11px] font-semibold text-red-200">{revenueStats.overdue} فاتورة متأخرة</p><p className="text-[10px] text-red-300/60">{fmtMoney(revenueStats.overdueAmt)} د.إ مستحق</p></div>
                <Link to={createPageUrl("Invoices")} className="mr-auto"><ChevronRight className="h-4 w-4 text-red-300/50" /></Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPI label="القضايا النشطة"  value={activeCases}                           icon={Briefcase}  color="blue"   to="Cases"    sub={`من ${data.cases.length} إجمالي`} />
        <KPI label="إجمالي الإيراد"  value={`${fmtMoney(revenueStats.total)} د.إ`} icon={BarChart3}   color="green"  to="Invoices" sub={`محصّل: ${fmtMoney(revenueStats.collected)}`} chartData={revenueChart} />
        <KPI label="الموكلون"        value={data.clients.length}                    icon={Users}      color="purple" to="Clients"  sub={`${data.clients.filter(c=>c.status==="نشط").length} نشط`} />
        <KPI label="المهام المعلّقة" value={pendingTasks}                           icon={Target}     color="amber"  to="Tasks"    sub={urgentTasks.length ? `${urgentTasks.length} عاجلة` : "لا شيء عاجل"} />
      </div>

      {/* جلسات + نشاط */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="dashboard-card-elevated rounded-3xl p-5 text-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold flex items-center gap-2"><CalendarDays className="h-5 w-5 text-sky-300" /> الجلسات القادمة</h2>
            <Link to={createPageUrl("Sessions")} className="text-sky-300 text-xs">الكل</Link>
          </div>
          {upcomingSessions.length === 0 ? (
            <div className="text-center py-8"><CalendarDays className="h-8 w-8 text-white/15 mx-auto mb-2" /><p className="text-white/35 text-sm">لا توجد جلسات قادمة</p></div>
          ) : (
            <div className="space-y-2.5">
              {upcomingSessions.map(session => {
                const d    = new Date(session.session_date)
                const soon = differenceInHours(d, now) <= 24
                const lbl  = isToday(d) ? "اليوم" : isTomorrow(d) ? "غداً" : safeFmt(session.session_date,"dd/MM")
                return (
                  <div key={session.id} className={`dashboard-row-card ${soon ? "border-red-400/20 bg-red-500/5" : ""}`}>
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <div className={`w-1 h-10 rounded-full shrink-0 ${soon ? "bg-red-400" : "bg-sky-400"}`} />
                      <div className="min-w-0">
                        <p className="font-semibold text-white text-sm truncate">{session.case_title||"—"}</p>
                        <p className="text-xs text-white/45 truncate">{session.court}{session.hall ? ` · قاعة ${session.hall}` : ""}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-left">
                        <Badge className={`text-[10px] ${soon ? "bg-red-500/20 text-red-200" : "bg-white/8 text-sky-200"} border-0`}>{lbl}</Badge>
                        <p className="text-[10px] text-white/35 mt-0.5 text-center">{safeFmt(session.session_date,"HH:mm")}</p>
                      </div>
                      <CalendarBtn session={session} compact />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        <Card className="dashboard-card-elevated rounded-3xl p-5 text-white">
          <h2 className="font-bold flex items-center gap-2 mb-4"><Activity className="h-5 w-5 text-sky-300" /> النشاط الأخير</h2>
          <div className="space-y-3">
            {recentActivity.map((item, i) => {
              const Icon = item.icon
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-white/6 flex items-center justify-center shrink-0"><Icon className={`h-3.5 w-3.5 ${item.color}`} /></div>
                  <div className="flex-1 min-w-0"><p className="text-sm text-white font-medium truncate">{item.label}</p><p className="text-[11px] text-white/40 truncate">{item.sub}</p></div>
                  <p className="text-[10px] text-white/25 shrink-0">{safeFmt(item.date,"dd/MM")}</p>
                </div>
              )
            })}
            {recentActivity.length === 0 && <p className="text-white/35 text-sm text-center py-6">لا يوجد نشاط حديث</p>}
          </div>
        </Card>
      </div>

      {/* مهام + تنبيهات/قضايا */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="dashboard-card-elevated rounded-3xl p-5 text-white">
          <div className="flex items-center justify-between mb-4"><h2 className="font-bold flex items-center gap-2"><CheckSquare className="h-5 w-5 text-sky-300" /> مهام اليوم</h2><Link to={createPageUrl("Tasks")} className="text-sky-300 text-xs">الكل</Link></div>
          {todayTasks.length === 0 ? (
            <div className="text-center py-6"><Award className="h-8 w-8 text-green-400/30 mx-auto mb-2" /><p className="text-white/35 text-sm">لا توجد مهام لهذا اليوم 🎉</p></div>
          ) : (
            <div className="space-y-2">
              {todayTasks.slice(0,5).map(task => (
                <div key={task.id} className="dashboard-row-card">
                  <div className="flex-1 min-w-0"><p className="text-sm font-medium text-white truncate">{task.title}</p>{task.case_title && <p className="text-[11px] text-white/40">{task.case_title}</p>}</div>
                  <div className="flex items-center gap-2 shrink-0"><StatusBadge status={task.priority} isPriority /><span className="text-[11px] text-white/35">{safeFmt(task.due_date,"HH:mm")}</span></div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {urgentTasks.length > 0 ? (
          <Card className="dashboard-alert-card rounded-3xl p-5 text-white">
            <h2 className="font-bold flex items-center gap-2 mb-4"><AlertTriangle className="h-5 w-5 text-amber-300" /> عاجل — خلال 24 ساعة</h2>
            <div className="space-y-2">
              {urgentTasks.map(task => (
                <div key={task.id} className="dashboard-alert-row">
                  <div className="flex-1 min-w-0"><p className="text-sm font-medium text-white truncate">{task.title}</p>{task.case_title && <p className="text-[11px] text-white/45">{task.case_title}</p>}</div>
                  <div className="flex items-center gap-1.5 shrink-0 text-amber-200"><Clock className="h-3.5 w-3.5" /><span className="text-xs font-bold">{differenceInHours(new Date(task.due_date), now)}س</span></div>
                </div>
              ))}
            </div>
          </Card>
        ) : (
          <Card className="dashboard-card-elevated rounded-3xl p-5 text-white">
            <div className="flex items-center justify-between mb-4"><h2 className="font-bold flex items-center gap-2"><Briefcase className="h-5 w-5 text-sky-300" /> آخر القضايا</h2><Link to={createPageUrl("Cases")} className="text-sky-300 text-xs">الكل</Link></div>
            <div className="space-y-2">
              {data.cases.slice(0,4).map(c => (
                <div key={c.id} className="dashboard-row-card">
                  <div className="flex-1 min-w-0"><p className="text-sm font-medium text-white truncate">{c.title}</p><p className="text-[11px] text-white/40">{c.client_name} · {c.case_type||"قضية"}</p></div>
                  <StatusBadge status={c.status} />
                </div>
              ))}
              {data.cases.length === 0 && <p className="text-white/35 text-sm text-center py-6">لا توجد قضايا</p>}
            </div>
          </Card>
        )}
      </div>

      {/* إشعارات */}
      {data.notifications.length > 0 && (
        <Card className="dashboard-alert-card rounded-3xl p-5 text-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold flex items-center gap-2"><Bell className="h-5 w-5 text-amber-300" /> تنبيهات جديدة</h2>
            <Link to={createPageUrl("Notifications")}><Button variant="outline" size="sm" className="border-white/12 text-white/65 hover:bg-white/8 h-8 text-xs">عرض الكل</Button></Link>
          </div>
          <div className="space-y-2">
            {data.notifications.slice(0,3).map(n => (
              <div key={n.id} className="dashboard-alert-row">
                <div className="flex-1 min-w-0"><p className="font-semibold text-white text-sm">{n.title}</p><p className="text-[11px] text-white/45 truncate">{n.message}</p></div>
                <Badge className="bg-amber-400/15 text-amber-200 border-0 text-[10px] shrink-0">{n.type||"تنبيه"}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
