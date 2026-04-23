import React, { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { appParams } from '@/lib/app-params'
import {
  Scale, ShieldCheck, FileText, BarChart2,
  MessageCircle, LogIn, ChevronLeft, Star, Zap,
  AlertCircle, RefreshCw, CheckCircle2,
} from 'lucide-react'

// ── خلفية الجسيمات ───────────────────────────────────────────────────────────
function ParticleCanvas() {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current
    const ctx    = canvas.getContext('2d')
    let raf

    const setSize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    setSize()
    window.addEventListener('resize', setSize, { passive: true })

    const N   = 65
    const pts = Array.from({ length: N }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - .5) * .38, vy: (Math.random() - .5) * .38,
      r: Math.random() * 1.4 + .5, p: Math.random() * Math.PI * 2,
    }))
    let sparks = [], st = 0
    const mouse = { x: -9999, y: -9999 }
    const onMove = e => { mouse.x = e.clientX; mouse.y = e.clientY }
    window.addEventListener('mousemove', onMove, { passive: true })

    const draw = () => {
      raf = requestAnimationFrame(draw)
      const W = canvas.width, H = canvas.height
      ctx.clearRect(0, 0, W, H)
      pts.forEach(p => {
        const dx = mouse.x - p.x, dy = mouse.y - p.y
        const d  = Math.hypot(dx, dy)
        if (d < 180 && d > 1) { const f = 7e-5*(180-d); p.vx += dx/d*f; p.vy += dy/d*f }
        p.vx *= .991; p.vy *= .991; p.x += p.vx; p.y += p.vy; p.p += .011
        if (p.x < -10) p.x = W+10; if (p.x > W+10) p.x = -10
        if (p.y < -10) p.y = H+10; if (p.y > H+10) p.y = -10
      })
      for (let i = 0; i < N; i++)
        for (let j = i+1; j < N; j++) {
          const d = Math.hypot(pts[i].x-pts[j].x, pts[i].y-pts[j].y)
          if (d < 115) {
            ctx.strokeStyle = `rgba(96,165,250,${(1-d/115)*.13})`
            ctx.lineWidth = .5; ctx.beginPath()
            ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y); ctx.stroke()
          }
        }
      pts.forEach(p => {
        const d = Math.hypot(mouse.x-p.x, mouse.y-p.y)
        if (d < 155) {
          ctx.strokeStyle = `rgba(147,197,253,${(1-d/155)*.26})`
          ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke()
        }
      })
      ctx.shadowBlur = 6; ctx.shadowColor = 'rgba(96,165,250,.35)'
      pts.forEach(p => {
        const r = 1 + Math.sin(p.p) * .32
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI*2)
        ctx.fillStyle = 'rgba(147,197,253,.45)'; ctx.fill()
      })
      ctx.shadowBlur = 0
      st++
      if (st > 45 && Math.random() < .055) {
        st = 0
        const i = Math.floor(Math.random()*N), j = Math.floor(Math.random()*N)
        if (i!==j) { const d = Math.hypot(pts[i].x-pts[j].x, pts[i].y-pts[j].y); if (d<88&&d>14) sparks.push({x1:pts[i].x,y1:pts[i].y,x2:pts[j].x,y2:pts[j].y,life:8}) }
      }
      sparks = sparks.filter(s => s.life > 0)
      sparks.forEach(s => {
        ctx.strokeStyle = `rgba(200,237,255,${(s.life/8)*.55})`; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(s.x1, s.y1)
        for (let k=1;k<5;k++) { const t=k/5; ctx.lineTo(s.x1+(s.x2-s.x1)*t+(Math.random()-.5)*12, s.y1+(s.y2-s.y1)*t+(Math.random()-.5)*12) }
        ctx.lineTo(s.x2, s.y2); ctx.stroke(); s.life--
      })
    }
    draw()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', setSize); window.removeEventListener('mousemove', onMove) }
  }, [])
  return <canvas ref={ref} className="fixed inset-0 z-0 pointer-events-none" />
}

