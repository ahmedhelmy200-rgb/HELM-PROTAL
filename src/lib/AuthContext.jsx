import React, { createContext, useState, useContext, useEffect } from 'react'
import { base44 } from '@/api/base44Client'
import { supabase } from '@/integrations/supabase/client'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoadingAuth, setIsLoadingAuth] = useState(true)
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false)
  const [authError, setAuthError] = useState(null)
  const [appPublicSettings, setAppPublicSettings] = useState(null)

  useEffect(() => {
    checkAppState()
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      checkAppState()
    })
    return () => sub?.subscription?.unsubscribe()
  }, [])

  const checkAppState = async () => {
    try {
      setAuthError(null)
      setIsLoadingAuth(true)
      setIsLoadingPublicSettings(true)
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData?.session) {
        setUser(null)
        setIsAuthenticated(false)
        setAuthError({ type: 'auth_required', message: 'Authentication required' })
        setIsLoadingAuth(false)
      setIsLoadingPublicSettings(false)
        setIsLoadingPublicSettings(false)
        return
      }
      const currentUser = await base44.auth.me()
      const settingsRows = currentUser?.role === 'pending_client' ? [] : await base44.entities.OfficeSettings.list()
      setAppPublicSettings(settingsRows?.[0] || null)
      setUser(currentUser)
      setIsAuthenticated(true)
      setIsLoadingAuth(false)
      setIsLoadingPublicSettings(false)
    } catch (error) {
      console.error('Auth check failed:', error)
      setUser(null)
      setIsAuthenticated(false)
      setAuthError({ type: error?.message?.includes('registered') ? 'user_not_registered' : 'auth_required', message: error.message || 'Authentication required' })
      setIsLoadingAuth(false)
      setIsLoadingPublicSettings(false)
    }
  }

  const logout = (shouldRedirect = true) => base44.auth.logout(shouldRedirect ? window.location.origin : null)
  const navigateToLogin = () => base44.auth.redirectToLogin(window.location.origin)

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
