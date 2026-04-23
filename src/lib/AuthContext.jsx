import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react'
import { base44 } from '@/api/base44Client'
import { loginWithCalendarScope } from '@/lib/googleCalendar'
import { supabase } from '@/integrations/supabase/client'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user,                    setUser]                    = useState(null)
  const [isAuthenticated,         setIsAuthenticated]         = useState(false)
  const [isLoadingAuth,           setIsLoadingAuth]           = useState(true)
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false)
  const [authError,               setAuthError]               = useState(null)
  const [appPublicSettings,       setAppPublicSettings]       = useState(null)
  const checkingRef = useRef(false)

  const checkAppState = useCallback(async () => {
    // منع الاستدعاء المزدوج
    if (checkingRef.current) return
    checkingRef.current = true

    try {
      setAuthError(null)
      setIsLoadingAuth(true)

      // ── 1. تحقق من الجلسة ────────────────────────────────────────────
      const { data: sessionData, error: sessionErr } = await supabase.auth.getSession()

      if (sessionErr) {
        console.error('[Auth] getSession error:', sessionErr.message)
        throw sessionErr
      }

      if (!sessionData?.session) {
        // لا توجد جلسة — المستخدم غير مسجّل دخول
        setUser(null)
        setIsAuthenticated(false)
        setAppPublicSettings(null)
        setAuthError(null)
        return
      }

      // ── 2. جلب بيانات المستخدم ───────────────────────────────────────
      setIsLoadingPublicSettings(true)
      const currentUser = await base44.auth.me()

      // ── 3. جلب إعدادات المكتب ────────────────────────────────────────
      const settingsRows = currentUser?.role === 'pending_client'
        ? []
        : await base44.entities.OfficeSettings.list().catch(() => [])

      setAppPublicSettings(settingsRows?.[0] || null)
      setUser(currentUser)
      setIsAuthenticated(true)

    } catch (error) {
      console.error('[Auth] checkAppState failed:', error)

      const msg     = error?.message || ''
      const isNoReg = msg.includes('registered') || msg.includes('not found') || msg.includes('user_profiles')
      const isConn  = msg.includes('fetch') || msg.includes('network') || msg.includes('NetworkError')

      setUser(null)
      setIsAuthenticated(false)
      setAppPublicSettings(null)
      setAuthError({
        type: isNoReg ? 'user_not_registered'
            : isConn  ? 'network_error'
            : 'auth_required',
        message: isNoReg ? 'حسابك غير مسجّل في النظام. تواصل مع مدير المكتب.'
                : isConn  ? 'تعذر الاتصال بالخادم. تحقق من اتصال الإنترنت.'
                : msg || 'تعذر التحقق من الهوية.',
      })
    } finally {
      checkingRef.current         = false
      setIsLoadingAuth(false)
      setIsLoadingPublicSettings(false)
    }
  }, [])

  useEffect(() => {
    // ── معالجة OAuth callback (hash أو code في URL) ──────────────────
    const handleOAuthCallback = async () => {
      const hash   = window.location.hash
      const search = window.location.search
      const hasToken = hash.includes('access_token') || hash.includes('refresh_token')
      const hasCode  = search.includes('code=')

      if (hasToken || hasCode) {
        // Supabase سيعالج الـ token تلقائياً عبر detectSessionInUrl
        // ننتظر قليلاً ثم نفحص الحالة
        await new Promise(r => setTimeout(r, 600))
        // نظّف الـ URL بعد المعالجة
        window.history.replaceState({}, document.title, window.location.pathname)
      }

      await checkAppState()
    }

    handleOAuthCallback()

    // ── الاستماع لتغييرات الجلسة ──────────────────────────────────────
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Auth] event:', event)

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        await checkAppState()
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setIsAuthenticated(false)
        setAppPublicSettings(null)
        setAuthError(null)
        setIsLoadingAuth(false)
        setIsLoadingPublicSettings(false)
      }
    })

    return () => sub?.subscription?.unsubscribe()
  }, [checkAppState])

  const logout = (shouldRedirect = true) =>
    base44.auth.logout(shouldRedirect ? window.location.origin : null)

  const navigateToLoginWithCalendar = async () => {
    try { await loginWithCalendarScope(import.meta.env.VITE_SUPABASE_GOOGLE_REDIRECT_URL || window.location.origin) }
    catch (err) { setAuthError({ type: 'oauth_error', message: err.message }) }
  }

  const navigateToLogin = async () => {
    try {
      setAuthError(null)
      const redirectTo = (
        import.meta.env.VITE_SUPABASE_GOOGLE_REDIRECT_URL ||
        window.location.origin
      ).replace(/\/$/, '') // إزالة الـ trailing slash

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: { access_type: 'offline', prompt: 'select_account' },
        },
      })
      if (error) {
        setAuthError({ type: 'oauth_error', message: error.message || 'فشل الاتصال بـ Google.' })
      }
    } catch (err) {
      setAuthError({ type: 'oauth_error', message: err.message || 'تعذر الاتصال بـ Google OAuth.' })
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      logout,
      navigateToLogin,
      navigateToLoginWithCalendar,
      checkAppState,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
