import React, { Suspense } from 'react'
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom'
import PageNotFound from './lib/PageNotFound'
import { AuthProvider, useAuth } from '@/lib/AuthContext'
import ClientOnboarding from './pages/ClientOnboarding'
import PublicEntry from './pages/PublicEntry'
import { createPageUrl } from '@/utils'

const { Pages, Layout, mainPage } = pagesConfig
const mainPageKey = mainPage ?? Object.keys(Pages)[0]
const MainPage = mainPageKey ? Pages[mainPageKey] : () => null
const CLIENT_ALLOWED_PAGES = new Set(['Dashboard', 'Cases', 'Invoices', 'Documents', 'Notifications', 'Profile'])
const PENDING_CLIENT_ALLOWED_PAGES = new Set(['ClientOnboarding'])
const STAFF_ROLES = new Set(['admin', 'staff', 'lawyer'])

const PageFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-background/40 backdrop-blur-sm">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
  </div>
)

const LayoutWrapper = ({ children, currentPageName }) => Layout ? (
  <Suspense fallback={<PageFallback />}>
    <Layout currentPageName={currentPageName}>{children}</Layout>
  </Suspense>
) : <>{children}</>

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
    <Routes>
      <Route path="/" element={user?.role === 'pending_client' ? <Navigate to={createPageUrl('ClientOnboarding')} replace /> : renderPage(mainPageKey, MainPage)} />
      <Route path={createPageUrl('ClientOnboarding')} element={<OnboardingRoute />} />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route key={path} path={`/${path}`} element={renderPage(path, Page)} />
      ))}
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
