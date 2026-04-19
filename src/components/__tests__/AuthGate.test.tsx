/**
 * T-028/T-029 — AuthGate: submit → POST /api/auth/login → 204 → app renders;
 * 401 → error shown; no localStorage access (FR-37, FR-38, FR-39, AS-2)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthGate } from '../AuthGate'

// ─── localStorage spy ─────────────────────────────────────────────────────────
const localStorageSetItemSpy = vi.spyOn(Storage.prototype, 'setItem')

// ─── Mock api module ──────────────────────────────────────────────────────────
const mockAuthLogin = vi.fn()
const mockApiStatus = vi.fn()

vi.mock('../../api/client', () => ({
  api: {
    auth: {
      login: (token: string) => mockAuthLogin(token),
    },
    status: () => mockApiStatus(),
  },
  AuthError: class AuthError extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'AuthError'
    }
  },
}))

// ─── Mock auth-events (AuthGate imports it) ───────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mockOnLogout = vi.fn((_cb: () => void) => () => {})
const mockEmitLogout = vi.fn()

vi.mock('../../lib/auth-events', () => ({
  onLogout: (cb: () => void) => mockOnLogout(cb),
  emitLogout: () => mockEmitLogout(),
}))

// Import AuthError for use in tests AFTER mock is set up
import { AuthError } from '../../api/client'

function makeQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } })
}

function renderAuthGate(children = <div>dashboard</div>) {
  const qc = makeQueryClient()
  return render(
    <QueryClientProvider client={qc}>
      <AuthGate>{children}</AuthGate>
    </QueryClientProvider>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorageSetItemSpy.mockClear()
  localStorage.clear()
  // Default: onLogout returns a noop cleanup
  mockOnLogout.mockReturnValue(() => {})
})

describe('AuthGate — initial auth check', () => {
  it('shows loading state while checking auth', () => {
    // api.status never resolves (simulates slow network)
    mockApiStatus.mockReturnValue(new Promise(() => {}))
    renderAuthGate()
    expect(screen.getByText(/connecting/i)).toBeInTheDocument()
  })

  it('renders children when api.status resolves (cookie auth succeeds)', async () => {
    mockApiStatus.mockResolvedValue({ status: 'running', uptime_seconds: 0, version: '0' })
    renderAuthGate()
    await waitFor(() => expect(screen.getByText('dashboard')).toBeInTheDocument())
  })

  it('shows token form when api.status throws AuthError (no cookie)', async () => {
    mockApiStatus.mockRejectedValue(new AuthError('Unauthorized'))
    renderAuthGate()
    await waitFor(() => expect(screen.getByPlaceholderText(/auth token/i)).toBeInTheDocument())
  })
})

describe('AuthGate — form submission happy path (FR-37, AS-2)', () => {
  it('calls api.auth.login with the entered token', async () => {
    // Initial status check fails (no cookie)
    mockApiStatus.mockRejectedValueOnce(new AuthError('Unauthorized'))
    // api.auth.login resolves (204)
    mockAuthLogin.mockResolvedValue(undefined)
    // Post-login status check succeeds
    mockApiStatus.mockResolvedValue({ status: 'running', uptime_seconds: 0, version: '0' })

    renderAuthGate()

    await waitFor(() => screen.getByPlaceholderText(/auth token/i))

    fireEvent.change(screen.getByPlaceholderText(/auth token/i), {
      target: { value: 'my-secret-token' },
    })
    fireEvent.click(screen.getByRole('button', { name: /connect/i }))

    await waitFor(() => expect(mockAuthLogin).toHaveBeenCalledWith('my-secret-token'))
  })

  it('renders children after successful login', async () => {
    mockApiStatus.mockRejectedValueOnce(new AuthError('Unauthorized'))
    mockAuthLogin.mockResolvedValue(undefined)
    mockApiStatus.mockResolvedValue({ status: 'running', uptime_seconds: 0, version: '0' })

    renderAuthGate()
    await waitFor(() => screen.getByPlaceholderText(/auth token/i))

    fireEvent.change(screen.getByPlaceholderText(/auth token/i), {
      target: { value: 'tok' },
    })
    fireEvent.click(screen.getByRole('button', { name: /connect/i }))

    await waitFor(() => expect(screen.getByText('dashboard')).toBeInTheDocument())
  })

  it('clears the token input after successful login (FR-38)', async () => {
    mockApiStatus.mockRejectedValueOnce(new AuthError('Unauthorized'))
    mockAuthLogin.mockResolvedValue(undefined)
    mockApiStatus.mockResolvedValue({ status: 'running', uptime_seconds: 0, version: '0' })

    renderAuthGate()
    await waitFor(() => screen.getByPlaceholderText(/auth token/i))

    const input = screen.getByPlaceholderText(/auth token/i) as HTMLInputElement
    fireEvent.change(input, { target: { value: 'tok' } })
    fireEvent.click(screen.getByRole('button', { name: /connect/i }))

    await waitFor(() => expect(screen.getByText('dashboard')).toBeInTheDocument())
    // Input is gone when AuthGate unmounts (authed=true renders children)
    expect(screen.queryByPlaceholderText(/auth token/i)).not.toBeInTheDocument()
  })
})

describe('AuthGate — 401 on login shows error (FR-37)', () => {
  it('shows error message when api.auth.login throws AuthError', async () => {
    mockApiStatus.mockRejectedValueOnce(new AuthError('Unauthorized'))
    mockAuthLogin.mockRejectedValue(new AuthError('Unauthorized'))

    renderAuthGate()
    await waitFor(() => screen.getByPlaceholderText(/auth token/i))

    fireEvent.change(screen.getByPlaceholderText(/auth token/i), {
      target: { value: 'wrong-token' },
    })
    fireEvent.click(screen.getByRole('button', { name: /connect/i }))

    await waitFor(() => expect(screen.getByText(/invalid token/i)).toBeInTheDocument())
  })

  it('does NOT navigate to dashboard after 401', async () => {
    mockApiStatus.mockRejectedValueOnce(new AuthError('Unauthorized'))
    mockAuthLogin.mockRejectedValue(new AuthError('Unauthorized'))

    renderAuthGate()
    await waitFor(() => screen.getByPlaceholderText(/auth token/i))

    fireEvent.change(screen.getByPlaceholderText(/auth token/i), {
      target: { value: 'wrong' },
    })
    fireEvent.click(screen.getByRole('button', { name: /connect/i }))

    await waitFor(() => expect(screen.getByText(/invalid token/i)).toBeInTheDocument())
    expect(screen.queryByText('dashboard')).not.toBeInTheDocument()
  })
})

describe('AuthGate — no localStorage writes for auth (FR-39, INV-4)', () => {
  it('does NOT write to localStorage when login succeeds', async () => {
    mockApiStatus.mockRejectedValueOnce(new AuthError('Unauthorized'))
    mockAuthLogin.mockResolvedValue(undefined)
    mockApiStatus.mockResolvedValue({ status: 'running', uptime_seconds: 0, version: '0' })

    renderAuthGate()
    await waitFor(() => screen.getByPlaceholderText(/auth token/i))

    fireEvent.change(screen.getByPlaceholderText(/auth token/i), {
      target: { value: 'my-token' },
    })

    localStorageSetItemSpy.mockClear()
    fireEvent.click(screen.getByRole('button', { name: /connect/i }))

    await waitFor(() => expect(screen.getByText('dashboard')).toBeInTheDocument())

    const authWrites = localStorageSetItemSpy.mock.calls.filter(([key]) =>
      key === 'microagent_auth_token' || key?.toString().includes('auth_token')
    )
    expect(authWrites).toHaveLength(0)
  })

  it('does NOT write to localStorage when login fails', async () => {
    mockApiStatus.mockRejectedValueOnce(new AuthError('Unauthorized'))
    mockAuthLogin.mockRejectedValue(new AuthError('Unauthorized'))

    renderAuthGate()
    await waitFor(() => screen.getByPlaceholderText(/auth token/i))

    localStorageSetItemSpy.mockClear()
    fireEvent.change(screen.getByPlaceholderText(/auth token/i), {
      target: { value: 'bad' },
    })
    fireEvent.click(screen.getByRole('button', { name: /connect/i }))

    await waitFor(() => expect(screen.getByText(/invalid token/i)).toBeInTheDocument())

    const authWrites = localStorageSetItemSpy.mock.calls.filter(([key]) =>
      key === 'microagent_auth_token' || key?.toString().includes('auth_token')
    )
    expect(authWrites).toHaveLength(0)
  })
})
