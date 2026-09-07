import React, { Suspense, useEffect } from 'react'
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, Navigate, Link } from 'react-router-dom'
import PageNotFound from './lib/PageNotFound'
import { AuthProvider, useAuth } from '@/lib/AuthContext'
import ClientOnboarding from './pages/ClientOnboarding'
import ClientDashboard from './pages/ClientDashboard'
import PublicEntryWithLogo from './pages/PublicEntryWithLogo'
import PublicLegalLibrary from './pages/PublicLegalLibrary'
import PasswordReset from './pages/PasswordReset'
import Payment from './pages/Payment'
import { createPageUrl } from '@/utils'
import ErrorBoundary from '@/components/app/ErrorBoundary'
import AppStatusBar from '@/components/app/AppStatusBar'
import KeyboardShortcutsModal from '@/components/app/KeyboardShortcutsModal'
import MobilePriorityDock from '@/components/app/MobilePriorityDock'
import SupabaseConfigGate from '@/components/app/SupabaseConfigGate'
import AdibStatementSeedBridge from '@/components/app/AdibStatementSeedBridge'
import { base44 } from '@/api/base44Client'

const { Pages, Layout, mainPage } = pagesConfig
const mainPageKey = mainPage ?? Object.keys(Pages)[0]
const MainPage = mainPageKey ? Pages[mainPageKey] : () => null
const CLIENT_ALLOWED_PAGES = new Set(['Dashboard', 'Cases', 'Invoices', 'Documents', 'Notifications', 'Profile'])
const PENDING_CLIENT_ALLOWED_PAGES = new Set(['ClientOnboarding'])
const STAFF_ROLES = new Set(['admin', 'staff', 'lawyer', 'assistant', 'secretary'])
const OPERATIONS_MANAGER_EMAIL = 'mahmoudmegally3@gmail.com'

function isOperationsManager(user) {
  return String(user?.email || '').trim().toLowerCase() === OPERATIONS_MANAGER_EMAIL
}

const PageFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-background text-foreground">
    <div className="select-none space-y-4 text-center">
      <div className="relative mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl border border-border bg-card shadow-xl">
        <img src="/icon-192.png" alt="HELM Portal" className="h-14 w-14 rounded-2xl object-contain" onError={(event) => { event.currentTarget.style.display = 'none' }} />
      </div>
      <div className="space-y-2">
        <div className="mx-auto h-1.5 w-32 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-1/2 animate-[loading_1.2s_ease-in-out_infinite] rounded-full bg-primary" />
        </div>
        <p className="text-xs font-bold text-muted-foreground">جارٍ تحميل HELM Portal…</p>
      </div>
    </div>
  </div>
)

const ContentFallback = () => (
  <div className="flex min-h-[320px] items-center justify-center" role="status" aria-live="polite">
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card/90 px-5 py-4 text-sm font-bold text-muted-foreground shadow-sm">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
      جارٍ فتح القسم…
    </div>
  </div>
)

const RetiredAccountAccess = () => (
  <main dir="rtl" className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-5">
    <section className="w-full max-w-xl rounded-3xl border border-white/10 bg-white/[.06] p-7 text-center shadow-2xl">
      <img src="/icon-192.png" alt="HELM Portal" className="mx-auto h-20 w-20 rounded-3xl object-contain" />
      <h1 className="mt-5 text-2xl font-black">هذا النوع من الحسابات لم يعد مفعّلًا</h1>
      <p className="mt-3 leading-8 text-slate-300">تواصل مع إدارة المكتب لتحويل الحساب إلى موظف أو موكّل بحسب الصلاحية المطلوبة.</p>
      <button type="button" onClick={() => base44.auth.logout()} className="mt-6 rounded-2xl bg-white px-5 py-3 font-black text-slate-950">تسجيل الخروج</button>
    </section>
  </main>
)

const LayoutWrapper = ({ children, currentPageName }) => Layout ? <Suspense fallback={<PageFallback />}><Layout currentPageName={currentPageName}>{children}</Layout></Suspense> : <>{children}</>

