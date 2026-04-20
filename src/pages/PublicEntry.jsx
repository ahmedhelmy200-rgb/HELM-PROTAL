import React, { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { appParams } from '@/lib/app-params'
import {
  Scale, ShieldCheck, FileText, BarChart2, Users,
  MessageCircle, LogIn, ChevronLeft, Star, Zap,
} from 'lucide-react'

// ── خلفية الجسيمات المتحركة ─────────────────────────────────────────────────
function ParticleCanvas() {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current
    const ctx    = canvas.getContext('2d')
    let raf

    const setSize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }
    setSize()
    window.addEventListener('resize', setSize)

    const N = 70
    const pts = Array.from({ length: N }, () => ({
      x : Math.random() * window.innerWidth,
      y : Math.random() * window.innerHeight,
      vx: (Math.random() - .5) * .4,
      vy: (Math.random() - .5) * .4,
      r : Math.random() * 1.5 + .5,
      p : Math.random() * Math.PI * 2,
    }))

    let sparks = [], st = 0
    const mouse = { x: -9999, y: -9999 }
    window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY })

    const draw = () => {
      raf = requestAnimationFrame(draw)
      const W = canvas.width, H = canvas.height
      ctx.clearRect(0, 0, W, H)

      // update
      pts.forEach(p => {
        const dx = mouse.x - p.x, dy = mouse.y - p.y
        const d  = Math.hypot(dx, dy)
        if (d < 180 && d > 1) { const f = 7e-5 * (180 - d); p.vx += dx/d*f; p.vy += dy/d*f }
        p.vx *= .991; p.vy *= .991
        p.x  += p.vx;  p.y  += p.vy; p.p += .012
        if (p.x < -10) p.x = W+10; if (p.x > W+10) p.x = -10
        if (p.y < -10) p.y = H+10; if (p.y > H+10) p.y = -10
      })

      // lines
      for (let i = 0; i < N; i++)
        for (let j = i+1; j < N; j++) {
          const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y)
          if (d < 120) {
            ctx.strokeStyle = `rgba(96,165,250,${(1-d/120)*.14})`
            ctx.lineWidth = .5
            ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y); ctx.stroke()
          }
        }

      // mouse lines
      pts.forEach(p => {
        const d = Math.hypot(mouse.x - p.x, mouse.y - p.y)
        if (d < 160) {
          ctx.strokeStyle = `rgba(147,197,253,${(1-d/160)*.28})`
          ctx.lineWidth = .6
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke()
        }
      })

      // dots
      ctx.shadowBlur = 6; ctx.shadowColor = 'rgba(96,165,250,.4)'
      pts.forEach(p => {
        const r = 1 + Math.sin(p.p) * .35
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI*2)
        ctx.fillStyle = 'rgba(147,197,253,.5)'; ctx.fill()
      })
      ctx.shadowBlur = 0

      // sparks
      st++
      if (st > 40 && Math.random() < .06) {
        st = 0
        const i = Math.floor(Math.random()*N), j = Math.floor(Math.random()*N)
        if (i !== j) {
          const d = Math.hypot(pts[i].x-pts[j].x, pts[i].y-pts[j].y)
          if (d < 90 && d > 15) sparks.push({ x1:pts[i].x, y1:pts[i].y, x2:pts[j].x, y2:pts[j].y, life:8 })
        }
      }
      sparks = sparks.filter(s => s.life > 0)
      sparks.forEach(s => {
        ctx.strokeStyle = `rgba(200,237,255,${(s.life/8)*.6})`
        ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(s.x1, s.y1)
        for (let k=1; k<5; k++) {
          const t = k/5
          ctx.lineTo(s.x1+(s.x2-s.x1)*t+(Math.random()-.5)*12, s.y1+(s.y2-s.y1)*t+(Math.random()-.5)*12)
        }
        ctx.lineTo(s.x2, s.y2); ctx.stroke(); s.life--
      })
    }
    draw()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', setSize) }
  }, [])
  return <canvas ref={ref} className="fixed inset-0 z-0 pointer-events-none" />
}

