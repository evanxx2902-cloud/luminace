import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { UserProfile } from '../api/auth'

const ACCESS_TOKEN_KEY = 'luminance_access_token'
const REFRESH_TOKEN_KEY = 'luminance_refresh_token'

interface AuthState {
  user: UserProfile | null
  accessToken: string | null
  refreshToken: string | null
}

interface AuthContextValue extends AuthState {
  login: (accessToken: string, refreshToken: string, user: UserProfile) => void
  logout: () => void
  updateUser: (user: UserProfile) => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY)
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
    return { accessToken, refreshToken, user: null }
  })

  const login = useCallback((accessToken: string, refreshToken: string, user: UserProfile) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
    setState({ accessToken, refreshToken, user })
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    setState({ accessToken: null, refreshToken: null, user: null })
  }, [])

  const updateUser = useCallback((user: UserProfile) => {
    setState(prev => ({ ...prev, user }))
  }, [])

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        updateUser,
        isAuthenticated: !!state.accessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
