"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { api } from "@/lib/api"
import { User, AuthResponse, LoginCredentials, RegisterData } from '@/src/contracts'

interface AuthContextType {
  user: User | null
  loading: boolean
  token: string | null
  login: (credentials: LoginCredentials) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  updateUser: (user: Partial<User>) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // Check for token on mount
    const storedToken = localStorage.getItem('token')
    if (storedToken) {
      setToken(storedToken)
      // Fetch user profile
      fetchUserProfile(storedToken)
    } else {
      setLoading(false)
    }
  }, [])

  const fetchUserProfile = async (authToken: string) => {
    try {
      const response = await api.get('/auth/profile', {
        headers: { Authorization: `Bearer ${authToken}` }
      })
      setUser(response.data)
    } catch (error) {
      console.error('Error fetching user profile:', error)
      localStorage.removeItem('token')
    } finally {
      setLoading(false)
    }
  }

  const login = async (credentials: LoginCredentials) => {
    const response = await api.post<AuthResponse>('/auth/login', credentials)
    const { access_token, user: userData } = response.data
    localStorage.setItem('token', access_token)
    setToken(access_token)
    setUser(userData)

    toast({
      title: "Login successful",
      description: "Welcome back!",
    })

    router.push("/dashboard")
  }

  const register = async (data: RegisterData) => {
    try {
      setLoading(true)
      const response = await api.post("/auth/register", data, {
        headers: {
          'Content-Type': 'application/json'
        }
      })

      toast({
        title: "Registration successful",
        description: "Please login with your new account",
      })

      router.push("/login")
    } catch (error) {
      toast({
        title: "Registration failed",
        description: "Email may already be in use",
        variant: "destructive",
      })
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
    router.push("/")
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    })
  }

  const updateUser = (updatedUser: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updatedUser })
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, token, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

