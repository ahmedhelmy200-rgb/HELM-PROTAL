import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { base44 } from '@/api/base44Client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PageErrorState } from '@/components/app/AppStatusBar'
import { usePageRefresh } from '@/hooks/usePageRefresh'
import { getInvoiceTotals } from '@/lib/invoiceMath'
import {
  sessionTomorrowMessage, sessionReminderMessage, sessionResultMessage,
  invoiceReminderMessage, invoiceOverdueMessage, invoicePaidThankMessage,
  caseUpdateMessage, welcomeNewClientMessage,
  openWhatsApp, TEMPLATE_TYPES,
} from '@/lib/whatsappTemplates'
import {
  MessageCircle, Send, Clock, AlertCircle, CheckCircle2,
  CalendarDays, Receipt, Users, Briefcase, Zap, Eye,
  Copy, ChevronDown, ChevronUp, Phone, RefreshCw, X,
} from 'lucide-react'
import { format, isValid, isToday, isTomorrow, isPast, addDays } from 'date-fns'
import { useAuth } from '@/lib/AuthContext'

// ── مساعدات ───────────────────────────────────────────────────────────────────
function safeFmt(v, pat, fb = '—') {
  if (!v) return fb
  try { const d = new Date(v); return isValid(d) ? format(d, pat) : fb } catch { return fb }
}
function cleanPhone(raw) { return String(raw || '').replace(/\D+/g, '') }

// ── بطاقة رسالة واحدة ────────────────────────────────────────────────────────
function MessageCard({ item, onSend, onPreview, sent }) {
  const T = item.templateType

  return (
    <Card className={`p-4 transition-all ${sent ? 'opacity-55 border-green-500/20 bg-green-500/5' : 'hover:shadow-md hover:border-primary/20'}`}>
      <div className='flex items-start justify-between gap-3'>
        <div className='flex gap-3 flex-1 min-w-0'>
          {/* أيقونة النوع */}
          <div className='h-10 w-10 rounded-2xl bg-muted flex items-center justify-center shrink-0 text-lg'>
            {T.icon}
          </div>
          <div className='flex-1 min-w-0'>
            <div className='flex items-center gap-2 flex-wrap'>
              <p className='font-bold text-foreground text-sm'>{item.clientName}</p>
              <Badge variant='outline' className={`text-[10px] px-1.5 py-0 ${T.color}`}>{T.label}</Badge>
              {sent && <Badge className='text-[10px] px-1.5 py-0 bg-green-500/10 text-green-600 border-0'>✓ أُرسلت</Badge>}
            </div>
            <p className='text-xs text-muted-foreground mt-0.5 truncate'>{item.subtitle}</p>
            {item.phone ? (
              <p className='text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5'>
                <Phone className='h-3 w-3' />{item.phone}
              </p>
            ) : (
              <p className='text-[11px] text-destructive flex items-center gap-1 mt-0.5'>
                <Phone className='h-3 w-3' />لا يوجد رقم واتساب
              </p>
            )}
          </div>
        </div>

        <div className='flex items-center gap-1.5 shrink-0'>
          <Button variant='ghost' size='icon' className='h-8 w-8' onClick={() => onPreview(item)} title='معاينة الرسالة'>
            <Eye className='h-3.5 w-3.5' />
          </Button>
          <Button
            size='sm'
            className='gap-1.5 h-8'
            variant={sent ? 'outline' : 'default'}
            onClick={() => onSend(item)}
          >
            <MessageCircle className='h-3.5 w-3.5' />
            {sent ? 'إعادة إرسال' : 'إرسال'}
          </Button>
        </div>
      </div>
    </Card>
  )
}

