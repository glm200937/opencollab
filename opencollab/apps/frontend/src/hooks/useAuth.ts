import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useAuthStore } from '../store/auth.store'
import type { User } from '@opencollab/types'

// ─── Types ────────────────────────────────────────────────────────────────────
interface LoginPayload    { email: string; password: string }
interface RegisterPayload { email: string; username: string; displayName: string; password: string }

interface AuthResponse {
  data: {
    user: User
    accessToken: string
    refreshToken: string
  }
}

// ─── Hook principal ───────────────────────────────────────────────────────────
export function useAuth() {
  const navigate     = useNavigate()
  const queryClient  = useQueryClient()
  const { setAuth, setTokens, logout: clearStore, accessToken, isAuthenticated } = useAuthStore()

  // Sync api interceptor avec le store
  api.defaults.headers.common['Authorization'] = accessToken
    ? `Bearer ${accessToken}`
    : ''

  // ── /me query ──────────────────────────────────────────────────────────────
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const res = await api.get<{ data: User }>('/auth/me')
      return res.data.data
    },
    enabled: !!accessToken,
    retry: false,
  })

  // ── Login ──────────────────────────────────────────────────────────────────
  const loginMutation = useMutation({
    mutationFn: (payload: LoginPayload) =>
      api.post<AuthResponse>('/auth/login', payload),
    onSuccess: ({ data }) => {
      const { user, accessToken, refreshToken } = data.data
      setAuth(user, accessToken, refreshToken)
      queryClient.setQueryData(['auth', 'me'], user)
      navigate('/dashboard')
    },
  })

  // ── Register ───────────────────────────────────────────────────────────────
  const registerMutation = useMutation({
    mutationFn: (payload: RegisterPayload) =>
      api.post<AuthResponse>('/auth/register', payload),
    onSuccess: ({ data }) => {
      const { user, accessToken, refreshToken } = data.data
      setAuth(user, accessToken, refreshToken)
      queryClient.setQueryData(['auth', 'me'], user)
      navigate('/dashboard')
    },
  })

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try { await api.post('/auth/logout') } catch { /* silencieux */ }
    clearStore()
    queryClient.clear()
    navigate('/login')
  }, [clearStore, queryClient, navigate])

  // ── Refresh token ──────────────────────────────────────────────────────────
  const refreshTokens = useCallback(async (refreshToken: string) => {
    const res = await api.post<{ data: { accessToken: string; refreshToken: string } }>(
      '/auth/refresh',
      { refreshToken },
    )
    setTokens(res.data.data.accessToken, res.data.data.refreshToken)
  }, [setTokens])

  return {
    user:           user ?? useAuthStore.getState().user,
    isAuthenticated,
    isLoading,
    login:          loginMutation.mutate,
    register:       registerMutation.mutate,
    logout,
    refreshTokens,
    loginError:     loginMutation.error,
    registerError:  registerMutation.error,
    isLoggingIn:    loginMutation.isPending,
    isRegistering:  registerMutation.isPending,
  }
}
