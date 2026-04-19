import { useState, useEffect, useCallback, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { api, AuthError } from '../api/client'
import { emitLogout, onLogout } from '../lib/auth-events'
import { AuthContext } from '../contexts/AuthContext'
import { KeyRound } from 'lucide-react'

interface AuthGateProps {
  children: ReactNode
}

export function AuthGate({ children }: AuthGateProps) {
  const [authed, setAuthed] = useState<boolean | null>(null) // null = checking
  const [token, setToken] = useState('')
  const [error, setError] = useState('')
  const queryClient = useQueryClient()

  // On mount, verify auth by calling the API.
  // Auth comes from an HttpOnly cookie set by the server.
  // The token is NEVER stored in localStorage or any JS-accessible store (INV-4).
  useEffect(() => {
    api.status()
      .then(() => setAuthed(true))
      .catch((err) => {
        if (err instanceof AuthError) {
          setAuthed(false)
        } else {
          // Network error or server down — let app handle it.
          setAuthed(true)
        }
      })
  }, [])

  // Mount BroadcastChannel listener ONCE at app-init level (FR-43, AS-13).
  // On receiving 'logged_out', clear cache and show AuthGate — no network round-trip.
  useEffect(() => {
    const cleanup = onLogout(() => {
      queryClient.clear()
      setAuthed(false)
    })
    return cleanup
  }, [queryClient])

  const handleLogout = useCallback(async () => {
    try {
      await api.auth.logout()
    } catch {
      // If logout fails (e.g. network), still clear local state
    }
    emitLogout()          // notify other tabs (FR-42)
    queryClient.clear()
    setAuthed(false)
  }, [queryClient])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = token.trim()
    if (!trimmed) return

    try {
      // POST /api/auth/login — server sets HttpOnly cookie on 204 (FR-37)
      await api.auth.login(trimmed)
      // Token MUST NOT be retained or written anywhere (FR-38, INV-4)
      setToken('')
      setError('')
      // Re-check auth status to confirm cookie is valid
      await api.status()
      setAuthed(true)
    } catch (err) {
      if (err instanceof AuthError) {
        setError('Invalid token')
        setToken('')
      } else {
        // Server might be down — let through anyway.
        setAuthed(true)
      }
    }
  }

  // Loading state.
  if (authed === null) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-neutral-500 text-sm">Connecting...</div>
      </div>
    )
  }

  // Authenticated — render app with auth context so Sidebar can log out.
  if (authed) {
    return (
      <AuthContext.Provider value={{ logout: handleLogout }}>
        {children}
      </AuthContext.Provider>
    )
  }

  // Token prompt.
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-neutral-900 border border-neutral-800">
            <KeyRound className="w-5 h-5 text-neutral-400" />
          </div>
          <h1 className="text-lg font-semibold text-white">Daimon</h1>
          <p className="text-sm text-neutral-500">
            Enter the auth token shown in the server console.
          </p>
        </div>

        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Auth token"
          autoFocus
          className="w-full px-3 py-2.5 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600 font-mono"
        />

        {error && (
          <p className="text-sm text-red-400 text-center">{error}</p>
        )}

        <button
          type="submit"
          className="w-full py-2.5 bg-white text-black text-sm font-medium rounded-lg hover:bg-neutral-200 transition-colors"
        >
          Connect
        </button>

        <p className="text-xs text-neutral-600 text-center">
          Token is printed to the console when the server starts.
        </p>
      </form>
    </div>
  )
}
