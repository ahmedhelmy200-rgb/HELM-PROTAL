import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/lib/AuthContext'
import OfficeBrandMark from '@/components/helm/OfficeBrandMark'
import {
  AlertCircle, BookOpen, Building2, ChevronLeft, Eye, EyeOff, FileText,
  Gavel, Globe2, Landmark, Lock, LogIn, Mail, MapPin, Scale, Search,
  ShieldCheck, Sparkles, UserPlus, Users
} from 'lucide-react'

const publicHubs = [
  { href: '/uae-legal-guides', icon: Landmark, tag: 'الإمارات 🇦🇪', title: 'دليل القانون الإماراتي', desc: 'التنفيذ، المطالبات، الشيكات، العقود، العمل، الإثبات والاستئناف.' },
  { href: '/egypt-legal-guides', icon: MapPin, tag: 'مصر 🇪🇬', title: 'دليل مصر القانوني', desc: 'العمل، النقض، المحاكم الاقتصادية، العقود والمطالبات والملفات المرتبطة بالإمارات.' },
  { href: '/uae-egypt-legal-services', icon: Scale, tag: 'مصر × الإمارات', title: 'ملفات قانونية بين مصر والإمارات', desc: 'تنظيم الملفات العابرة للحدود، الأحكام، العقود، الأعمال والمستندات.' },
  { href: '/global-legal-services', icon: Globe2, tag: 'دولي 🌍', title: 'الخدمات القانونية الدولية', desc: 'عقود ومطالبات وأحكام وتحكيم ومستندات وملفات متعددة الاختصاصات.' },
]

const deportationGuides = [
  { href: '/deportation-mercy-request-egypt-uae', title: 'استرحام وإلغاء الإبعاد للمصريين من مصر', desc: 'من أين تبدأ إذا كنت في مصر وصدر بحقك إبعاد من الإمارات؟ تحديد نوع الإبعاد والجهة والمستندات.' },
  { href: '/judicial-deportation-uae', title: 'إلغاء الإبعاد القضائي من الإمارات', desc: 'فهم الحكم القضائي، منطوق الإبعاد، بيانات القضية وتجهيز ملف الطلب للجهة المختصة.' },
  { href: '/administrative-deportation-uae', title: 'رفع الإبعاد الإداري من الإمارات', desc: 'الفرق عن الحكم القضائي، سبب القرار، بيانات الإقامة والظروف اللاحقة الداعمة للطلب.' },
]

