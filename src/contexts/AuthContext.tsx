/**
 * AuthContext — exposes logout trigger to descendants.
 *
 * AuthGate owns the `authed` state and provides `logout()` via context
 * so the Sidebar can trigger a logout without prop drilling.
 */
import { createContext, useContext } from 'react'

interface AuthContextValue {
  /** Call to log out: clears server cookie, emits BroadcastChannel, resets auth state */
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue>({
  logout: () => {},
})

export function useAuth(): AuthContextValue {
  return useContext(AuthContext)
}
