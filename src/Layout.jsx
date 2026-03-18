import React, { useState, useEffect, useMemo } from "react"
import { Link, useNavigate } from "react-router-dom"
import { createPageUrl } from "@/utils"
import { base44 } from "@/api/base44Client"
import AnimatedBackground from "@/components/helm/AnimatedBackground"
import { playUiTone } from "@/lib/sound"
import { applyVisualIdentity, getStoredThemePreference, setStoredThemePreference } from '@/lib/theme'
import { useAuth } from '@/lib/AuthContext'
import {
  LayoutDashboard, Briefcase, Users, CalendarDays, FileText, CheckSquare,
  Bell, Menu, X, LogOut, Receipt, BookOpen, Settings, Wallet,
  MoonStar, SunMedium, Volume2, VolumeX, Zap, Landmark, ArrowRight, MonitorCog
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const staffNavItems = [
  { label: "لوحة التحكم", page: "Dashboard", icon: LayoutDashboard, fx: "nav-fx-float" },
  { label: "القضايا", page: "Cases", icon: Briefcase, fx: "nav-fx-pulse" },
  { label: "الموكلون", page: "Clients", icon: Users, fx: "nav-fx-bob" },
  { label: "الجلسات", page: "Sessions", icon: CalendarDays, fx: "nav-fx-wiggle" },
  { label: "المستندات", page: "Documents", icon: FileText, fx: "nav-fx-spark" },
  { label: "المهام", page: "Tasks", icon: CheckSquare, fx: "nav-fx-tilt" },
  { label: "الفواتير", page: "Invoices", icon: Receipt, fx: "nav-fx-breathe" },
  { label: "المصاريف", page: "Expenses", icon: Wallet, fx: "nav-fx-shift" },
  { label: "النماذج القانونية", page: "LegalTemplates", icon: BookOpen, fx: "nav-fx-float" },
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
    { label: "المهام", page: "Tasks", icon: CheckSquare },
    { label: "الإعدادات", page: "Settings", icon: Settings },
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

export default function Layout({ children, currentPageName }) {
  const navigate = useNavigate()
  const { user, appPublicSettings } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [officeSettings, setOfficeSettings] = useState(null)
  const [themePreference, setThemePreference] = useState(() => getStoredThemePreference())
  const [systemPrefersDark, setSystemPrefersDark] = useState(() => {
    if (typeof window === "undefined") return true
    return window.matchMedia("(prefers-color-scheme: dark)").matches
  })
  const [soundEnabled, setSoundEnabled] = useState(() => getStoredSound())
  const [effectPower, setEffectPower] = useState(() => {
    if (typeof window === 'undefined') return 1.15
    const raw = Number(localStorage.getItem(EFFECT_KEY) || '1.15')
    return Number.isFinite(raw) ? raw : 1.15
  })

  const navItems = useMemo(() => user?.role === 'client' ? clientNavItems : staffNavItems, [user?.role])
  const mobileTabs = user?.role === 'client' ? mobileTabsForRole.client : mobileTabsForRole.staff
  const resolvedTheme = themePreference === "system" ? (systemPrefersDark ? "dark" : "light") : themePreference
  const isPrimaryMobilePage = mobileTabs.some((item) => item.page === currentPageName)
  const shouldShowBack = !isPrimaryMobilePage
  const officeName = officeSettings?.office_name || appPublicSettings?.office_name || "نظام حلم"
  const logoUrl = officeSettings?.logo_url || appPublicSettings?.logo_url || null
  const themeMeta = themePreference === "system"
    ? { icon: MonitorCog, label: `تلقائي (${resolvedTheme === "dark" ? "ليلي" : "نهاري"})` }
    : themePreference === "dark"
      ? { icon: MoonStar, label: "ليلي" }
      : { icon: SunMedium, label: "نهاري" }

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
  }, [currentPageName, user?.email, resolvedTheme])

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
        onClick={() => {
          playUiTone("nav", soundEnabled)
          if (mobile) setSidebarOpen(false)
        }}
        className={cn(
          compact ? "mobile-tab-link" : "sidebar-nav-item",
          isActive && (compact ? "mobile-tab-link-active" : "sidebar-nav-item-active")
        )}
      >
        <span className={cn(compact ? "mobile-tab-icon" : "sidebar-nav-icon", !compact && item.fx, isActive && !compact && "active-electric")}>
          <Icon className="h-4 w-4 shrink-0" />
        </span>
        <span className={cn(compact ? "text-[11px] font-medium" : "truncate")}>{item.label}</span>
        {isActive && !compact && <span className="sidebar-active-dot" />}
      </Link>
    )
  }

  const SidebarFooter = () => {
    const ThemeIcon = themeMeta.icon
    return (
      <div className="p-3 border-t border-white/10 space-y-2">
        <Link to={createPageUrl("Notifications")} onClick={() => playUiTone("nav", soundEnabled)}>
          <button className="sidebar-nav-item w-full">
            <span className="sidebar-nav-icon nav-fx-spark"><Bell className="h-4 w-4" /></span>
            التنبيهات
            {unreadCount > 0 && (
              <Badge className="mr-auto bg-accent text-white text-[10px] h-5 min-w-[20px]">{unreadCount}</Badge>
            )}
          </button>
        </Link>

        <div className="grid grid-cols-2 gap-2">
          <button onClick={handleThemeToggle} className="control-chip" title="تبديل الثيم">
            <ThemeIcon className="h-4 w-4" />
            <span>{themeMeta.label}</span>
          </button>
          <button onClick={handleSoundToggle} className="control-chip">
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            <span>{soundEnabled ? "الصوت" : "صامت"}</span>
          </button>
        </div>

        <div className="control-chip w-full justify-between">
          <span className="inline-flex items-center gap-1.5"><Zap className="h-4 w-4" /> شبكة الكهرباء</span>
          <input
            type="range"
            min="0.6"
            max="2.2"
            step="0.05"
            value={effectPower}
            onChange={(e) => setEffectPower(Number(e.target.value))}
            className="w-24 accent-sky-400"
          />
        </div>

        {user && (
          <div className="user-panel-glass">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center ring-1 ring-white/10">
                <Landmark className="h-4 w-4 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-white text-xs font-semibold truncate">{user.full_name || user.email}</p>
                <p className="text-white/55 text-[11px] truncate">{user.role === 'client' ? 'بوابة الموكّل' : 'الإدارة القانونية'}</p>
              </div>
            </div>
            <button onClick={() => { playUiTone("nav", soundEnabled); base44.auth.logout(); }} className="logout-link">
              <LogOut className="h-3.5 w-3.5" /> تسجيل خروج
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={cn("min-h-screen flex app-shell") } dir="rtl">
      <AnimatedBackground active intensity={effectPower} theme={resolvedTheme} />
      <div className="ambient-orb orb-one" />
      <div className="ambient-orb orb-two" />
      <div className="ambient-orb orb-three" />

      <aside className="hidden md:flex flex-col w-64 sidebar-shell min-h-screen fixed right-0 top-0 z-40">
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/8">
          {logoUrl ? (
            <img src={logoUrl} alt="شعار المكتب" className="h-11 w-11 object-contain rounded-2xl bg-white/10 p-1.5 shrink-0 ring-1 ring-white/10" />
          ) : (
            <div className="h-11 w-11 bg-white/10 rounded-2xl flex items-center justify-center shrink-0 ring-1 ring-white/10 shadow-[0_0_22px_rgba(68,127,255,.16)]">
              <Zap className="h-5 w-5 text-sky-300" />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-white font-bold text-sm leading-tight truncate">{officeName}</h1>
            <p className="text-white/55 text-xs leading-tight">{user?.role === 'client' ? 'بوابة العميل الآمنة' : 'منصة الإدارة القانونية'}</p>
          </div>
        </div>

        <nav className="sidebar-scroll flex-1 min-h-0 p-3 space-y-1.5 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => <NavLink key={item.page} item={item} />)}
        </nav>

        <SidebarFooter />
      </aside>

      <header className="md:hidden fixed top-0 left-0 right-0 z-50 mobile-topbar">
        <div className="flex items-center gap-2">
          {shouldShowBack ? (
            <button onClick={goBack} className="icon-glass-btn mobile-back-emphasis">
              <ArrowRight className="h-5 w-5 text-white" />
            </button>
          ) : (
            <button onClick={() => { playUiTone("nav", soundEnabled); setSidebarOpen(true) }} className="icon-glass-btn">
              <Menu className="h-5 w-5 text-white" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center ring-1 ring-white/10">
            <Zap className="h-4.5 w-4.5 text-sky-300" />
          </div>
          <div className="min-w-0">
            <span className="text-white font-bold text-sm truncate block">{officeName}</span>
            {shouldShowBack && <span className="text-white/55 text-[11px] truncate block">{currentPageName}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleThemeToggle} className="icon-glass-btn" title={themeMeta.label}>
            {themeMeta.label.startsWith("تلقائي") ? <MonitorCog className="h-4.5 w-4.5 text-white" /> : resolvedTheme === "dark" ? <SunMedium className="h-4.5 w-4.5 text-white" /> : <MoonStar className="h-4.5 w-4.5 text-white" />}
          </button>
          <Link to={createPageUrl("Notifications")} className="relative" onClick={() => playUiTone("nav", soundEnabled)}>
            <span className="icon-glass-btn inline-flex">
              <Bell className="h-4.5 w-4.5 text-white" />
            </span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -left-1 h-4.5 w-4.5 bg-accent rounded-full text-[9px] text-white flex items-center justify-center">{unreadCount}</span>
            )}
          </Link>
        </div>
      </header>

      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-72 sidebar-shell h-full mr-auto shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
              <div className="flex items-center gap-2 min-w-0">
                <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center ring-1 ring-white/10">
                  <Zap className="h-4.5 w-4.5 text-sky-300" />
                </div>
                <span className="text-white font-bold text-sm truncate">{officeName}</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="icon-glass-btn">
                <X className="h-5 w-5 text-white/80" />
              </button>
            </div>
            <nav className="sidebar-scroll flex-1 min-h-0 p-3 space-y-1.5 overflow-y-auto overflow-x-hidden">
              {navItems.map((item) => <NavLink key={item.page} item={item} mobile />)}
            </nav>
            <SidebarFooter />
          </div>
        </div>
      )}

      <main className="flex-1 md:mr-64 pt-[calc(4rem+env(safe-area-inset-top))] md:pt-0 min-h-screen relative z-[1] pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-6">
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
          {shouldShowBack && (
            <div className="mb-3 md:mb-4 flex">
              <Button type="button" variant="outline" onClick={goBack} className="mobile-page-back-button gap-2">
                <ArrowRight className="h-4 w-4" />
                العودة
              </Button>
            </div>
          )}
          {children}
        </div>
      </main>

      <nav className="md:hidden mobile-bottom-tabs" aria-label="التنقل السفلي">
        {mobileTabs.map((item) => <NavLink key={item.page} item={item} compact mobile />)}
      </nav>
    </div>
  )
}