function RealtimeBridge() { useEffect(() => { const stop = base44.realtime.subscribe(); return stop }, []); return null }

function OperationsQuickAccess({ user }) {
  const operationsManager = isOperationsManager(user)
  if (!operationsManager && user?.role !== 'admin') return null
  return (
    <Link
      to={createPageUrl('UserActivity')}
      className="fixed bottom-24 left-4 z-[90] flex items-center gap-2 rounded-2xl border border-amber-300/30 bg-slate-950/95 px-4 py-3 text-sm font-black text-white shadow-2xl backdrop-blur hover:bg-slate-900 md:bottom-6"
      title="سجل أعمال المستخدمين"
    >
      {operationsManager && <span className="rounded-lg bg-amber-400 px-2 py-1 text-[11px] font-black text-slate-950">مدير عام</span>}
      <span>سجل أعمال المستخدمين</span>
    </Link>
  )
}

function OnboardingRoute() {
  const { user, isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/" replace />
  if (STAFF_ROLES.has(user?.role)) return <Navigate to={createPageUrl('Dashboard')} replace />
  if (user?.role === 'client') return <Navigate to={createPageUrl('Dashboard')} replace />
  if (user?.role === 'broker') return <RetiredAccountAccess />
  return <ClientOnboarding />
}

function PublicRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PublicEntryWithLogo />} />
      <Route path="/Payment" element={<Payment />} />
      <Route path="/PublicLegalLibrary" element={<PublicLegalLibrary />} />
      <Route path="/PasswordReset" element={<PasswordReset />} />
      <Route path={createPageUrl('ClientOnboarding')} element={<Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, user, isAuthenticated } = useAuth()
  if (isLoadingPublicSettings || isLoadingAuth) return <PageFallback />
  if (!isAuthenticated || !user) return <PublicRoutes />
  if (user.role === 'broker') return <RetiredAccountAccess />

  const fallbackPage = 'Dashboard'
  const operationsManager = isOperationsManager(user)
  const resolvePage = (path, Page) => user?.role === 'client' && path === 'Dashboard' ? ClientDashboard : Page
  const renderPage = (path, Page) => {
    if (user?.role === 'pending_client' && !PENDING_CLIENT_ALLOWED_PAGES.has(path)) return <Navigate to={createPageUrl('ClientOnboarding')} replace />
    if (user?.role === 'client' && !CLIENT_ALLOWED_PAGES.has(path)) return <Navigate to={createPageUrl('Dashboard')} replace />
    if (operationsManager && path === 'Settings') return <Navigate to={createPageUrl('Dashboard')} replace />
    const ResolvedPage = resolvePage(path, Page)
    return <LayoutWrapper currentPageName={path}><Suspense fallback={<ContentFallback />}><ResolvedPage /></Suspense></LayoutWrapper>
  }

  return (
    <>
      <RealtimeBridge />
      <AdibStatementSeedBridge user={user} />
      <Routes>
        <Route path="/" element={user?.role === 'pending_client' ? <Navigate to={createPageUrl('ClientOnboarding')} replace /> : renderPage(fallbackPage, Pages[fallbackPage] || MainPage)} />
        <Route path={createPageUrl('ClientOnboarding')} element={<OnboardingRoute />} />
        <Route path="/Payment" element={<Payment />} />
        <Route path="/PublicLegalLibrary" element={<PublicLegalLibrary />} />
        <Route path="/PasswordReset" element={<PasswordReset />} />
        {Object.entries(Pages).map(([path, Page]) => <Route key={path} path={`/${path}`} element={renderPage(path, Page)} />)}
        <Route path="*" element={<PageNotFound />} />
      </Routes>
      <MobilePriorityDock />
      <OperationsQuickAccess user={user} />
    </>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <SupabaseConfigGate>
        <AuthProvider>
          <QueryClientProvider client={queryClientInstance}>
            <Router><AppStatusBar /><KeyboardShortcutsModal /><AuthenticatedApp /></Router>
            <Toaster />
          </QueryClientProvider>
        </AuthProvider>
      </SupabaseConfigGate>
    </ErrorBoundary>
  )
}

export default App