function LoginPanel({ authMode, setAuthMode, form, setForm, showPassword, setShowPassword, authError, notice, busy, googleLoading, onSubmit, onReset, onGoogle }) {
  return (
    <aside id="login" className="rounded-[28px] border border-[#ded6c8] bg-white p-5 shadow-[0_24px_70px_rgba(23,32,51,.13)] sm:p-7">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-[#f3ead9] px-3 py-1.5 text-xs font-black text-[#80602a]"><ShieldCheck className="h-4 w-4" /> HELM PORTAL</div>
          <h2 className="mt-3 text-2xl font-black text-[#172033]">دخول مساحة العمل</h2>
          <p className="mt-1 text-sm font-semibold leading-6 text-[#756e64]">تسجيل الدخول خاص بعملاء وفريق المكتب. المحتوى القانوني العام لا يحتاج حساباً.</p>
        </div>
        <LogIn className="h-6 w-6 text-[#9a793d]" />
      </div>

      <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-[#f2eee7] p-1">
        <button type="button" onClick={() => setAuthMode('login')} className={`rounded-lg px-3 py-2 text-sm font-black ${authMode === 'login' ? 'bg-[#172033] text-white' : 'text-[#6d665c]'}`}>تسجيل الدخول</button>
        <button type="button" onClick={() => setAuthMode('signup')} className={`rounded-lg px-3 py-2 text-sm font-black ${authMode === 'signup' ? 'bg-[#172033] text-white' : 'text-[#6d665c]'}`}>حساب جديد</button>
      </div>

      {authError && <div className="mb-4 flex gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-800"><AlertCircle className="mt-1 h-4 w-4 shrink-0" />{authError.message || 'تعذر تسجيل الدخول'}</div>}
      {notice && <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-800">{notice}</div>}

      <form onSubmit={onSubmit} className="space-y-3">
        {authMode === 'signup' && <label className="block"><span className="mb-1 block text-xs font-black">الاسم الكامل</span><div className="relative"><UserPlus className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8f8678]" /><input value={form.fullName} onChange={e => setForm(v => ({...v, fullName:e.target.value}))} className="h-12 w-full rounded-xl border border-[#ddd6ca] bg-[#fbfaf7] pr-10 pl-3 outline-none focus:border-[#b79656]" /></div></label>}
        <label className="block"><span className="mb-1 block text-xs font-black">البريد الإلكتروني</span><div className="relative"><Mail className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8f8678]" /><input dir="ltr" type="email" required value={form.email} onChange={e => setForm(v => ({...v, email:e.target.value}))} className="h-12 w-full rounded-xl border border-[#ddd6ca] bg-[#fbfaf7] pr-10 pl-3 text-left outline-none focus:border-[#b79656]" /></div></label>
        <label className="block"><div className="mb-1 flex justify-between"><span className="text-xs font-black">كلمة المرور</span>{authMode === 'login' && <button type="button" onClick={onReset} className="text-xs font-black text-[#8b6b31]">نسيت كلمة المرور؟</button>}</div><div className="relative"><Lock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8f8678]" /><input dir="ltr" type={showPassword ? 'text':'password'} required value={form.password} onChange={e => setForm(v => ({...v, password:e.target.value}))} className="h-12 w-full rounded-xl border border-[#ddd6ca] bg-[#fbfaf7] pr-10 pl-10 text-left outline-none focus:border-[#b79656]" /><button type="button" onClick={() => setShowPassword(v=>!v)} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8f8678]">{showPassword ? <EyeOff className="h-4 w-4"/>:<Eye className="h-4 w-4"/>}</button></div></label>
        <button disabled={busy} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#172033] text-sm font-black text-white disabled:opacity-50">{authMode === 'signup' ? 'إنشاء الحساب':'دخول HELM PORTAL'} <ChevronLeft className="h-4 w-4" /></button>
      </form>
      <button type="button" onClick={onGoogle} disabled={googleLoading || busy} className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#ddd6ca] bg-white text-sm font-black text-[#172033] disabled:opacity-50"><ShieldCheck className="h-4 w-4 text-[#9a793d]" /> الدخول بحساب Google</button>
    </aside>
  )
}

export default function PublicEntry() {
  const { navigateToLogin, signInWithEmail, signUpWithEmail, resetPasswordForEmail, authError, isLoadingAuth, appPublicSettings } = useAuth()
  const [googleLoading,setGoogleLoading]=useState(false)
  const [emailLoading,setEmailLoading]=useState(false)
  const [authMode,setAuthMode]=useState('login')
  const [showPassword,setShowPassword]=useState(false)
  const [notice,setNotice]=useState('')
  const [form,setForm]=useState({fullName:'',email:'',password:''})
  const officeName=appPublicSettings?.office_name || 'أحمد حلمي للاستشارات القانونية'
  const officeLogo=appPublicSettings?.logo_url || null
  const busy=emailLoading || isLoadingAuth

  const handleGoogleLogin=async()=>{setNotice('');setGoogleLoading(true);await navigateToLogin();setTimeout(()=>setGoogleLoading(false),4000)}
  const handleEmailSubmit=async(e)=>{e.preventDefault();setNotice('');setEmailLoading(true);const r=authMode==='signup'?await signUpWithEmail({email:form.email,password:form.password,fullName:form.fullName}):await signInWithEmail(form.email,form.password);setEmailLoading(false);if(r?.ok&&authMode==='signup')setNotice('تم إنشاء الحساب. راجع بريدك إذا كان تأكيد البريد مفعلاً.')}
  const handleResetPassword=async()=>{if(!form.email)return;setEmailLoading(true);const r=await resetPasswordForEmail(form.email);setEmailLoading(false);if(r?.ok)setNotice('تم إرسال رابط إعادة تعيين كلمة المرور إن كان البريد مسجلاً.')}
  useEffect(()=>{if(authError){setGoogleLoading(false);setEmailLoading(false)}},[authError])

  return <div dir="rtl" className="min-h-screen bg-[#f5f2ec] text-[#172033]">
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#101826]/95 shadow-lg backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-8">
        <OfficeBrandMark logoUrl={officeLogo} officeName={officeName} subtitle="HELM Legal — UAE • Egypt • International" compact tone="light" />
        <nav className="hidden items-center gap-2 md:flex">
          <a href="#public-guides" className="rounded-xl px-3 py-2 text-sm font-black text-[#ddd7cd] hover:bg-white/10">الأدلة القانونية</a>
          <a href="#deportation" className="rounded-xl px-3 py-2 text-sm font-black text-[#ddd7cd] hover:bg-white/10">الإبعاد والاسترحام</a>
          <Link to="/PublicLegalLibrary" className="rounded-xl px-3 py-2 text-sm font-black text-[#ddd7cd] hover:bg-white/10">المكتبة</Link>
          <a href="#login" className="rounded-xl bg-[#c8a96b] px-4 py-2 text-sm font-black text-[#111827]">دخول البوابة</a>
        </nav>
      </div>
    </header>

    <main>
      <section className="relative overflow-hidden bg-[#101826] text-white">
        <div className="absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full bg-[#c8a96b]/10 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 md:px-8 lg:grid-cols-[1fr_410px] lg:py-20">
          <div className="flex flex-col justify-center">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#c8a96b]/30 bg-[#c8a96b]/10 px-4 py-2 text-xs font-black text-[#e1c58d]"><Sparkles className="h-4 w-4"/> محتوى قانوني عام — بدون تسجيل دخول</div>
            <p className="mt-7 text-xs font-black tracking-[.25em] text-[#aaa397]">HELM LEGAL</p>
            <h1 className="mt-3 max-w-4xl text-4xl font-black leading-[1.25] md:text-6xl">بوابتك القانونية في <span className="text-[#dcc084]">الإمارات ومصر</span> والملفات الدولية.</h1>
            <p className="mt-6 max-w-3xl text-base font-semibold leading-8 text-[#c9c3b9] md:text-lg">أدلة قانونية عامة ومصادر رسمية ومسارات عملية لفهم نوع الملف والجهة المختصة قبل بدء الإجراء. جميع الصفحات العامة أدناه مفتوحة مباشرة ولا تحتاج إلى حساب.</p>
            <div className="mt-7 flex flex-wrap gap-3"><a href="#public-guides" className="rounded-xl bg-[#c8a96b] px-5 py-3 text-sm font-black text-[#101826]">استكشف الأدلة القانونية</a><a href="#deportation" className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-black text-white">الإبعاد والاسترحام</a></div>
          </div>
          <LoginPanel authMode={authMode} setAuthMode={setAuthMode} form={form} setForm={setForm} showPassword={showPassword} setShowPassword={setShowPassword} authError={authError} notice={notice} busy={busy} googleLoading={googleLoading} onSubmit={handleEmailSubmit} onReset={handleResetPassword} onGoogle={handleGoogleLogin}/>
        </div>
      </section>

      <section id="public-guides" className="mx-auto max-w-7xl px-4 py-14 md:px-8 md:py-18">
        <div className="max-w-3xl"><div className="inline-flex items-center gap-2 rounded-full bg-[#eee5d3] px-3 py-1.5 text-xs font-black text-[#765825]"><BookOpen className="h-4 w-4"/> وصول عام ومباشر</div><h2 className="mt-4 text-3xl font-black md:text-4xl">اختر النطاق القانوني</h2><p className="mt-3 text-base font-semibold leading-8 text-[#6c655b]">هذه الصفحات خارج نظام الحسابات. أي زائر من Google أو من مصر أو الإمارات يستطيع فتحها مباشرة.</p></div>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">{publicHubs.map(({href,icon:Icon,tag,title,desc})=><a key={href} href={href} className="group rounded-3xl border border-[#e2d9ca] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#172033] text-[#d9bc82]"><Icon className="h-5 w-5"/></div><div className="mt-4 text-xs font-black text-[#9a793d]">{tag}</div><h3 className="mt-2 text-lg font-black">{title}</h3><p className="mt-2 text-sm font-medium leading-7 text-[#6c655b]">{desc}</p><span className="mt-4 inline-flex items-center gap-1 text-sm font-black text-[#8b6428]">فتح الصفحة <ChevronLeft className="h-4 w-4"/></span></a>)}</div>
      </section>

      <section id="deportation" className="border-y border-white/10 bg-[#172033] py-14 text-white md:py-18">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-end"><div><div className="inline-flex items-center gap-2 rounded-full border border-[#c8a96b]/30 bg-[#c8a96b]/10 px-3 py-1.5 text-xs font-black text-[#dfc58f]"><Gavel className="h-4 w-4"/> موضوع مطلوب من داخل وخارج الإمارات</div><h2 className="mt-4 text-3xl font-black md:text-4xl">الاسترحام وإلغاء الإبعاد من الإمارات</h2><p className="mt-3 text-base font-semibold leading-8 text-[#c4beb5]">خصصنا مساراً واضحاً للمصري الموجود في مصر، مع فصل الإبعاد القضائي عن الإداري؛ لأن الجهة والمستندات وطريقة الدراسة تختلف.</p></div><a href="/deportation-uae-guide" className="justify-self-start rounded-xl bg-[#c8a96b] px-5 py-3 text-sm font-black text-[#101826] lg:justify-self-end">فتح الدليل الشامل</a></div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">{deportationGuides.map(x=><a key={x.href} href={x.href} className="rounded-3xl border border-white/10 bg-white/[.055] p-5 transition hover:-translate-y-1 hover:border-[#c8a96b]/50 hover:bg-white/[.08]"><div className="mb-3 flex items-center gap-2 text-[#dfc58f]"><FileText className="h-5 w-5"/><span className="text-xs font-black">دليل عام</span></div><h3 className="text-lg font-black leading-7">{x.title}</h3><p className="mt-2 text-sm font-medium leading-7 text-[#bbb5ac]">{x.desc}</p><span className="mt-4 inline-flex items-center gap-1 text-sm font-black text-[#dfc58f]">اقرأ الدليل <ChevronLeft className="h-4 w-4"/></span></a>)}</div>
          <p className="mt-6 text-xs font-semibold leading-6 text-[#aaa49b]">المعلومات عامة ولا تعني ضمان قبول طلب الاسترحام أو رفع الإبعاد. يلزم فحص الحكم أو القرار والجهة المختصة في كل حالة.</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 md:px-8"><div className="rounded-[30px] border border-[#e2d9ca] bg-white p-7 md:flex md:items-center md:justify-between md:gap-8"><div><div className="flex items-center gap-2 text-[#9a793d]"><Search className="h-5 w-5"/><span className="text-xs font-black">مركز المعرفة</span></div><h2 className="mt-2 text-2xl font-black">المكتبة القانونية العامة</h2><p className="mt-2 max-w-3xl text-sm font-semibold leading-7 text-[#6c655b]">محتوى قانوني إضافي يمكن تصفحه دون كشف أي بيانات خاصة بالموكلين أو ملفات المكتب.</p></div><Link to="/PublicLegalLibrary" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#172033] px-5 py-3 text-sm font-black text-white md:mt-0"><BookOpen className="h-4 w-4"/> فتح المكتبة</Link></div></section>
    </main>

    <footer className="border-t border-[#e0d9cf] bg-[#faf8f4] px-4 py-6 md:px-8"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 text-sm font-bold text-[#716a60]"><span>{officeName} © {new Date().getFullYear()}</span><span className="flex items-center gap-2"><Globe2 className="h-4 w-4 text-[#9a793d]"/> HELM Legal — UAE • Egypt • International</span></div></footer>
  </div>
}
