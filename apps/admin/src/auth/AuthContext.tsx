import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authApi, UserInfo } from '../api/client'

interface AuthContextType {
  token: string | null
  user: UserInfo | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('token')
  )
  const [user, setUser] = useState<UserInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (token) {
      authApi
        .me()
        .then(setUser)
        .catch(() => {
          // Token invalid, clear it
          localStorage.removeItem('token')
          setToken(null)
          setUser(null)
        })
        .finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [token])

  const login = async (email: string, password: string) => {
    const response = await authApi.login({ email, password })
    localStorage.setItem('token', response.token)
    setToken(response.token)
    const userInfo = await authApi.me()
    setUser(userInfo)
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ token, user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
