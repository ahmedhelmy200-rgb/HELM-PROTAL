import React, { useState, useEffect, useMemo, useCallback } from "react"
import { Link } from "react-router-dom"
import { createPageUrl } from "@/utils"
import { base44 } from "@/api/base44Client"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Briefcase, Receipt, CalendarDays, CheckSquare,
  Clock, AlertTriangle, ArrowLeft, Bell, FileText,
  ShieldCheck, MessageCircle, Mail, Upload, Activity, Wallet, Sparkles
} from "lucide-react"
import { format, isToday, isTomorrow, differenceInHours, differenceInDays } from "date-fns"
import { useAuth } from '@/lib/AuthContext'
import StatCard from "../components/helm/StatCard"
import StatusBadge from "../components/helm/StatusBadge"
import ClientContactCard from '@/components/helm/ClientContactCard'
import { checkAndCreateReminders } from "../components/helm/NotificationBell"
import { PageErrorState } from "@/components/app/AppStatusBar"
import { getInvoiceTotals } from "@/lib/invoiceMath"
import { usePageRefresh } from "@/hooks/usePageRefresh"

export default function Dashboard() {
  const { user } = useAuth()
  const [data, setData] = useState({
    cases: [], clients: [], sessions: [], tasks: [], notifications: [], invoices: [], documents: [], officeSettings: null,
  })
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const isClient = user?.role === 'client'

  const loadAll = useCallback(async () => {
    if (!user?.email) return
    setLoading(true)
    setLoadError('')
    try {
      if (isClient) {
      const [cases, invoices, documents, notifications, sessions, settings] = await Promise.all([
        base44.entities.Case.list('-created_date'),
        base44.entities.Invoice.list('-created_date'),
        base44.entities.Document.list('-created_date'),
        base44.entities.Notification.filter({ user_email: user.email, is_read: false }),
        base44.entities.Session.list('-session_date'),
        base44.entities.OfficeSettings.list(),
      ])
      setData({
        cases,
        invoices,
        documents,
        notifications,
        sessions,
        officeSettings: settings?.[0] || null,
        clients: [],
        tasks: [],
      })
      setLoading(false)
      return
    }

    const [cases, clients, sessions, tasks, notifications, invoices, documents, settings] = await Promise.all([
      base44.entities.Case.list("-created_date"),
      base44.entities.Client.list(),
      base44.entities.Session.list("-session_date"),
      base44.entities.Task.list("-due_date"),
      base44.entities.Notification.filter({ user_email: user.email, is_read: false }),
      base44.entities.Invoice.list('-created_date'),
      base44.entities.Document.list('-created_date'),
      base44.entities.OfficeSettings.list(),
    ])

    setData({ cases, clients, sessions, tasks, notifications, invoices, documents, officeSettings: settings?.[0] || null })
    await checkAndCreateReminders(user.email)
    } catch (error) {
      setLoadError(error.message || 'تعذر تحميل لوحة التحكم.')
    } finally {
      setLoading(false)
    }
  }, [user?.email, isClient])

  usePageRefresh(loadAll, ['cases', 'clients', 'sessions', 'tasks', 'notifications', 'invoices', 'documents', 'office_settings'])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const now = new Date()
  const todayTasks = data.tasks.filter((t) => t.status !== "مكتملة" && t.due_date && isToday(new Date(t.due_date)))
  const upcomingSessions = data.sessions
    .filter((s) => s.status === "قادمة" && new Date(s.session_date) >= now)
    .sort((a, b) => new Date(a.session_date) - new Date(b.session_date))
    .slice(0, 5)
  const urgentTasks = data.tasks.filter((t) => t.status !== "مكتملة" && t.due_date && differenceInHours(new Date(t.due_date), now) >= 0 && differenceInHours(new Date(t.due_date), now) <= 24)
  const activeCases = data.cases.filter((c) => c.status === "جارية").length
  const pendingTasks = data.tasks.filter((t) => t.status !== "مكتملة").length

  const clientStats = useMemo(() => {
    const totalInvoices = data.invoices.reduce((sum, inv) => {
      return sum + getInvoiceTotals(inv).total
    }, 0)
    const totalPaid = data.invoices.reduce((sum, inv) => sum + (inv.paid_amount || 0), 0)
    const overdueCount = data.invoices.filter((inv) => inv.status === 'متأخرة').length
    return {
      totalInvoices,
      totalPaid,
      totalRemaining: Math.max(0, totalInvoices - totalPaid),
      overdueCount,
    }
  }, [data.invoices])

  const nextClientSession = useMemo(() => {
    return [...data.sessions]
      .filter((s) => s.session_date && new Date(s.session_date) >= now)
      .sort((a, b) => new Date(a.session_date) - new Date(b.session_date))[0] || null
  }, [data.sessions])

  const recentDocuments = useMemo(() => data.documents.slice(0, 4), [data.documents])
  const recentInvoices = useMemo(() => data.invoices.slice(0, 4), [data.invoices])

  const getSessionLabel = (date) => {
    const d = new Date(date)
    if (isToday(d)) return "اليوم"
    if (isTomorrow(d)) return "غداً"
    return format(d, "dd/MM")
  }

  const monthlyRevenue = useMemo(() => {
    const map = new Map()
    data.invoices.forEach((inv) => {
      const key = format(new Date(inv.created_date || inv.issue_date || new Date()), 'yyyy/MM')
      map.set(key, (map.get(key) || 0) + getInvoiceTotals(inv).paid)
    })
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0])).slice(-4)
  }, [data.invoices])

  const caseTypeBreakdown = useMemo(() => {
    const map = new Map()
    data.cases.forEach((item) => map.set(item.case_type || 'أخرى', (map.get(item.case_type || 'أخرى') || 0) + 1))
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
  }, [data.cases])

  if (loading) {
    return (
      <div className="dashboard-loading-wrap">
        <div className="dashboard-loader-ring" />
      </div>
    )
  }

  if (loadError) {
    return <PageErrorState message={loadError} onRetry={loadAll} />
  }

  if (isClient) {
    return (
      <div className="space-y-6">
        <section className="hero-electric-panel text-white overflow-hidden relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(125,211,252,0.12),transparent_26%)] pointer-events-none" />
          <div className="relative flex flex-col xl:flex-row xl:items-center gap-6 xl:justify-between">
            <div className="space-y-4 max-w-3xl">
              <div className="flex flex-wrap gap-2">
                <Badge className="hero-metric-chip bg-white/10 text-sky-200 border-white/10">
                  <ShieldCheck className="h-4 w-4" /> بوابة الموكّل الآمنة
                </Badge>
                {nextClientSession?.session_date && (
                  <Badge className="hero-metric-chip bg-white/10 text-white border-white/10">
                    <CalendarDays className="h-4 w-4" />
                    الجلسة القادمة {getSessionLabel(nextClientSession.session_date)} {format(new Date(nextClientSession.session_date), 'HH:mm')}
                  </Badge>
                )}
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold">مرحباً {user?.full_name || user?.email}</h1>
                <p className="text-white/75 text-sm mt-2 leading-7">متابعة القضايا والفواتير والمستندات أصبحت أوضح. كل ما يخص الملف القانوني في صفحة واحدة مع وصول أسرع للإجراءات المهمة.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link to={createPageUrl('Cases')}><Button className="bg-white/10 hover:bg-white/15 text-white">قضاياي</Button></Link>
                <Link to={createPageUrl('Invoices')}><Button className="bg-white/10 hover:bg-white/15 text-white">فواتيري</Button></Link>
                <Link to={createPageUrl('Documents')}><Button className="bg-white/10 hover:bg-white/15 text-white">مستنداتي</Button></Link>
                <Link to={createPageUrl('Profile')}><Button className="bg-white/10 hover:bg-white/15 text-white">ملفي</Button></Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 w-full xl:max-w-xl">
              <div className="hero-side-stat"><p className="hero-side-label">القضايا النشطة</p><p className="hero-side-value">{activeCases}</p></div>
              <div className="hero-side-stat"><p className="hero-side-label">إجمالي الفواتير</p><p className="hero-side-value">{clientStats.totalInvoices.toLocaleString('ar')}</p></div>
              <div className="hero-side-stat"><p className="hero-side-label">المدفوع</p><p className="hero-side-value">{clientStats.totalPaid.toLocaleString('ar')}</p></div>
              <div className="hero-side-stat"><p className="hero-side-label">المتبقي</p><p className="hero-side-value">{clientStats.totalRemaining.toLocaleString('ar')}</p></div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard title="قضاياي" value={data.cases.length} icon={Briefcase} color="primary" to="Cases" />
          <StatCard title="فواتيري" value={data.invoices.length} icon={Receipt} color="accent" subtitle={clientStats.overdueCount ? `${clientStats.overdueCount} متأخرة` : 'كل الفواتير'} to="Invoices" />
          <StatCard title="مستنداتي" value={data.documents.length} icon={FileText} color="success" to="Documents" />
          <StatCard title="الإشعارات" value={data.notifications.length} icon={Bell} color="warning" to="Notifications" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card className="dashboard-card-elevated rounded-3xl p-5 md:p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold flex items-center gap-2"><Receipt className="h-5 w-5 text-sky-300" /> الإيرادات المحصلة</h2>
            </div>
            <div className="space-y-3">
              {monthlyRevenue.length === 0 ? <p className="text-white/60 text-sm">لا توجد بيانات كافية بعد.</p> : monthlyRevenue.map(([month, amount]) => (
                <div key={month} className="dashboard-row-card">
                  <span>{month}</span>
                  <span className="font-bold">{amount.toLocaleString('ar')} د.إ</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="dashboard-card-elevated rounded-3xl p-5 md:p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold flex items-center gap-2"><Briefcase className="h-5 w-5 text-sky-300" /> توزيع أنواع القضايا</h2>
            </div>
            <div className="space-y-3">
              {caseTypeBreakdown.length === 0 ? <p className="text-white/60 text-sm">لا توجد بيانات كافية بعد.</p> : caseTypeBreakdown.map(([label, count]) => (
                <div key={label} className="dashboard-row-card">
                  <span>{label}</span>
                  <span className="font-bold">{count}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="dashboard-card-elevated rounded-3xl p-5 md:p-6 text-white xl:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold flex items-center gap-2"><Activity className="h-5 w-5 text-sky-300" /> ملخص الملف</h2>
              <Link to={createPageUrl('Cases')} className="text-sky-200 text-sm">فتح القضايا</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {data.cases.slice(0, 4).map((c) => (
                <div key={c.id} className="dashboard-row-card">
                  <div>
                    <p className="font-semibold text-white">{c.title}</p>
                    <p className="text-xs text-white/65">{c.case_type || 'قضية'} {c.case_number ? `· #${c.case_number}` : ''}</p>
                    {c.court && <p className="text-xs text-white/55 mt-1">{c.court}</p>}
                  </div>
                  <StatusBadge status={c.status} />
                </div>
              ))}
              {data.cases.length === 0 && <p className="text-white/60 text-sm text-center py-8 md:col-span-2">لا توجد قضايا مرتبطة بهذا الحساب حتى الآن.</p>}
            </div>
          </Card>

          <Card className="dashboard-card-elevated rounded-3xl p-5 md:p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold flex items-center gap-2"><Sparkles className="h-5 w-5 text-sky-300" /> إجراءات سريعة</h2>
            </div>
            <div className="space-y-3">
              <Link to={createPageUrl('Documents')} className="dashboard-row-card hover:border-sky-300/25 transition-colors">
                <span className="flex items-center gap-2"><Upload className="h-4 w-4 text-sky-300" /> رفع مستند جديد</span>
                <ArrowLeft className="h-4 w-4 text-white/50" />
              </Link>
              <Link to={createPageUrl('Invoices')} className="dashboard-row-card hover:border-sky-300/25 transition-colors">
                <span className="flex items-center gap-2"><Wallet className="h-4 w-4 text-sky-300" /> متابعة الفواتير</span>
                <ArrowLeft className="h-4 w-4 text-white/50" />
              </Link>
              <a href={`mailto:${data.officeSettings?.email || ''}`} className="dashboard-row-card hover:border-sky-300/25 transition-colors">
                <span className="flex items-center gap-2"><Mail className="h-4 w-4 text-sky-300" /> مراسلة المكتب</span>
                <ArrowLeft className="h-4 w-4 text-white/50" />
              </a>
              <a href={`https://wa.me/${String(data.officeSettings?.social_whatsapp || data.officeSettings?.phone || '').replace(/\D+/g, '')}`} target="_blank" rel="noreferrer" className="dashboard-row-card hover:border-sky-300/25 transition-colors">
                <span className="flex items-center gap-2"><MessageCircle className="h-4 w-4 text-sky-300" /> واتساب المكتب</span>
                <ArrowLeft className="h-4 w-4 text-white/50" />
              </a>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card className="dashboard-card-elevated rounded-3xl p-5 md:p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold flex items-center gap-2"><Receipt className="h-5 w-5 text-sky-300" /> أحدث الفواتير</h2>
              <Link to={createPageUrl('Invoices')} className="text-sky-200 text-sm">عرض الكل</Link>
            </div>
            {recentInvoices.length === 0 ? (
              <p className="text-white/60 text-sm text-center py-8">لا توجد فواتير مرتبطة بحسابك.</p>
            ) : (
              <div className="space-y-3">
                {recentInvoices.map((inv) => {
                  const total = ((inv.total_fees || 0) - (inv.discount || 0)) * (1 + ((inv.vat_rate || 0) / 100))
                  return (
                    <div key={inv.id} className="dashboard-row-card">
                      <div>
                        <p className="font-semibold text-white">{inv.invoice_number || 'فاتورة'}</p>
                        <p className="text-xs text-white/60">{inv.case_title || 'بدون قضية'} · {total.toLocaleString('ar')} د.إ</p>
                      </div>
                      <StatusBadge status={inv.status} />
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

          <Card className="dashboard-card-elevated rounded-3xl p-5 md:p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold flex items-center gap-2"><FileText className="h-5 w-5 text-sky-300" /> أحدث المستندات</h2>
              <Link to={createPageUrl('Documents')} className="text-sky-200 text-sm">عرض الكل</Link>
            </div>
            {recentDocuments.length === 0 ? (
              <p className="text-white/60 text-sm text-center py-8">لا توجد مستندات حتى الآن.</p>
            ) : (
              <div className="space-y-3">
                {recentDocuments.map((doc) => (
                  <div key={doc.id} className="dashboard-row-card">
                    <div>
                      <p className="font-semibold text-white">{doc.title}</p>
                      <p className="text-xs text-white/60">{doc.doc_type || 'مستند'} {doc.created_date ? `· ${format(new Date(doc.created_date), 'yyyy/MM/dd')}` : ''}</p>
                    </div>
                    <StatusBadge status={doc.status || 'جاهز'} />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <ClientContactCard user={user} officeSettings={data.officeSettings} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="hero-electric-panel text-white">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
          <div className="space-y-4 max-w-3xl">
            <div className="flex flex-wrap gap-2">
              <Badge className="hero-metric-chip bg-white/10 text-sky-200 border-white/10">{format(now, "EEEE، dd MMMM yyyy")}</Badge>
              {data.notifications.length > 0 && <Badge className="hero-metric-chip bg-amber-400/15 text-amber-200 border-amber-200/10">{data.notifications.length} تنبيه جديد</Badge>}
            </div>
            <div>
              <h1 className="text-3xl font-extrabold">لوحة التحكم الذكية</h1>
              <p className="text-white/75 text-sm md:text-base mt-2">نظرة فورية على القضايا، المهام، الجلسات، والفواتير. تم ربط الإحصاءات بالصفحات المخصصة للوصول السريع.</p>
            </div>
            <div className="flex flex-wrap gap-3 text-sm">
              <Link to={createPageUrl('Cases')} className="hero-side-stat min-w-[150px]"><p className="hero-side-label">القضايا النشطة</p><p className="hero-side-value">{activeCases}</p></Link>
              <Link to={createPageUrl('Clients')} className="hero-side-stat min-w-[150px]"><p className="hero-side-label">الموكلون</p><p className="hero-side-value">{data.clients.length}</p></Link>
              <Link to={createPageUrl('Tasks')} className="hero-side-stat min-w-[150px]"><p className="hero-side-label">المهام المعلقة</p><p className="hero-side-value">{pendingTasks}</p></Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 w-full xl:max-w-md">
            <StatCard title="الجلسات القادمة" value={upcomingSessions.length} icon={CalendarDays} color="accent" to="Sessions" />
            <StatCard title="الفواتير" value={data.invoices.length} icon={Receipt} color="success" to="Invoices" />
            <StatCard title="المستندات" value={data.documents.length} icon={FileText} color="primary" to="Documents" />
            <StatCard title="التنبيهات" value={data.notifications.length} icon={Bell} color="warning" to="Notifications" />
          </div>
        </div>
      </section>

      {data.notifications.length > 0 && (
        <Card className="dashboard-alert-card p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold flex items-center gap-2"><Bell className="h-5 w-5 text-amber-300" /> تنبيهات عاجلة</h2>
            <Link to={createPageUrl('Notifications')}><Button variant="outline" className="border-white/10 text-white hover:bg-white/10">عرض الكل</Button></Link>
          </div>
          <div className="space-y-2">
            {data.notifications.slice(0, 3).map((notif) => (
              <div key={notif.id} className="dashboard-alert-row">
                <div>
                  <p className="font-semibold text-white">{notif.title}</p>
                  <p className="text-xs text-white/60">{notif.message}</p>
                </div>
                <Badge className="bg-white/10 text-amber-200">{notif.type || 'تنبيه'}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="dashboard-card-elevated rounded-3xl p-5 md:p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold flex items-center gap-2"><CheckSquare className="h-5 w-5 text-sky-300" /> مهام اليوم</h2>
            <Link to={createPageUrl("Tasks")}><Button variant="ghost" size="sm" className="text-sky-200 gap-1">الكل <ArrowLeft className="h-3 w-3" /></Button></Link>
          </div>
          {todayTasks.length === 0 ? (
            <p className="text-white/60 text-sm text-center py-8">لا توجد مهام لهذا اليوم 🎉</p>
          ) : (
            <div className="space-y-2">
              {todayTasks.map(task => (
                <div key={task.id} className="dashboard-row-card">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-white truncate">{task.title}</p>
                    {task.case_title && <p className="text-xs text-white/60">{task.case_title}</p>}
                  </div>
                  <div className="flex items-center gap-2 mr-3 shrink-0">
                    <StatusBadge status={task.priority} isPriority />
                    {task.due_date && <span className="text-xs text-white/55">{format(new Date(task.due_date), "HH:mm")}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="dashboard-card-elevated rounded-3xl p-5 md:p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold flex items-center gap-2"><CalendarDays className="h-5 w-5 text-sky-300" /> الجلسات القادمة</h2>
            <Link to={createPageUrl("Sessions")}><Button variant="ghost" size="sm" className="text-sky-200 gap-1">الكل <ArrowLeft className="h-3 w-3" /></Button></Link>
          </div>
          {upcomingSessions.length === 0 ? (
            <p className="text-white/60 text-sm text-center py-8">لا توجد جلسات قادمة</p>
          ) : (
            <div className="space-y-2">
              {upcomingSessions.map(session => (
                <div key={session.id} className="dashboard-row-card">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-white truncate">{session.case_title}</p>
                    <p className="text-xs text-white/60">{session.court}</p>
                  </div>
                  <div className="flex items-center gap-2 mr-3 shrink-0">
                    <Badge className={`text-xs ${isToday(new Date(session.session_date)) ? "bg-destructive text-white" : "bg-primary/10 text-sky-200"}`}>{getSessionLabel(session.session_date)}</Badge>
                    <span className="text-xs text-white/55">{format(new Date(session.session_date), "HH:mm")}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {urgentTasks.length > 0 && (
        <Card className="dashboard-alert-card p-5 text-white">
          <h2 className="font-bold flex items-center gap-2 mb-3"><AlertTriangle className="h-5 w-5 text-amber-300" /> تنبيهات عاجلة - خلال 24 ساعة</h2>
          <div className="space-y-2">
            {urgentTasks.map(task => (
              <div key={task.id} className="dashboard-alert-row">
                <div>
                  <p className="font-medium text-sm text-white">{task.title}</p>
                  {task.case_title && <p className="text-xs text-white/60">{task.case_title}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-amber-300" />
                  <span className="text-xs font-medium text-amber-200">{differenceInHours(new Date(task.due_date), now)} ساعة</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="dashboard-card-elevated rounded-3xl p-5 md:p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold flex items-center gap-2"><Briefcase className="h-5 w-5 text-sky-300" /> آخر القضايا</h2>
          <Link to={createPageUrl("Cases")}><Button variant="ghost" size="sm" className="text-sky-200 gap-1">كل القضايا <ArrowLeft className="h-3 w-3" /></Button></Link>
        </div>
        {data.cases.length === 0 ? (
          <p className="text-white/60 text-sm text-center py-8">لا توجد قضايا بعد</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm dashboard-table">
              <thead>
                <tr className="border-b border-white/10 text-white/55 text-xs">
                  <th className="text-right pb-2 font-medium">القضية</th>
                  <th className="text-right pb-2 font-medium">الموكل</th>
                  <th className="text-right pb-2 font-medium">النوع</th>
                  <th className="text-right pb-2 font-medium">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.cases.slice(0, 5).map(c => (
                  <tr key={c.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 font-medium text-white">{c.title}</td>
                    <td className="py-3 text-white/65">{c.client_name}</td>
                    <td className="py-3 text-white/65">{c.case_type}</td>
                    <td className="py-3"><StatusBadge status={c.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