// ── قسم قابل للطي ────────────────────────────────────────────────────────────
function Section({ title, icon: Icon, count, urgentCount, children, defaultOpen = true, colorClass = '' }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className='w-full flex items-center justify-between gap-3 py-3 px-1 hover:opacity-80 transition-opacity'
      >
        <div className='flex items-center gap-2'>
          <Icon className={`h-5 w-5 ${colorClass || 'text-primary'}`} />
          <span className='font-bold text-foreground'>{title}</span>
          {count > 0 && (
            <Badge variant='secondary' className='text-xs'>{count}</Badge>
          )}
          {urgentCount > 0 && (
            <Badge className='text-xs bg-destructive/10 text-destructive border-0'>{urgentCount} عاجل</Badge>
          )}
        </div>
        {open ? <ChevronUp className='h-4 w-4 text-muted-foreground' /> : <ChevronDown className='h-4 w-4 text-muted-foreground' />}
      </button>
      {open && <div className='space-y-2.5 pb-4'>{children}</div>}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
export default function Communications() {
  const { user } = useAuth()
  const [sessions, setSessions]     = useState([])
  const [invoices, setInvoices]     = useState([])
  const [clients,  setClients]      = useState([])
  const [cases,    setCases]        = useState([])
  const [settings, setSettings]     = useState(null)
  const [loading,  setLoading]      = useState(true)
  const [loadError,setLoadError]    = useState('')
  const [sentIds,  setSentIds]      = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('helm_wa_sent') || '[]')) } catch { return new Set() }
  })
  const [preview,  setPreview]      = useState(null) // { message, item }
  const [editMsg,  setEditMsg]      = useState('')
  const [customDialog, setCustomDialog] = useState(false)
  const [customForm, setCustomForm] = useState({ phone: '', message: '' })

  // ── جلب البيانات ──────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const [sess, inv, cl, cs, sets] = await Promise.all([
        base44.entities.Session.list('-session_date', 200),
        base44.entities.Invoice.list('-created_date', 300),
        base44.entities.Client.list('-created_date', 500),
        base44.entities.Case.list('-created_date', 200),
        base44.entities.OfficeSettings.list(),
      ])
      setSessions(sess)
      setInvoices(inv)
      setClients(cl)
      setCases(cs)
      setSettings(sets?.[0] || null)
    } catch (err) {
      setLoadError(err.message || 'تعذر تحميل البيانات.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])
  usePageRefresh(loadData, ['sessions', 'invoices', 'clients'])

  // ── lookup الموكلين ────────────────────────────────────────────────────────
  const clientLookup = useMemo(() =>
    Object.fromEntries(clients.map(c => [c.full_name, c]))
  , [clients])

  // ── بناء قائمة الرسائل ────────────────────────────────────────────────────
  const messageItems = useMemo(() => {
    const items = []
    const now   = new Date()
    const in7d  = addDays(now, 7)

    // ── جلسات غداً ──────────────────────────────────────────────────────────
    sessions
      .filter(s => s.session_date && isValid(new Date(s.session_date)) && isTomorrow(new Date(s.session_date)) && s.status === 'قادمة')
      .forEach(s => {
        const client = clientLookup[s.client_name] || {}
        items.push({
          id: `ses_tmr_${s.id}`,
          type: 'session_tomorrow',
          templateType: TEMPLATE_TYPES.SESSION_TOMORROW,
          clientName: s.client_name || '—',
          subtitle: `${s.court || '—'} · ${safeFmt(s.session_date, 'HH:mm')}`,
          phone: cleanPhone(client.phone || s.client_phone),
          priority: 1,
          rawData: s,
          buildMessage: () => sessionTomorrowMessage(s, settings),
        })
      })

    // ── جلسات هذا الأسبوع (بعد غد - 7 أيام) ──────────────────────────────
    sessions
      .filter(s => {
        if (!s.session_date || !isValid(new Date(s.session_date))) return false
        const d = new Date(s.session_date)
        return d > addDays(now, 1) && d <= in7d && s.status === 'قادمة'
      })
      .forEach(s => {
        const client = clientLookup[s.client_name] || {}
        items.push({
          id: `ses_rem_${s.id}`,
          type: 'session_reminder',
          templateType: TEMPLATE_TYPES.SESSION_REMINDER,
          clientName: s.client_name || '—',
          subtitle: `${s.court || '—'} · ${safeFmt(s.session_date, 'dd/MM HH:mm')}`,
          phone: cleanPhone(client.phone),
          priority: 2,
          rawData: s,
          buildMessage: () => sessionReminderMessage(s, settings),
        })
      })

    // ── جلسات منتهية لم ترسل نتيجتها ─────────────────────────────────────
    sessions
      .filter(s => {
        if (!s.session_date || !isValid(new Date(s.session_date))) return false
        const d = new Date(s.session_date)
        return isPast(d) && s.status === 'منعقدة' && s.result
      })
      .slice(0, 5)
      .forEach(s => {
        const client = clientLookup[s.client_name] || {}
        items.push({
          id: `ses_res_${s.id}`,
          type: 'session_result',
          templateType: TEMPLATE_TYPES.SESSION_RESULT,
          clientName: s.client_name || '—',
          subtitle: `نتيجة: ${s.result?.slice(0, 40) || '—'}`,
          phone: cleanPhone(client.phone),
          priority: 2,
          rawData: s,
          buildMessage: () => sessionResultMessage(s, settings),
        })
      })

    // ── فواتير متأخرة ────────────────────────────────────────────────────────
    invoices
      .filter(inv => inv.status === 'متأخرة')
      .forEach(inv => {
        const client = clientLookup[inv.client_name] || {}
        const { remaining } = getInvoiceTotals(inv)
        items.push({
          id: `inv_ovd_${inv.id}`,
          type: 'invoice_overdue',
          templateType: TEMPLATE_TYPES.INVOICE_OVERDUE,
          clientName: inv.client_name || '—',
          subtitle: `${inv.invoice_number || '—'} · ${remaining.toLocaleString('ar')} د.إ متبقي`,
          phone: cleanPhone(client.phone),
          priority: 1,
          rawData: inv,
          buildMessage: () => invoiceOverdueMessage(inv, settings),
        })
      })

    // ── فواتير صادرة (لم تُسدَّد بعد) ───────────────────────────────────────
    invoices
      .filter(inv => inv.status === 'صادرة' || inv.status === 'مدفوعة جزئياً')
      .slice(0, 10)
      .forEach(inv => {
        const client = clientLookup[inv.client_name] || {}
        const { remaining } = getInvoiceTotals(inv)
        if (remaining <= 0) return
        items.push({
          id: `inv_rem_${inv.id}`,
          type: 'invoice_reminder',
          templateType: TEMPLATE_TYPES.INVOICE_REMINDER,
          clientName: inv.client_name || '—',
          subtitle: `${inv.invoice_number || '—'} · ${remaining.toLocaleString('ar')} د.إ`,
          phone: cleanPhone(client.phone),
          priority: 2,
          rawData: inv,
          buildMessage: () => invoiceReminderMessage(inv, settings),
        })
      })

    // ── موكلون جدد (آخر 7 أيام) ──────────────────────────────────────────
    clients
      .filter(c => {
        if (!c.created_date || !isValid(new Date(c.created_date))) return false
        return new Date(c.created_date) >= addDays(now, -7)
      })
      .slice(0, 5)
      .forEach(c => {
        items.push({
          id: `cl_new_${c.id}`,
          type: 'welcome_client',
          templateType: TEMPLATE_TYPES.WELCOME_CLIENT,
          clientName: c.full_name || '—',
          subtitle: `موكّل جديد · ${safeFmt(c.created_date, 'dd/MM/yyyy')}`,
          phone: cleanPhone(c.phone),
          priority: 2,
          rawData: c,
          buildMessage: () => welcomeNewClientMessage(c, settings),
        })
      })

    return items.sort((a, b) => a.priority - b.priority)
  }, [sessions, invoices, clients, settings, clientLookup])

  // ── إرسال ─────────────────────────────────────────────────────────────────
  const handleSend = (item) => {
    const msg = item.buildMessage()
    openWhatsApp(item.phone, msg)
    markSent(item.id)
  }

  const handlePreview = (item) => {
    setEditMsg(item.buildMessage())
    setPreview(item)
  }

  const handleSendFromPreview = () => {
    if (!preview) return
    openWhatsApp(preview.phone, editMsg)
    markSent(preview.id)
    setPreview(null)
  }

  const markSent = (id) => {
    setSentIds(prev => {
      const next = new Set(prev)
      next.add(id)
      try { localStorage.setItem('helm_wa_sent', JSON.stringify([...next])) } catch {}
      return next
    })
  }

  const handleSendCustom = () => {
    if (!customForm.message) return
    openWhatsApp(customForm.phone, customForm.message)
    setCustomDialog(false)
    setCustomForm({ phone: '', message: '' })
  }

  const copyToClipboard = (text) => {
    navigator.clipboard?.writeText(text).catch(() => {})
  }

  // ── إحصائيات ──────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const urgent   = messageItems.filter(i => i.priority === 1).length
    const pending  = messageItems.filter(i => !sentIds.has(i.id)).length
    const sentToday= messageItems.filter(i => sentIds.has(i.id)).length
    return { urgent, pending, sentToday, total: messageItems.length }
  }, [messageItems, sentIds])

  // ── تصنيف الرسائل ─────────────────────────────────────────────────────────
  const byType = useMemo(() => ({
    sessionsTmr : messageItems.filter(i => i.type === 'session_tomorrow'),
    sessionsRem : messageItems.filter(i => i.type === 'session_reminder'),
    sessionsRes : messageItems.filter(i => i.type === 'session_result'),
    invoicesOvd : messageItems.filter(i => i.type === 'invoice_overdue'),
    invoicesRem : messageItems.filter(i => i.type === 'invoice_reminder'),
    newClients  : messageItems.filter(i => i.type === 'welcome_client'),
  }), [messageItems])

  if (loading) return (
    <div className='flex items-center justify-center min-h-[60vh]'>
      <div className='text-center space-y-3'>
        <div className='w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto' />
        <p className='text-sm text-muted-foreground'>جارٍ تحميل بيانات التواصل…</p>
      </div>
    </div>
  )

  if (loadError) return <PageErrorState title='تعذر تحميل البيانات' message={loadError} onRetry={loadData} />

  return (
    <div className='space-y-6'>

      {/* ── الرأس ─────────────────────────────────────────────────────────── */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-black text-foreground flex items-center gap-2'>
            <MessageCircle className='h-6 w-6 text-green-500' />
            مركز التواصل
          </h1>
          <p className='text-muted-foreground text-sm mt-0.5'>رسائل واتساب جاهزة للإرسال بضغطة واحدة</p>
        </div>
        <div className='flex items-center gap-2'>
          <Button variant='outline' size='sm' onClick={loadData} className='gap-1.5'>
            <RefreshCw className='h-3.5 w-3.5' />تحديث
          </Button>
          <Button size='sm' className='gap-1.5 bg-green-600 hover:bg-green-700 text-white' onClick={() => setCustomDialog(true)}>
            <Send className='h-3.5 w-3.5' />رسالة مخصصة
          </Button>
        </div>
      </div>

      {/* ── بطاقات الإحصاء ───────────────────────────────────────────────── */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
        {[
          { label: 'عاجلة',         value: stats.urgent,    icon: AlertCircle,  color: 'text-destructive', bg: 'bg-destructive/10' },
          { label: 'في الانتظار',   value: stats.pending,   icon: Clock,        color: 'text-amber-500',   bg: 'bg-amber-500/10'   },
          { label: 'تم إرسالها',    value: stats.sentToday, icon: CheckCircle2, color: 'text-green-500',   bg: 'bg-green-500/10'   },
          { label: 'إجمالي اليوم',  value: stats.total,     icon: MessageCircle,color: 'text-primary',     bg: 'bg-primary/10'     },
        ].map((s, i) => {
          const Icon = s.icon
          return (
            <Card key={i} className='p-4 flex items-center gap-3'>
              <div className={`h-10 w-10 rounded-2xl ${s.bg} flex items-center justify-center shrink-0`}>
                <Icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div>
                <p className='text-2xl font-black text-foreground leading-none'>{s.value}</p>
                <p className='text-xs text-muted-foreground mt-0.5'>{s.label}</p>
              </div>
            </Card>
          )
        })}
      </div>

      {/* ── تنبيه لا يوجد رقم ────────────────────────────────────────────── */}
      {messageItems.filter(i => !i.phone).length > 0 && (
        <Card className='p-4 bg-amber-500/8 border-amber-500/20 flex items-start gap-3'>
          <AlertCircle className='h-5 w-5 text-amber-500 shrink-0 mt-0.5' />
          <div>
            <p className='font-semibold text-foreground text-sm'>بعض الموكّلين بدون رقم هاتف</p>
            <p className='text-xs text-muted-foreground mt-0.5'>
              {messageItems.filter(i => !i.phone).length} رسالة لن تُفتح واتساب تلقائياً — يمكنك إرسالها بعد نسخ الرسالة يدوياً.
            </p>
          </div>
        </Card>
      )}

      {/* ── لا توجد رسائل ────────────────────────────────────────────────── */}
      {messageItems.length === 0 && (
        <Card className='p-10 text-center space-y-3'>
          <div className='text-5xl'>🎉</div>
          <p className='font-bold text-foreground text-lg'>لا توجد رسائل معلّقة</p>
          <p className='text-sm text-muted-foreground'>كل الجلسات والفواتير والموكلون تم التواصل بشأنهم</p>
          <Button variant='outline' onClick={() => setCustomDialog(true)} className='gap-2 mt-2'>
            <Send className='h-4 w-4' />إرسال رسالة مخصصة
          </Button>
        </Card>
      )}

      {/* ── أقسام الرسائل ────────────────────────────────────────────────── */}
      {messageItems.length > 0 && (
        <div className='space-y-1 divide-y divide-border'>

          {byType.sessionsTmr.length > 0 && (
            <Section title='جلسات غداً' icon={CalendarDays} count={byType.sessionsTmr.length} urgentCount={byType.sessionsTmr.length} colorClass='text-primary' defaultOpen>
              {byType.sessionsTmr.map(item => (
                <MessageCard key={item.id} item={item} onSend={handleSend} onPreview={handlePreview} sent={sentIds.has(item.id)} />
              ))}
            </Section>
          )}

          {byType.invoicesOvd.length > 0 && (
            <Section title='فواتير متأخرة' icon={Receipt} count={byType.invoicesOvd.length} urgentCount={byType.invoicesOvd.length} colorClass='text-destructive' defaultOpen>
              {byType.invoicesOvd.map(item => (
                <MessageCard key={item.id} item={item} onSend={handleSend} onPreview={handlePreview} sent={sentIds.has(item.id)} />
              ))}
            </Section>
          )}

          {byType.sessionsRem.length > 0 && (
            <Section title='جلسات هذا الأسبوع' icon={CalendarDays} count={byType.sessionsRem.length} colorClass='text-blue-500' defaultOpen={byType.sessionsTmr.length === 0}>
              {byType.sessionsRem.map(item => (
                <MessageCard key={item.id} item={item} onSend={handleSend} onPreview={handlePreview} sent={sentIds.has(item.id)} />
              ))}
            </Section>
          )}

          {byType.invoicesRem.length > 0 && (
            <Section title='تذكير سداد الفواتير' icon={Receipt} count={byType.invoicesRem.length} colorClass='text-amber-500' defaultOpen={false}>
              {byType.invoicesRem.map(item => (
                <MessageCard key={item.id} item={item} onSend={handleSend} onPreview={handlePreview} sent={sentIds.has(item.id)} />
              ))}
            </Section>
          )}

          {byType.sessionsRes.length > 0 && (
            <Section title='إبلاغ بنتائج الجلسات' icon={CheckCircle2} count={byType.sessionsRes.length} colorClass='text-green-500' defaultOpen={false}>
              {byType.sessionsRes.map(item => (
                <MessageCard key={item.id} item={item} onSend={handleSend} onPreview={handlePreview} sent={sentIds.has(item.id)} />
              ))}
            </Section>
          )}

          {byType.newClients.length > 0 && (
            <Section title='ترحيب بموكلين جدد' icon={Users} count={byType.newClients.length} colorClass='text-accent' defaultOpen={false}>
              {byType.newClients.map(item => (
                <MessageCard key={item.id} item={item} onSend={handleSend} onPreview={handlePreview} sent={sentIds.has(item.id)} />
              ))}
            </Section>
          )}
        </div>
      )}

      {/* ── نافذة معاينة وتعديل الرسالة ─────────────────────────────────── */}
      <Dialog open={!!preview} onOpenChange={() => setPreview(null)}>
        <DialogContent className='max-w-md' dir='rtl'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <span className='text-xl'>{preview?.templateType?.icon}</span>
              معاينة الرسالة — {preview?.clientName}
            </DialogTitle>
          </DialogHeader>
          <div className='space-y-4'>
            {preview?.phone ? (
              <div className='flex items-center gap-2 text-sm text-muted-foreground bg-muted/40 rounded-xl px-3 py-2'>
                <Phone className='h-4 w-4 text-green-500' />
                <span dir='ltr'>+{preview.phone}</span>
              </div>
            ) : (
              <div className='flex items-center gap-2 text-sm text-destructive bg-destructive/8 rounded-xl px-3 py-2'>
                <Phone className='h-4 w-4' />
                لا يوجد رقم — ستُفتح واتساب بدون رقم محدد
              </div>
            )}
            <Textarea
              value={editMsg}
              onChange={e => setEditMsg(e.target.value)}
              className='min-h-[240px] text-sm leading-7 resize-none font-mono'
              dir='rtl'
            />
            <p className='text-[11px] text-muted-foreground'>يمكنك تعديل الرسالة قبل الإرسال. التعديلات مؤقتة ولا تُحفظ.</p>
          </div>
          <div className='flex justify-between gap-3 mt-2'>
            <Button variant='outline' size='sm' className='gap-1.5' onClick={() => copyToClipboard(editMsg)}>
              <Copy className='h-3.5 w-3.5' />نسخ
            </Button>
            <div className='flex gap-2'>
              <Button variant='outline' onClick={() => setPreview(null)}>إغلاق</Button>
              <Button className='gap-1.5 bg-green-600 hover:bg-green-700 text-white' onClick={handleSendFromPreview}>
                <MessageCircle className='h-4 w-4' />فتح واتساب
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── نافذة الرسالة المخصصة ────────────────────────────────────────── */}
      <Dialog open={customDialog} onOpenChange={setCustomDialog}>
        <DialogContent className='max-w-md' dir='rtl'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <Zap className='h-5 w-5 text-green-500' />
              رسالة واتساب مخصصة
            </DialogTitle>
          </DialogHeader>
          <div className='space-y-4'>
            <div className='space-y-1.5'>
              <label className='text-sm font-medium text-foreground'>رقم الهاتف</label>
              <Input
                placeholder='971501234567 (بدون + أو أصفار)'
                value={customForm.phone}
                onChange={e => setCustomForm(f => ({ ...f, phone: e.target.value }))}
                dir='ltr'
                className='h-11'
              />
            </div>
            <div className='space-y-1.5'>
              <label className='text-sm font-medium text-foreground'>نص الرسالة</label>
              <Textarea
                placeholder='اكتب رسالتك هنا...'
                value={customForm.message}
                onChange={e => setCustomForm(f => ({ ...f, message: e.target.value }))}
                className='min-h-[160px] text-sm leading-7 resize-none'
                dir='rtl'
              />
            </div>
          </div>
          <div className='flex justify-end gap-2 mt-2'>
            <Button variant='outline' onClick={() => setCustomDialog(false)}>إلغاء</Button>
            <Button
              disabled={!customForm.message}
              className='gap-1.5 bg-green-600 hover:bg-green-700 text-white'
              onClick={handleSendCustom}
            >
              <MessageCircle className='h-4 w-4' />فتح واتساب
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}
