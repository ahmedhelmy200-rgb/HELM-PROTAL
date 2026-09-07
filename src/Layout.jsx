import React, { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { Link, useNavigate } from "react-router-dom"
import { createPageUrl } from "@/utils"
import { base44 } from "@/api/base44Client"
import AnimatedBackground from "@/components/helm/AnimatedBackground"
import { playUiTone } from "@/lib/sound"
import { applyVisualIdentity, getStoredThemePreference, setStoredThemePreference } from '@/lib/theme'
import { useAuth } from '@/lib/AuthContext'
import {
  LayoutDashboard, Briefcase, Users, CalendarDays, FileText, CheckSquare,
  Bell, Menu, X, LogOut, Receipt, BookOpen, Settings, Wallet, BarChart2, MessageCircle,
  Archive, Search as SearchIcon, MoonStar, SunMedium, Volume2, VolumeX, Zap,
  Landmark, ArrowRight, MonitorCog, BrainCircuit, Megaphone, Globe2
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { APP_SHORTCUT_NEW, APP_SHORTCUT_SEARCH, APP_SHORTCUT_HELP, emitAppEvent } from '@/lib/app-events'
import { getArchiveCount } from '@/lib/archive'
import { GLOBAL_SEARCH_EVENT } from "@/components/app/GlobalSearch"

const staffNavItems = [
  { label: "لوحة التحكم", page: "Dashboard", icon: LayoutDashboard, fx: "nav-fx-float" },
  { label: "القضايا", page: "Cases", icon: Briefcase, fx: "nav-fx-pulse" },
  { label: "الموكلون", page: "Clients", icon: Users, fx: "nav-fx-bob" },
  { label: "جهات الاتصال", page: "Contacts", icon: Users, fx: "nav-fx-bob" },
  { label: "الجلسات", page: "Sessions", icon: CalendarDays, fx: "nav-fx-wiggle" },
  { label: "المستندات", page: "Documents", icon: FileText, fx: "nav-fx-spark" },
  { label: "المهام", page: "Tasks", icon: CheckSquare, fx: "nav-fx-tilt" },
  { label: "الفواتير", page: "Invoices", icon: Receipt, fx: "nav-fx-breathe" },
  { label: "المصاريف", page: "Expenses", icon: Wallet, fx: "nav-fx-shift" },
  { label: "النماذج القانونية", page: "LegalTemplates", icon: BookOpen, fx: "nav-fx-float" },
  { label: "مركز التواصل", page: "Communications", icon: MessageCircle, fx: "nav-fx-breathe" },
  { label: "مركز النشر", page: "SocialPublisher", icon: Megaphone, fx: "nav-fx-pulse" },
  { label: "التقارير", page: "Reports", icon: BarChart2, fx: "nav-fx-pulse" },
  { label: "المواقع الإلكترونية", page: "LegalWebsites", icon: Globe2, fx: "nav-fx-float" },
  { label: "حُلم سمارت", page: "HelmSmart", icon: BrainCircuit, fx: "nav-fx-spark" },
  { label: "الأرشيف", page: "Archive", icon: Archive, fx: "nav-fx-tilt" },
  { label: "الإعدادات", page: "Settings", icon: Settings, fx: "nav-fx-spin-soft" },
]

const clientNavItems = [
  { label: "لوحة العميل", page: "Dashboard", icon: LayoutDashboard, fx: "nav-fx-float" },
  { label: "القضايا", page: "Cases", icon: Briefcase, fx: "nav-fx-pulse" },
  { label: "الفواتير", page: "Invoices", icon: Receipt, fx: "nav-fx-breathe" },
  { label: "المستندات", page: "Documents", icon: FileText, fx: "nav-fx-spark" },
  { label: "الملف الشخصي", page: "Profile", icon: Users, fx: "nav-fx-bob" },
]

const mobileTabsForRole = {
  staff: [
    { label: "الرئيسية", page: "Dashboard", icon: LayoutDashboard },
    { label: "القضايا", page: "Cases", icon: Briefcase },
    { label: "الموكلون", page: "Clients", icon: Users },
    { label: "الاتصال", page: "Contacts", icon: Users },
  ],
  client: [
    { label: "الرئيسية", page: "Dashboard", icon: LayoutDashboard },
    { label: "القضايا", page: "Cases", icon: Briefcase },
    { label: "الفواتير", page: "Invoices", icon: Receipt },
    { label: "الملف", page: "Profile", icon: Users },
  ],
}

const themeCycle = ["system", "dark", "light"]
const SOUND_KEY = 'helm_sound_enabled'
const EFFECT_KEY = 'helm_electric_intensity'

function getStoredSound() {
  if (typeof window === 'undefined') return true
  return localStorage.getItem(SOUND_KEY) !== 'false'
}

function roleLabel(role) {
  if (role === 'client') return 'بوابة الموكّل'
  return 'الإدارة القانونية'
}

function roleSubtitle(role) {
  if (role === 'client') return 'بوابة العميل الآمنة'
  return 'منصة الإدارة القانونية'
}

export default function Layout({ children, currentPageName }) {
  const navigate = useNavigate()
  const { user, appPublicSettings } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [officeSettings, setOfficeSettings] = useState(null)
  const [archiveCount, setArchiveCount] = useState(0)
  const [themePreference, setThemePreference] = useState(() => getStoredThemePreference())
  const [systemPrefersDark, setSystemPrefersDark] = useState(() => typeof window !== "undefined" ? window.matchMedia("(prefers-color-scheme: dark)").matches : true)
  const [soundEnabled, setSoundEnabled] = useState(() => getStoredSound())
  const [effectPower, setEffectPower] = useState(() => {
    if (typeof window === 'undefined') return 1.15
    const raw = Number(localStorage.getItem(EFFECT_KEY) || '1.15')
    return Number.isFinite(raw) ? raw : 1.15
  })
  const desktopSidebarScrollRef = useRef(null)
  const mobileSidebarScrollRef = useRef(null)

  const navItems = useMemo(() => {
    if (user?.role === 'client') return clientNavItems
    return staffNavItems.filter((item) => item.page !== 'SocialPublisher' || user?.role === 'admin')
  }, [user?.role])
  const mobileTabs = user?.role === 'client' ? mobileTabsForRole.client : mobileTabsForRole.staff
  const resolvedTheme = themePreference === "system" ? (systemPrefersDark ? "dark" : "light") : themePreference
  const isPrimaryMobilePage = mobileTabs.some((item) => item.page === currentPageName)
  const shouldShowBack = !isPrimaryMobilePage
  const officeName = officeSettings?.office_name || appPublicSettings?.office_name || "مكتب المستشار أحمد حلمي"
  const logoUrl = officeSettings?.logo_url || appPublicSettings?.logo_url || null
  const themeMeta = themePreference === "system"
    ? { icon: MonitorCog, label: `تلقائي (${resolvedTheme === "dark" ? "ليلي" : "نهاري"})` }
    : themePreference === "dark"
      ? { icon: MoonStar, label: "ليلي" }
      : { icon: SunMedium, label: "نهاري" }

  useEffect(() => {
    const update = () => setArchiveCount(getArchiveCount())
    update()
    window.addEventListener('storage', update)
    return () => window.removeEventListener('storage', update)
  }, [])

  useEffect(() => {
    const load = async () => {
      if (!user?.email) return
      const [notifs, settings] = await Promise.all([
        base44.entities.Notification.filter({ user_email: user.email, is_read: false }),
        base44.entities.OfficeSettings.list(),
      ])
      setUnreadCount(notifs.length)
      const settingsRow = settings?.[0] || null
      setOfficeSettings(settingsRow)
      if (settingsRow?.app_font || settingsRow?.primary_color || settingsRow?.secondary_color || settingsRow?.sidebar_color) {
        applyVisualIdentity(settingsRow, resolvedTheme)
      }
    }
    load()
  }, [user?.email, resolvedTheme])

  useEffect(() => {
    if (typeof window === "undefined") return undefined
    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const listener = (event) => setSystemPrefersDark(event.matches)
    media.addEventListener?.("change", listener)
    media.addListener?.(listener)
    return () => {
      media.removeEventListener?.("change", listener)
      media.removeListener?.(listener)
    }
  }, [])

  useEffect(() => {
    setStoredThemePreference(themePreference)
    applyVisualIdentity(officeSettings || appPublicSettings || {}, resolvedTheme)
  }, [resolvedTheme, themePreference, officeSettings, appPublicSettings])

  useEffect(() => {
    if (typeof window === 'undefined') return
    localStorage.setItem(SOUND_KEY, soundEnabled ? 'true' : 'false')
  }, [soundEnabled])

  useEffect(() => {
    if (typeof window === 'undefined') return
    localStorage.setItem(EFFECT_KEY, String(effectPower))
  }, [effectPower])

  useEffect(() => {
    const handler = (event) => {
      const target = event.target
      const tag = target?.tagName?.toLowerCase()
      const isEditable = target?.isContentEditable || ['input', 'textarea', 'select'].includes(tag)
      if (!(event.ctrlKey || event.metaKey) || isEditable) return
      const key = String(event.key || '').toLowerCase()
      if (key === 'f') { event.preventDefault(); emitAppEvent(APP_SHORTCUT_SEARCH, { page: currentPageName }) }
      if (key === 'n') { event.preventDefault(); emitAppEvent(APP_SHORTCUT_NEW, { page: currentPageName }) }
      if (key === '/' || (event.shiftKey && key === '/')) { event.preventDefault(); emitAppEvent(APP_SHORTCUT_HELP, {}) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [currentPageName])

  const handleSidebarWheel = useCallback((event, targetRef) => {
    if (typeof window === 'undefined' || window.innerWidth < 768) return
    const scrollEl = targetRef?.current
    if (!scrollEl) return
    if (Math.abs(event.deltaY) < Math.abs(event.deltaX)) return
    event.preventDefault()
    scrollEl.scrollBy({ top: event.deltaY, behavior: 'auto' })
  }, [])

  const handleThemeToggle = () => {
    const currentIndex = themeCycle.indexOf(themePreference)
    const next = themeCycle[(currentIndex + 1) % themeCycle.length]
    setThemePreference(next)
    playUiTone("toggle", soundEnabled)
  }

  const handleSoundToggle = () => {
    const next = !soundEnabled
    setSoundEnabled(next)
    playUiTone("toggle", true)
  }

  const goBack = () => {
    playUiTone("nav", soundEnabled)
    if (typeof window !== "undefined" && window.history.length > 1) navigate(-1)
    else navigate(createPageUrl("Dashboard"))
  }

  const NavLink = ({ item, mobile = false, compact = false }) => {
    const isActive = currentPageName === item.page
    const Icon = item.icon
    return (
      <Link
        key={item.page}
        to={createPageUrl(item.page)}
        onClick={() => { playUiTone("nav", soundEnabled); if (mobile) setSidebarOpen(false) }}
        className={cn(compact ? "mobile-tab-link" : "sidebar-nav-item", isActive && (compact ? "mobile-tab-link-active" : "sidebar-nav-item-active"))}
      >
        <span className={cn(compact ? "mobile-tab-icon" : "sidebar-nav-icon", !compact && item.fx, isActive && !compact && "active-electric")}>
          <Icon className="h-4 w-4 shrink-0" />
        </span>
        <span className={cn(compact ? "text-[11px] font-medium" : "truncate")}>{item.label}</span>
        {item.page === 'Archive' && archiveCount > 0 && !compact && <span className="archive-nav-count shrink-0">{archiveCount > 99 ? '99+' : archiveCount}</span>}
        {isActive && !compact && <span className="sidebar-active-dot" />}
      </Link>
    )
  }

  const NotificationTopButton = ({ mobile = false }) => (
    <Link to={createPageUrl("Notifications")} className="relative shrink-0" title="التنبيهات" onClick={() => playUiTone("nav", soundEnabled)}>
      {mobile ? (
        <>
          <span className="icon-glass-btn inline-flex"><Bell className="h-4.5 w-4.5 text-white" /></span>
          {unreadCount > 0 && <span className="absolute -top-1 -left-1 h-4.5 w-4.5 bg-accent rounded-full text-[9px] text-white flex items-center justify-center">{unreadCount}</span>}
        </>
      ) : (
        <span className="control-chip relative min-w-[112px] justify-center">
          <Bell className="h-4 w-4" /><span>التنبيهات</span>
          {unreadCount > 0 && <Badge className="absolute -top-2 -left-2 bg-accent text-white text-[10px] h-5 min-w-[20px] px-1.5">{unreadCount > 99 ? '99+' : unreadCount}</Badge>}
        </span>
      )}
    </Link>
  )

  const LogoMark = ({ compact = false }) => (
    <div className={cn(compact ? "h-9 w-9 rounded-xl" : "h-11 w-11 rounded-2xl", "bg-white/10 flex items-center justify-center shrink-0 ring-1 ring-white/10 overflow-hidden")}>
      {logoUrl ? <img src={logoUrl} alt="HELM Portal" className="h-full w-full object-contain p-1.5" /> : <img src="/icon-192.png" alt="HELM Portal" className={compact ? "h-6 w-6 object-contain" : "h-8 w-8 object-contain"} onError={(e) => { e.currentTarget.style.display = 'none' }} />}
    </div>
  )

  const SidebarFooter = () => {
    const ThemeIcon = themeMeta.icon
    return (
      <div className="p-3 border-t border-white/10 space-y-2">
        <div className="grid grid-cols-2 gap-2 md:hidden">
          <button onClick={handleThemeToggle} className="control-chip" title="تبديل الثيم"><ThemeIcon className="h-4 w-4" /><span>{themeMeta.label}</span></button>
          <button onClick={handleSoundToggle} className="control-chip">{soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}<span>{soundEnabled ? "الصوت" : "صامت"}</span></button>
        </div>
        <div className="control-chip w-full justify-between md:hidden">
          <span className="inline-flex items-center gap-1.5"><Zap className="h-4 w-4" /> شبكة الكهرباء</span>
          <input type="range" min="0.6" max="2.2" step="0.05" value={effectPower} onChange={(e) => setEffectPower(Number(e.target.value))} className="w-24 accent-sky-400" />
        </div>
        {user && (
          <div className="user-panel-glass">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center ring-1 ring-white/10"><Landmark className="h-4 w-4 text-white" /></div>
              <div className="min-w-0"><p className="text-white text-xs font-semibold truncate">{user.full_name || user.email}</p><p className="text-white/55 text-[11px] truncate">{roleLabel(user.role)}</p></div>
            </div>
            <button onClick={() => { playUiTone("nav", soundEnabled); base44.auth.logout(); }} className="logout-link"><LogOut className="h-3.5 w-3.5" /> تسجيل خروج</button>
          </div>
        )}
      </div>
    )
  }

  const DesktopTopPortalBar = () => {
    const ThemeIcon = themeMeta.icon
    return (
      <div className="hidden md:flex items-center justify-between gap-3 mb-4 px-4 py-3 rounded-2xl border border-white/10 bg-slate-950/45 backdrop-blur-xl shadow-[0_12px_34px_rgba(2,8,23,.22)]">
        <div className="flex items-center gap-3 min-w-0"><LogoMark /><div className="min-w-0 text-right"><p className="text-[11px] text-sky-200/70 leading-tight">HELM Portal</p><h2 className="text-white font-extrabold text-base leading-tight truncate">{officeName}</h2></div></div>
        <div className="flex items-center gap-2 shrink-0">
          <NotificationTopButton />
          <button onClick={handleThemeToggle} className="control-chip min-w-[92px]" title="تبديل الثيم"><ThemeIcon className="h-4 w-4" /><span>{themeMeta.label}</span></button>
          <button onClick={handleSoundToggle} className="control-chip min-w-[84px]">{soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}<span>{soundEnabled ? "الصوت" : "صامت"}</span></button>
          <div className="control-chip min-w-[210px] justify-between"><span className="inline-flex items-center gap-1.5"><Zap className="h-4 w-4" /> شبكة الكهرباء</span><input type="range" min="0.6" max="2.2" step="0.05" value={effectPower} onChange={(e) => setEffectPower(Number(e.target.value))} className="w-24 accent-sky-400" /></div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("min-h-screen md:h-screen flex app-shell md:overflow-hidden")} dir="rtl">
      <AnimatedBackground active intensity={effectPower} theme={resolvedTheme} />
      <div className="ambient-orb orb-one" /><div className="ambient-orb orb-two" /><div className="ambient-orb orb-three" />

      <aside className="hidden md:flex flex-col w-64 sidebar-shell h-screen fixed right-0 top-0 z-40" onWheelCapture={(event) => handleSidebarWheel(event, desktopSidebarScrollRef)}>
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/8"><LogoMark /><div className="min-w-0"><h1 className="text-white font-bold text-sm leading-tight truncate">HELM Portal</h1><p className="text-white/55 text-xs leading-tight">{roleSubtitle(user?.role)}</p></div></div>
        <nav ref={desktopSidebarScrollRef} className="sidebar-scroll flex-1 min-h-0 p-3 space-y-1.5 overflow-y-auto overflow-x-hidden">{navItems.map((item) => <NavLink key={item.page} item={item} />)}</nav>
        <SidebarFooter />
      </aside>

      <header className="md:hidden fixed top-0 left-0 right-0 z-50 mobile-topbar">
        <div className="flex items-center gap-2">
          {shouldShowBack ? <button onClick={goBack} className="icon-glass-btn mobile-back-emphasis"><ArrowRight className="h-5 w-5 text-white" /></button> : <button onClick={() => { playUiTone("nav", soundEnabled); setSidebarOpen(true) }} className="icon-glass-btn"><Menu className="h-5 w-5 text-white" /></button>}
        </div>
        <div className="flex items-center gap-2 min-w-0"><LogoMark compact /><div className="min-w-0"><span className="text-white font-bold text-sm truncate block">HELM Portal</span>{shouldShowBack && <span className="text-white/55 text-[11px] truncate block">{currentPageName}</span>}</div></div>
        <div className="flex items-center gap-2"><button onClick={handleThemeToggle} className="icon-glass-btn" title={themeMeta.label}>{themeMeta.label.startsWith("تلقائي") ? <MonitorCog className="h-4.5 w-4.5 text-white" /> : resolvedTheme === "dark" ? <SunMedium className="h-4.5 w-4.5 text-white" /> : <MoonStar className="h-4.5 w-4.5 text-white" />}</button><button onClick={() => window.dispatchEvent(new Event(GLOBAL_SEARCH_EVENT))} className="icon-glass-btn" title="بحث شامل (Ctrl+K)"><SearchIcon className="h-4 w-4 text-white" /></button><NotificationTopButton mobile /></div>
      </header>

      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-72 sidebar-shell h-full mr-auto shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-5 border-b border-white/10"><div className="flex items-center gap-2 min-w-0"><LogoMark compact /><span className="text-white font-bold text-sm truncate">HELM Portal</span></div><button onClick={() => setSidebarOpen(false)} className="icon-glass-btn"><X className="h-5 w-5 text-white/80" /></button></div>
            <nav ref={mobileSidebarScrollRef} className="sidebar-scroll flex-1 min-h-0 p-3 space-y-1.5 overflow-y-auto overflow-x-hidden">{navItems.map((item) => <NavLink key={item.page} item={item} mobile />)}</nav>
            <SidebarFooter />
          </div>
        </div>
      )}

      <main className="flex-1 md:mr-64 pt-[calc(4rem+env(safe-area-inset-top))] md:pt-0 min-h-screen md:h-screen relative z-[1] pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-6 md:overflow-y-auto overflow-x-hidden">
        <div className="p-4 md:p-6 max-w-7xl mx-auto w-full page-enter">
          <DesktopTopPortalBar />
          {shouldShowBack && <div className="mb-3 md:mb-4 flex"><Button type="button" variant="outline" onClick={goBack} className="mobile-page-back-button gap-2"><ArrowRight className="h-4 w-4" />العودة</Button></div>}
          {children}
        </div>
      </main>

      <nav className="md:hidden mobile-bottom-tabs" aria-label="التنقل السفلي">{mobileTabs.map((item) => <NavLink key={item.page} item={item} compact mobile />)}</nav>
    </div>
  )
}