// ── بطاقة ميزة ───────────────────────────────────────────────────────────────
function Feature({ icon: Icon, title, desc }) {
  return (
    <div className="flex items-start gap-3 p-3.5 rounded-2xl border border-white/8 bg-white/4 hover:bg-white/8 hover:border-white/14 transition-all group cursor-default">
      <div className="h-8 w-8 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0 group-hover:bg-blue-500/28 transition-colors">
        <Icon className="h-4 w-4 text-blue-300" />
      </div>
      <div>
        <p className="text-sm font-bold text-white/90">{title}</p>
        <p className="text-xs text-white/45 mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}

// ── بطاقة خطأ ────────────────────────────────────────────────────────────────
function AuthErrorCard({ error, onRetry }) {
  const isSetup = error?.type === 'oauth_error' || error?.type === 'network_error'
  const isNoReg = error?.type === 'user_not_registered'

  return (
    <div className="rounded-2xl border border-red-400/25 bg-red-500/10 p-4 space-y-3">
      <div className="flex items-start gap-2">
        <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-red-300">
            {isNoReg ? 'حسابك غير مسجّل في النظام' : isSetup ? 'خطأ في إعداد تسجيل الدخول' : 'تعذر تسجيل الدخول'}
          </p>
          <p className="text-xs text-red-300/70 mt-1 leading-5">{error?.message}</p>
        </div>
      </div>
      {isSetup && (
        <div className="text-xs text-white/50 space-y-1.5 border-t border-white/8 pt-3">
          <p className="font-semibold text-white/70 mb-2">خطوات الحل:</p>
          {[
            'تأكد أن VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY صحيحان في ملف .env',
            'في Supabase → Authentication → URL Configuration → أضف http://localhost:5173 في Redirect URLs',
            'في Supabase → Authentication → Providers → فعّل Google وأضف Client ID و Secret',
            'في Google Cloud Console → OAuth → أضف http://localhost:5173 في Authorized redirect URIs',
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="w-4 h-4 rounded-full bg-white/15 text-[9px] flex items-center justify-center shrink-0 mt-0.5 font-bold text-white/60">{i+1}</span>
              <span className="leading-5">{step}</span>
            </div>
          ))}
        </div>
      )}
      {isNoReg && (
        <p className="text-xs text-white/50 border-t border-white/8 pt-3">
          تواصل مع مدير المكتب لإضافة حسابك في النظام قبل محاولة الدخول.
        </p>
      )}
      <button
        onClick={onRetry}
        className="flex items-center gap-1.5 text-xs text-blue-300 hover:text-blue-200 transition-colors"
      >
        <RefreshCw className="h-3.5 w-3.5" /> حاول مرة أخرى
      </button>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
export default function PublicEntry() {
  const { navigateToLogin, authError, isLoadingAuth } = useAuth()
  const [loading, setLoading] = useState(null)

  const handleLogin = async () => {
    setLoading(true)
    await navigateToLogin()
    // إذا لم يتم الـ redirect (خطأ) نعيد الزر
    setTimeout(() => setLoading(false), 4000)
  }

  // إذا كان هناك خطأ، نعيد تفعيل الزر
  useEffect(() => { if (authError) setLoading(false) }, [authError])

  const FEATURES = [
    { icon: Scale,         title: 'إدارة القضايا',        desc: 'متابعة كاملة للقضايا والجلسات' },
    { icon: BarChart2,     title: 'تقارير احترافية',      desc: 'إحصائيات الإيرادات والأداء' },
    { icon: MessageCircle, title: 'تواصل واتساب',         desc: 'رسائل تلقائية للموكلين' },
    { icon: FileText,      title: 'مستندات ذكية',         desc: 'أرشفة وتصنيف فوري' },
    { icon: ShieldCheck,   title: 'أمان عالي',             desc: 'تشفير وصلاحيات متعددة' },
    { icon: Zap,           title: 'دفع إلكتروني',         desc: 'Stripe — Apple Pay — Google Pay' },
  ]

  return (
    <div
      dir="rtl"
      className="min-h-screen relative overflow-hidden flex flex-col"
      style={{ background: 'radial-gradient(ellipse at 20% 20%, rgba(37,99,235,.18), transparent 45%), radial-gradient(ellipse at 80% 80%, rgba(6,182,212,.12), transparent 45%), linear-gradient(180deg,#03070f,#060d1f 50%,#04091a)' }}
    >
      <ParticleCanvas />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="relative z-10 flex items-center justify-between px-5 py-4 md:px-10">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Scale className="h-4.5 w-4.5 text-white" />
          </div>
          <div>
            <p className="font-black text-white text-base leading-none">{appParams.appName}</p>
            <p className="text-[10px] text-blue-300/60 mt-0.5">منظومة إدارة المكتب القانوني</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 online-dot" />
          <span className="text-[11px] text-white/40">النظام يعمل</span>
        </div>
      </header>

      {/* ── Main ───────────────────────────────────────────────────────────── */}
      <main className="relative z-10 flex-1 flex items-center px-4 py-6 md:px-10">
        <div className="w-full max-w-6xl mx-auto grid md:grid-cols-[1fr,400px] gap-10 md:gap-14 items-center">

          {/* ── اليسار — الشعار ─────────────────────────────────────────────── */}
          <div className="space-y-6 md:space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-400/20 bg-blue-400/8 text-blue-300 text-[11px] font-semibold">
                <Star className="h-3 w-3 fill-current" />
                نظام قانوني متكامل باللغة العربية
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white leading-tight">
                أدِر مكتبك
                <span className="block mt-1 bg-gradient-to-l from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                  بذكاء واحترافية
                </span>
              </h1>
              <p className="text-white/55 text-sm md:text-base leading-8 max-w-lg">
                منصة متكاملة لإدارة القضايا، الموكّلين، الجلسات، الفواتير والمستندات — مصممة خصيصاً لمكاتب المحاماة العربية.
              </p>
            </div>

            <div className="flex items-center gap-5 flex-wrap">
              {[{ val:'١٠٠٪', label:'عربي'},{val:'آمن',label:'SSL + Supabase'},{val:'سريع',label:'تحميل فوري'}].map((s,i) => (
                <div key={i} className="text-center">
                  <p className="text-lg font-black text-white">{s.val}</p>
                  <p className="text-[11px] text-white/40 mt-0.5">{s.label}</p>
                </div>
              ))}
              <div className="h-7 w-px bg-white/10 hidden sm:block" />
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map(s => <Star key={s} className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />)}
                <span className="text-[11px] text-white/40 mr-1">موثوق من مكاتب المحاماة</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {FEATURES.map((f, i) => <Feature key={i} {...f} />)}
            </div>
          </div>

          {/* ── اليمين — بطاقة الدخول ───────────────────────────────────────── */}
          <div className="space-y-3">

            {/* البطاقة الرئيسية */}
            <div
              className="rounded-3xl border border-white/10 overflow-hidden"
              style={{
                background: 'linear-gradient(135deg,rgba(255,255,255,.07),rgba(255,255,255,.03))',
                backdropFilter: 'blur(24px)',
                boxShadow: '0 0 0 1px rgba(255,255,255,.05) inset, 0 32px 72px rgba(0,0,0,.45), 0 0 80px rgba(37,99,235,.07)',
              }}
            >
              {/* Header */}
              <div className="px-6 pt-6 pb-4 border-b border-white/8">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-blue-500/20 border border-blue-400/20 flex items-center justify-center">
                    <LogIn className="h-5 w-5 text-blue-300" />
                  </div>
                  <div>
                    <h2 className="font-black text-white text-lg leading-none">تسجيل الدخول</h2>
                    <p className="text-[11px] text-white/40 mt-0.5">ادخل بحساب Google الخاص بك</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-3">
                {/* عرض الخطأ */}
                {authError && (
                  <AuthErrorCard error={authError} onRetry={() => setLoading(null)} />
                )}

                {/* زر Google */}
                <button
                  onClick={handleLogin}
                  disabled={loading || isLoadingAuth}
                  className="google-btn w-full h-14 rounded-2xl font-bold text-white flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {(loading || isLoadingAuth) ? (
                    <div className="h-5 w-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                        <path fill="white" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="white" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="white" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="white" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      <span>تسجيل الدخول بـ Google</span>
                      <ChevronLeft className="h-4 w-4 opacity-60" />
                    </>
                  )}
                </button>

                <p className="text-[11px] text-white/28 text-center leading-5 pt-1">
                  بتسجيل الدخول تقبل شروط الاستخدام وسياسة الخصوصية.
                </p>
              </div>
            </div>

            {/* معلومات الأمان */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: ShieldCheck, label: 'SSL 256-bit' },
                { icon: CheckCircle2, label: 'Google OAuth' },
                { icon: Zap, label: 'Supabase' },
              ].map((item, i) => {
                const Icon = item.icon
                return (
                  <div key={i} className="flex flex-col items-center gap-1 p-2.5 rounded-2xl border border-white/6 bg-white/3 text-center">
                    <Icon className="h-4 w-4 text-blue-400/70" />
                    <p className="text-[10px] text-white/45">{item.label}</p>
                  </div>
                )
              })}
            </div>

            {/* الصلاحيات */}
            <div className="rounded-2xl border border-white/6 bg-white/3 p-4">
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">الصلاحيات حسب الدور</p>
              {[
                { role: 'المحامي / الإدارة', desc: 'وصول كامل', color: 'bg-blue-500' },
                { role: 'المساعد / الموظف',  desc: 'ملفات ومهام', color: 'bg-cyan-500' },
                { role: 'الموكّل',            desc: 'قضاياه وفواتيره', color: 'bg-green-500' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2.5 mb-2 last:mb-0">
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.color}`} />
                  <span className="text-[11px] font-semibold text-white/65 min-w-[100px]">{item.role}</span>
                  <span className="text-[10px] text-white/30">{item.desc}</span>
                </div>
              ))}
            </div>

          </div>
        </div>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="relative z-10 py-3 px-5 md:px-10 border-t border-white/5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className="text-[11px] text-white/22">{appParams.appName} © {new Date().getFullYear()}</p>
          <div className="flex items-center gap-3 text-[11px] text-white/22">
            <span>Supabase</span><span>·</span><span>React + Vite</span><span>·</span><span>Stripe</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
