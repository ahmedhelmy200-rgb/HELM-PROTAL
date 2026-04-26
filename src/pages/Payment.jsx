import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { base44 } from '@/api/base44Client'
import { getInvoiceTotals } from '@/lib/invoiceMath'
import { parsePaymentToken } from '@/lib/paymentLinks'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import {
  CreditCard, Shield, CheckCircle2, AlertCircle, Loader2,
  Receipt, Copy, Banknote, Phone, MessageCircle,
  ChevronLeft, Lock, Star,
} from 'lucide-react'
import { format, isValid } from 'date-fns'

function safeFmt(v, p) {
  if (!v) return ''
  try { const d = new Date(v); return isValid(d) ? format(d, p) : '' } catch { return '' }
}

// ── Stripe theme ─────────────────────────────────────────────────────────────
const STRIPE_APPEARANCE = {
  theme: 'stripe',
  variables: {
    colorPrimary:    '#2563eb',
    colorBackground: '#ffffff',
    colorText:       '#0f172a',
    colorDanger:     '#ef4444',
    fontFamily:      'Cairo, system-ui, sans-serif',
    borderRadius:    '10px',
    spacingUnit:     '5px',
  },
}
const STRIPE_APPEARANCE_DARK = {
  theme: 'night',
  variables: {
    colorPrimary:    '#3b82f6',
    colorBackground: '#060e2a',
    colorText:       '#e2e8f0',
    colorDanger:     '#ef4444',
    fontFamily:      'Cairo, system-ui, sans-serif',
    borderRadius:    '10px',
  },
}