// ── بطاقة ميزة ───────────────────────────────────────────────────────────────
function Feature({ icon: Icon, title, desc, delay }) {
  return (
    <div
      className="flex items-start gap-3 p-4 rounded-2xl border border-white/8 bg-white/5 backdrop-blur-sm hover:bg-white/10 hover:border-white/15 transition-all group"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="h-9 w-9 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0 group-hover:bg-blue-500/30 transition-colors">
        <Icon className="h-4.5 w-4.5 text-blue-300" />
      </div>
      <div>
        <p className="text-sm font-bold text-white">{title}</p>
        <p className="text-xs text-white/55 mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}

// ── الصفحة الرئيسية ──────────────────────────────────────────────────────────
export default function PublicEntry() {
  const { navigateToLogin } = useAuth()
  const [loading, setLoading] = useState(null) // 'office' | 'client'

  const handleLogin = (type) => {
    setLoading(type)
    navigateToLogin()
  }

  const FEATURES = [
    { icon: Scale,          title: 'إدارة القضايا',        desc: 'متابعة كاملة للقضايا والجلسات والمستندات',   delay: 0   },
    { icon: BarChart2,      title: 'تقارير احترافية',      desc: 'إحصائيات الإيرادات وأداء الفريق',             delay: 80  },
    { icon: MessageCircle,  title: 'تواصل واتساب تلقائي', desc: 'رسائل مجدولة للموكلين بضغطة واحدة',           delay: 160 },
    { icon: FileText,       title: 'مستندات ذكية',         desc: 'أرشفة وتصنيف وفتح المستندات فوراً',           delay: 240 },
    { icon: ShieldCheck,    title: 'أمان عالي',             desc: 'تشفير كامل وصلاحيات متعددة المستويات',       delay: 320 },
    { icon: Zap,            title: 'دفع إلكتروني',         desc: 'Stripe — بطاقات، Apple Pay، Google Pay',      delay: 400 },
  ]

  return (
    <div
      dir="rtl"
      className="min-h-screen relative overflow-hidden flex flex-col"
      style={{
        background: 'radial-gradient(ellipse at 20% 20%, rgba(37,99,235,.18) 0%, transparent 45%), radial-gradient(ellipse at 80% 80%, rgba(6,182,212,.12) 0%, transparent 45%), linear-gradient(180deg, #03070f 0%, #060d1f 50%, #04091a 100%)',
      }}
    >
      <ParticleCanvas />

      {/* ── شريط علوي ───────────────────────────────────────────────────────── */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 md:px-12">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Scale className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-black text-white text-lg leading-none tracking-wider">{appParams.appName}</p>
            <p className="text-[10px] text-blue-300/70 mt-0.5">منظومة إدارة المكتب القانوني</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-white/50">النظام يعمل</span>
        </div>
      </header>

      {/* ── المحتوى الرئيسي ──────────────────────────────────────────────────── */}
      <main className="relative z-10 flex-1 flex items-center px-4 py-8 md:px-12">
        <div className="w-full max-w-6xl mx-auto grid md:grid-cols-[1fr,420px] gap-12 md:gap-16 items-center">

          {/* ── الجانب الأيسر — الشعار والمميزات ──────────────────────────── */}
          <div className="space-y-8">
            {/* العنوان */}
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-400/20 bg-blue-400/8 text-blue-300 text-xs font-semibold">
                <Star className="h-3 w-3 fill-current" />
                نظام قانوني متكامل باللغة العربية
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight">
                أدِر مكتبك
                <span className="block mt-1 bg-gradient-to-l from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                  بذكاء واحترافية
                </span>
              </h1>
              <p className="text-white/60 text-base md:text-lg leading-8 max-w-lg">
                منصة متكاملة لإدارة القضايا، الموكّلين، الجلسات، الفواتير والمستندات — مصممة خصيصاً لمكاتب المحاماة العربية.
              </p>
            </div>

            {/* الإحصائيات */}
            <div className="flex items-center gap-6 flex-wrap">
              {[
                { val: '١٠٠٪', label: 'عربي' },
                { val: 'آمن',  label: 'Supabase + SSL' },
                { val: 'سريع', label: 'تحميل فوري' },
              ].map((s, i) => (
                <div key={i} className="text-center">
                  <p className="text-xl font-black text-white">{s.val}</p>
                  <p className="text-xs text-white/45 mt-0.5">{s.label}</p>
                </div>
              ))}
              <div className="h-8 w-px bg-white/10" />
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map(s => <Star key={s} className="h-4 w-4 text-amber-400 fill-amber-400" />)}
                <span className="text-xs text-white/50 mr-1">موثوق من مكاتب المحاماة</span>
              </div>
            </div>

            {/* شبكة المميزات */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {FEATURES.map((f, i) => <Feature key={i} {...f} />)}
            </div>
          </div>

          {/* ── الجانب الأيمن — بطاقات الدخول ─────────────────────────────── */}
          <div className="space-y-4">

            {/* بطاقة الدخول الرئيسية */}
            <div
              className="rounded-3xl border border-white/10 overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,.07) 0%, rgba(255,255,255,.03) 100%)',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 0 0 1px rgba(255,255,255,.06), 0 32px 64px rgba(0,0,0,.4)',
              }}
            >
              {/* Header */}
              <div className="px-6 pt-6 pb-5 border-b border-white/8">
                <div className="flex items-center gap-3 mb-1">
                  <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-blue-500/30 to-blue-700/30 border border-blue-400/20 flex items-center justify-center">
                    <LogIn className="h-5 w-5 text-blue-300" />
                  </div>
                  <div>
                    <h2 className="font-black text-white text-lg">تسجيل الدخول</h2>
                    <p className="text-xs text-white/45">ادخل بحساب Google الخاص بك</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-3">
                {/* زر دخول المكتب */}
                <button
                  onClick={() => handleLogin('office')}
                  disabled={loading !== null}
                  className="w-full h-14 rounded-2xl font-bold text-white flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[.98] disabled:opacity-60 disabled:cursor-not-allowed relative overflow-hidden group"
                  style={{
                    background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #1e40af 100%)',
                    boxShadow: '0 4px 20px rgba(37,99,235,.4)',
                  }}
                >
                  <div className="absolute inset-0 bg-white/10 translate-x-full group-hover:translate-x-0 transition-transform duration-300 skew-x-12" />
                  {loading === 'office'
                    ? <div className="h-5 w-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    : <>
                        <svg className="h-5 w-5" viewBox="0 0 24 24"><path fill="white" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="white" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="white" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="white" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                        دخول المكتب والإدارة
                        <ChevronLeft className="h-4 w-4 opacity-70" />
                      </>
                  }
                </button>

                {/* فاصل */}
                <div className="flex items-center gap-3 py-1">
                  <div className="flex-1 h-px bg-white/8" />
                  <span className="text-xs text-white/30">أو</span>
                  <div className="flex-1 h-px bg-white/8" />
                </div>

                {/* زر بوابة الموكّل */}
                <button
                  onClick={() => handleLogin('client')}
                  disabled={loading !== null}
                  className="w-full h-12 rounded-2xl font-semibold text-white/80 flex items-center justify-center gap-2 border border-white/12 bg-white/5 hover:bg-white/10 hover:text-white hover:border-white/20 transition-all disabled:opacity-60 text-sm"
                >
                  {loading === 'client'
                    ? <div className="h-4 w-4 border-2 border-white/30 border-t-white/70 rounded-full animate-spin" />
                    : <>
                        <Users className="h-4 w-4" />
                        بوابة الموكّلين
                        <ChevronLeft className="h-3.5 w-3.5 opacity-50" />
                      </>
                  }
                </button>

                <p className="text-[11px] text-white/30 text-center leading-5 pt-1">
                  بتسجيل الدخول تقبل شروط الاستخدام وسياسة الخصوصية.
                  حساب Google مطلوب.
                </p>
              </div>
            </div>

            {/* معلومات الأمان */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: ShieldCheck, label: 'تشفير SSL',    sub: '256-bit' },
                { icon: Scale,       label: 'Supabase',     sub: 'قاعدة البيانات' },
                { icon: Zap,         label: 'Stripe',       sub: 'بوابة الدفع' },
              ].map((item, i) => {
                const Icon = item.icon
                return (
                  <div key={i} className="flex flex-col items-center gap-1.5 p-3 rounded-2xl border border-white/6 bg-white/3 text-center">
                    <Icon className="h-4 w-4 text-blue-400/80" />
                    <p className="text-[11px] font-semibold text-white/70">{item.label}</p>
                    <p className="text-[10px] text-white/35">{item.sub}</p>
                  </div>
                )
              })}
            </div>

            {/* صلاحيات حسب الدور */}
            <div className="rounded-2xl border border-white/6 bg-white/3 p-4 space-y-2.5">
              <p className="text-xs font-bold text-white/50 uppercase tracking-widest mb-3">الصلاحيات حسب الدور</p>
              {[
                { role: 'المحامي / الإدارة', desc: 'وصول كامل لجميع الوظائف', color: 'bg-blue-500' },
                { role: 'المساعد / الموظف',  desc: 'إدارة الملفات والمهام',     color: 'bg-cyan-500' },
                { role: 'الموكّل',            desc: 'قضاياه، فواتيره، مستنداته', color: 'bg-green-500' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${item.color}`} />
                  <span className="text-xs font-semibold text-white/70 min-w-[110px]">{item.role}</span>
                  <span className="text-[11px] text-white/35">{item.desc}</span>
                </div>
              ))}
            </div>

          </div>
        </div>
      </main>

      {/* ── تذييل ─────────────────────────────────────────────────────────────── */}
      <footer className="relative z-10 py-4 px-6 md:px-12 border-t border-white/5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <p className="text-xs text-white/25">{appParams.appName} © {new Date().getFullYear()} — جميع الحقوق محفوظة</p>
          <div className="flex items-center gap-4 text-xs text-white/25">
            <span>مدعوم بـ Supabase</span>
            <span>·</span>
            <span>مبني بـ React + Vite</span>
            <span>·</span>
            <span>دفع آمن بـ Stripe</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
