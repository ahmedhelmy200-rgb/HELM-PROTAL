import React, { Suspense, useEffect } from 'react'
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom'
import PageNotFound from './lib/PageNotFound'
import { AuthProvider, useAuth } from '@/lib/AuthContext'
import ClientOnboarding from './pages/ClientOnboarding'
import PublicEntry from './pages/PublicEntry'
import Payment from './pages/Payment'
import { createPageUrl } from '@/utils'
import ErrorBoundary from '@/components/app/ErrorBoundary'
import AppStatusBar from '@/components/app/AppStatusBar'
import KeyboardShortcutsModal from '@/components/app/KeyboardShortcutsModal'
import { base44 } from '@/api/base44Client'

const { Pages, Layout, mainPage } = pagesConfig
const mainPageKey = mainPage ?? Object.keys(Pages)[0]
const MainPage = mainPageKey ? Pages[mainPageKey] : () => null
const CLIENT_ALLOWED_PAGES = new Set(['Dashboard', 'Cases', 'Invoices', 'Documents', 'Notifications', 'Profile'])
const PENDING_CLIENT_ALLOWED_PAGES = new Set(['ClientOnboarding'])
const STAFF_ROLES = new Set(['admin', 'staff', 'lawyer'])

const PageFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center" style={{background:'linear-gradient(180deg,#03070f,#060d1f)'}}>
    <div className="text-center space-y-5">
      <div className="relative mx-auto h-14 w-14">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/30">
          <svg className="h-7 w-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </div>
        <div className="absolute inset-0 rounded-2xl border-2 border-blue-400/30 animate-ping"/>
      </div>
      <div className="space-y-1.5">
        <div className="h-1 w-24 mx-auto rounded-full bg-white/10 overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full animate-[loading_1.5s_ease-in-out_infinite]"/>
        </div>
        <p className="text-xs text-white/30">جارٍ التحميل…</p>
      </div>
    </div>
  </div>
)

const LayoutWrapper = ({ children, currentPageName }) => Layout ? (
  <Suspense fallback={<PageFallback />}>
    <Layout currentPageName={currentPageName}>{children}</Layout>
  </Suspense>
) : <>{children}</>

function RealtimeBridge() {
  useEffect(() => {
    const stop = base44.realtime.subscribe()
    return stop
  }, [])
  return null
}

function OnboardingRoute() {
  const { user, isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/" replace />
  if (STAFF_ROLES.has(user?.role)) return <Navigate to={createPageUrl('Dashboard')} replace />
  if (user?.role === 'client') return <Navigate to={createPageUrl('Dashboard')} replace />
  return <ClientOnboarding />
}

function PublicRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PublicEntry />} />
      <Route path="/Payment" element={<Payment />} />
      <Route path={createPageUrl('ClientOnboarding')} element={<Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, user, isAuthenticated } = useAuth()

  if (isLoadingPublicSettings || isLoadingAuth) return <PageFallback />
  if (!isAuthenticated || !user) return <PublicRoutes />

  const renderPage = (path, Page) => {
    if (user?.role === 'pending_client' && !PENDING_CLIENT_ALLOWED_PAGES.has(path)) {
      return <Navigate to={createPageUrl('ClientOnboarding')} replace />
    }
    if (user?.role === 'client' && !CLIENT_ALLOWED_PAGES.has(path)) {
      return <Navigate to={createPageUrl('Dashboard')} replace />
    }
    return (
      <LayoutWrapper currentPageName={path}>
        <Suspense fallback={<PageFallback />}>
          <Page />
        </Suspense>
      </LayoutWrapper>
    )
  }

  return (
    <>
      <RealtimeBridge />
      <Routes>
        <Route path="/" element={user?.role === 'pending_client' ? <Navigate to={createPageUrl('ClientOnboarding')} replace /> : renderPage(mainPageKey, MainPage)} />
        <Route path={createPageUrl('ClientOnboarding')} element={<OnboardingRoute />} />
        <Route path="/Payment" element={<Payment />} />
        {Object.entries(Pages).map(([path, Page]) => (
          <Route key={path} path={`/${path}`} element={renderPage(path, Page)} />
        ))}
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <AppStatusBar />
            <KeyboardShortcutsModal />
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