// ══════════════════════════════════════════════════════════════════════════════
// نموذج الدفع بالبطاقة
// ══════════════════════════════════════════════════════════════════════════════
function CardForm({ clientSecret, invoice, totals, onSuccess }) {
  const stripe   = useStripe()
  const elements = useElements()
  const [err,  setErr]  = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!stripe || !elements) return
    setBusy(true); setErr('')
    try {
      const { error: se } = await elements.submit()
      if (se) { setErr(se.message); return }
      const { error: ce } = await stripe.confirmPayment({
        elements, clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/Payment?paid=1&inv=${invoice.id}`,
        },
        redirect: 'if_required',
      })
      if (ce) setErr(ce.message)
      else    onSuccess()
    } catch (ex) { setErr(ex.message) }
    finally { setBusy(false) }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="rounded-2xl border border-slate-200 overflow-hidden p-4 bg-white">
        <PaymentElement options={{ layout: 'tabs', wallets: { applePay: 'auto', googlePay: 'auto' } }} />
      </div>

      {err && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />{err}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || busy}
        className="w-full h-14 rounded-2xl font-black text-base text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ background: busy ? '#94a3b8' : 'linear-gradient(135deg,#1d4ed8,#2563eb)' }}
      >
        {busy
          ? <span className="flex items-center justify-center gap-2"><Loader2 className="h-5 w-5 animate-spin"/>جارٍ المعالجة…</span>
          : <span className="flex items-center justify-center gap-2"><Lock className="h-5 w-5"/>دفع {totals.remaining.toLocaleString('ar')} {invoice.currency || 'د.إ'} الآن</span>
        }
      </button>

      <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
        <Shield className="h-3.5 w-3.5 text-green-500"/>
        تشفير SSL 256-bit — مدعوم بـ Stripe — بياناتك محمية تماماً
      </div>
    </form>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// قسم التحويل البنكي
// ══════════════════════════════════════════════════════════════════════════════
function BankSection({ invoice, office, totals }) {
  const [copied, setCopied] = useState(null)
  const copy = (txt, k) => {
    navigator.clipboard?.writeText(txt).catch(() => {})
    setCopied(k); setTimeout(() => setCopied(null), 2000)
  }

  const rows = [
    { label: 'البنك',          val: office?.bank_name,    key: 'bank' },
    { label: 'رقم الحساب',     val: office?.bank_account, key: 'acc',  mono: true },
    { label: 'IBAN',            val: office?.iban,         key: 'iban', mono: true },
    { label: 'اسم المستفيد',   val: office?.office_name,  key: 'name' },
  ].filter(r => r.val)

  if (!rows.length) return (
    <div className="text-center py-8 text-slate-500 text-sm">
      لم يتم إعداد بيانات التحويل البنكي بعد.<br/>
      يرجى التواصل مع المكتب مباشرة.
    </div>
  )

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 text-center">
        حوّل المبلغ إلى الحساب أدناه ثم أرسل إثبات الدفع للمكتب
      </p>

      <div className="rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden bg-white">
        {rows.map(r => (
          <div key={r.key} className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-slate-500">{r.label}</span>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-semibold text-slate-800 ${r.mono ? 'font-mono' : ''}`}>{r.val}</span>
              <button onClick={() => copy(r.val, r.key)} className="text-blue-500 hover:text-blue-700 transition-colors">
                {copied === r.key ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500"/> : <Copy className="h-3.5 w-3.5"/>}
              </button>
            </div>
          </div>
        ))}
        <div className="flex items-center justify-between px-4 py-3 bg-blue-50">
          <span className="text-sm font-bold text-blue-700">المبلغ المطلوب</span>
          <span className="text-lg font-black text-blue-700">{totals.remaining.toLocaleString('ar')} {invoice.currency || 'د.إ'}</span>
        </div>
        {invoice.invoice_number && (
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-slate-500">مرجع التحويل (ضروري)</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-slate-800">{invoice.invoice_number}</span>
              <button onClick={() => copy(invoice.invoice_number, 'ref')} className="text-blue-500">
                {copied === 'ref' ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500"/> : <Copy className="h-3.5 w-3.5"/>}
              </button>
            </div>
          </div>
        )}
      </div>

      {office?.phone && (
        <a
          href={`https://wa.me/${office.phone.replace(/\D+/g,'')}?text=${encodeURIComponent(`مرحباً، أرسل إثبات تحويل فاتورة ${invoice.invoice_number||''} بقيمة ${totals.remaining.toLocaleString()} ${invoice.currency||'د.إ'}`)}`}
          target="_blank" rel="noreferrer"
          className="flex items-center justify-center gap-2 w-full h-12 rounded-2xl font-bold text-white text-sm transition-all"
          style={{ background: '#25d366' }}
        >
          <MessageCircle className="h-5 w-5"/>إرسال إثبات التحويل عبر واتساب
        </a>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// الصفحة الرئيسية
// ══════════════════════════════════════════════════════════════════════════════
export default function Payment() {
  const params      = new URLSearchParams(window.location.search)
  const token       = params.get('token')
  const paidParam   = params.get('paid')
  const invParam    = params.get('inv')

  const [invoice,       setInvoice]       = useState(null)
  const [office,        setOffice]        = useState(null)
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState('')
  const [tab,           setTab]           = useState('card')
  const [clientSecret,  setClientSecret]  = useState(null)
  const [stripePromise, setStripePromise] = useState(null)
  const [paid,          setPaid]          = useState(false)
  const [intentLoading, setIntentLoading] = useState(false)
  const [intentError,   setIntentError]   = useState('')

  useEffect(() => {
    if (paidParam === '1') { setPaid(true); setLoading(false); return }
    if (!token)            { setError('رابط الدفع غير صالح أو منتهي.'); setLoading(false); return }
    load()
  }, [token, paidParam])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const parsed = parsePaymentToken(token)
      if (!parsed?.id) throw new Error('رابط منتهي الصلاحية.')
      const [invs, sets] = await Promise.all([
        base44.entities.Invoice.filter({ id: parsed.id }, null, 1),
        base44.entities.OfficeSettings.list(),
      ])
      if (!invs?.[0]) throw new Error('لم يتم العثور على الفاتورة.')
      setInvoice(invs[0])
      setOffice(sets?.[0] || null)
      const pubKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || sets?.[0]?.stripe_publishable_key
      if (pubKey && pubKey.startsWith('pk_')) setStripePromise(loadStripe(pubKey))
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [token])

  const createIntent = useCallback(async () => {
    if (!invoice || clientSecret) return
    setIntentLoading(true); setIntentError('')
    try {
      const { remaining } = getInvoiceTotals(invoice)
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: { amount: remaining, currency: (invoice.currency||'AED').toLowerCase(), invoice_id: invoice.id, client_name: invoice.client_name, description: `فاتورة ${invoice.invoice_number||invoice.id}` },
      })
      if (error || data?.error) throw new Error((error||data).message || 'تعذر تجهيز الدفع')
      setClientSecret(data.client_secret)
    } catch (e) { setIntentError(e.message) }
    finally { setIntentLoading(false) }
  }, [invoice, clientSecret])

  useEffect(() => {
    if (invoice && tab === 'card' && !clientSecret && stripePromise) createIntent()
  }, [invoice, tab, stripePromise, clientSecret])

  useEffect(() => {
    if (paid && invParam) base44.entities.Invoice.update(invParam, { status: 'مدفوعة', paid_amount: getInvoiceTotals({}).total }).catch(() => {})
  }, [paid, invParam])

  // ── شاشات الحالة ─────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"/>
        <p className="text-slate-500 text-sm">جارٍ تحميل الفاتورة…</p>
      </div>
    </div>
  )

  if (paid) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-white p-4" dir="rtl">
      <div className="w-full max-w-sm text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
          <CheckCircle2 className="h-10 w-10 text-green-500"/>
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900">تم الدفع بنجاح! 🎉</h1>
          <p className="text-slate-500 mt-2">شكراً لك. تم استلام دفعتك وسيصلك تأكيد قريباً.</p>
        </div>
        {office?.office_name && <p className="text-sm text-slate-600 font-medium">{office.office_name}</p>}
        {office?.phone && (
          <a href={`tel:${office.phone}`} className="flex items-center justify-center gap-2 text-sm text-blue-600">
            <Phone className="h-4 w-4"/>{office.phone}
          </a>
        )}
        <div className="flex items-center justify-center gap-1">
          {[1,2,3,4,5].map(s => <Star key={s} className="h-5 w-5 text-amber-400 fill-amber-400"/>)}
        </div>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4" dir="rtl">
      <div className="w-full max-w-sm text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-red-400 mx-auto"/>
        <h2 className="text-xl font-bold text-slate-900">تعذر فتح رابط الدفع</h2>
        <p className="text-slate-500 text-sm">{error}</p>
      </div>
    </div>
  )

  const totals  = getInvoiceTotals(invoice)
  const isPaid  = invoice.status === 'مدفوعة' || totals.remaining <= 0

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4" dir="rtl">
      <div className="max-w-lg mx-auto space-y-4">

        {/* ── شعار المكتب ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 mb-6">
          <div className="h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-lg shadow">
            {(office?.office_name || 'م')[0]}
          </div>
          <div>
            <p className="font-black text-slate-900">{office?.office_name || 'المكتب القانوني'}</p>
            <p className="text-xs text-slate-500">{office?.lawyer_name || 'منصة الدفع الآمنة'}</p>
          </div>
        </div>

        {/* ── ملخص الفاتورة ───────────────────────────────────────────── */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-blue-600"/>
                <span className="font-bold text-slate-900">{invoice.invoice_number || 'فاتورة'}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${isPaid ? 'bg-green-100 text-green-700' : invoice.status === 'متأخرة' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-700'}`}>
                  {invoice.status}
                </span>
              </div>
              <p className="text-slate-600 font-medium mt-1">{invoice.client_name}</p>
              {invoice.case_title && <p className="text-xs text-slate-400 mt-0.5">⚖️ {invoice.case_title}</p>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'الإجمالي',  val: totals.total.toLocaleString('ar'),     sub: invoice.currency||'د.إ', color: '' },
              { label: 'المدفوع',   val: totals.paid.toLocaleString('ar'),      sub: invoice.currency||'د.إ', color: 'text-green-600' },
              { label: 'المستحق',   val: totals.remaining.toLocaleString('ar'), sub: invoice.currency||'د.إ', color: 'text-blue-700 font-black' },
            ].map((item, i) => (
              <div key={i} className="bg-slate-50 rounded-2xl p-3 text-center">
                <p className="text-xs text-slate-500 mb-1">{item.label}</p>
                <p className={`font-bold text-slate-900 ${item.color}`}>{item.val}</p>
                <p className="text-[10px] text-slate-400">{item.sub}</p>
              </div>
            ))}
          </div>

          {invoice.due_date && (
            <p className="text-xs text-slate-500 mt-3 text-center">
              تاريخ الاستحقاق: <strong>{safeFmt(invoice.due_date, 'yyyy/MM/dd')}</strong>
            </p>
          )}
        </div>

        {/* ── منطقة الدفع ─────────────────────────────────────────────── */}
        {isPaid ? (
          <div className="bg-white rounded-3xl border border-green-200 p-8 text-center shadow-sm">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3"/>
            <p className="font-bold text-slate-900 text-lg">تم سداد هذه الفاتورة ✅</p>
            <p className="text-slate-500 text-sm mt-1">شكراً لك على الالتزام بالدفع.</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">

            {/* اختيار طريقة الدفع */}
            <div className="flex gap-2 mb-5 p-1 bg-slate-100 rounded-2xl">
              {[
                { key: 'card', label: 'بطاقة / محفظة', icon: CreditCard },
                { key: 'bank', label: 'تحويل بنكي',    icon: Banknote   },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === key ? 'bg-white shadow text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <Icon className="h-4 w-4"/>{label}
                </button>
              ))}
            </div>

            {/* محتوى التبويب */}
            {tab === 'card' && (
              <>
                {!stripePromise && (
                  <div className="text-center py-8 space-y-3">
                    <CreditCard className="h-10 w-10 text-slate-300 mx-auto"/>
                    <p className="font-semibold text-slate-700">الدفع بالبطاقة غير مُفعَّل حالياً</p>
                    <p className="text-xs text-slate-500">يرجى استخدام التحويل البنكي أو التواصل مع المكتب.</p>
                    <button onClick={() => setTab('bank')} className="text-sm text-blue-600 underline underline-offset-2">
                      التحويل البنكي ←
                    </button>
                  </div>
                )}
                {stripePromise && intentLoading && (
                  <div className="flex items-center justify-center py-10 gap-3 text-slate-500 text-sm">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600"/>جارٍ تجهيز نافذة الدفع…
                  </div>
                )}
                {stripePromise && intentError && (
                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5"/>{intentError}
                    </div>
                    <button onClick={createIntent} className="w-full h-10 rounded-xl border border-slate-200 text-sm text-slate-700 hover:bg-slate-50">
                      إعادة المحاولة
                    </button>
                  </div>
                )}
                {stripePromise && clientSecret && (
                  <Elements stripe={stripePromise} options={{ clientSecret, appearance: STRIPE_APPEARANCE, locale: 'ar' }}>
                    <CardForm clientSecret={clientSecret} invoice={invoice} totals={totals} onSuccess={() => setPaid(true)}/>
                  </Elements>
                )}
              </>
            )}

            {tab === 'bank' && <BankSection invoice={invoice} office={office} totals={totals}/>}

            {/* طرق الدفع المقبولة */}
            <div className="mt-5 pt-4 border-t border-slate-100">
              <p className="text-xs text-slate-400 text-center mb-3">وسائل الدفع المقبولة</p>
              <div className="flex flex-wrap justify-center gap-2">
                {['💳 Visa','💳 Mastercard','🍎 Apple Pay','🔷 Google Pay','🏦 تحويل بنكي'].map((m,i) => (
                  <span key={i} className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-500">{m}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 flex items-center justify-center gap-1.5 pb-4">
          <Shield className="h-3.5 w-3.5 text-green-500"/>
          مدفوعاتك محمية بتشفير SSL 256-bit عبر Stripe
        </p>
      </div>
    </div>
  )
}
