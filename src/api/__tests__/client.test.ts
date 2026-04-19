/**
 * T-024 RED — client.ts: no Authorization header, no localStorage writes,
 * WS URL free of ?token= (FR-39..FR-41, INV-4, INV-7, AS-17)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ─── localStorage spy ─────────────────────────────────────────────────────────
const localStorageSetItemSpy = vi.spyOn(Storage.prototype, 'setItem')
const localStorageGetItemSpy = vi.spyOn(Storage.prototype, 'getItem')

// ─── fetch spy ────────────────────────────────────────────────────────────────
const fetchSpy = vi.fn()

// ─── WebSocket spy ────────────────────────────────────────────────────────────
let lastWSUrl = ''
class MockWebSocket {
  url: string
  constructor(url: string) {
    lastWSUrl = url
    this.url = url
  }
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchSpy)
  vi.stubGlobal('WebSocket', MockWebSocket)
  localStorageSetItemSpy.mockClear()
  localStorageGetItemSpy.mockClear()
  fetchSpy.mockClear()
  lastWSUrl = ''
  // Reset any stale localStorage
  localStorage.clear()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

// Helper: make fetch return a successful JSON response
function mockFetchOk(body: unknown = {}) {
  fetchSpy.mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve(body),
  })
}

// Helper: make fetch return 204 (no body)
function mockFetch204() {
  fetchSpy.mockResolvedValue({
    ok: true,
    status: 204,
    json: () => Promise.resolve(null),
  })
}

// ─── Import the module AFTER stubs are in place ───────────────────────────────
// We use dynamic import so each test re-imports fresh if needed, but for
// these structural tests we just test the module's behavior.

describe('client.ts — no Authorization header (FR-40, INV-4)', () => {
  it('api.status does NOT include Authorization header', async () => {
    mockFetchOk({ status: 'running', uptime_seconds: 0, version: '0' })
    const { api } = await import('../client')
    await api.status()

    expect(fetchSpy).toHaveBeenCalledOnce()
    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit]
    const headers = init?.headers as Record<string, string> | undefined
    expect(headers?.['Authorization']).toBeUndefined()
  })

  it('api.config does NOT include Authorization header', async () => {
    mockFetchOk({})
    const { api } = await import('../client')
    await api.config()

    expect(fetchSpy).toHaveBeenCalledOnce()
    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit]
    const headers = init?.headers as Record<string, string> | undefined
    expect(headers?.['Authorization']).toBeUndefined()
  })

  it('every fetch call uses credentials: include', async () => {
    mockFetchOk({ status: 'running', uptime_seconds: 0, version: '0' })
    const { api } = await import('../client')
    await api.status()

    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit]
    expect(init?.credentials).toBe('include')
  })
})

describe('client.ts — no localStorage writes for auth (FR-39, INV-4)', () => {
  it('importing client does not write to localStorage', async () => {
    localStorageSetItemSpy.mockClear()
    await import('../client')
    const authWrites = localStorageSetItemSpy.mock.calls.filter(([key]) =>
      key === 'daimon_auth_token' || key?.toString().includes('auth')
    )
    expect(authWrites).toHaveLength(0)
  })

  it('api.status() call does not write to localStorage', async () => {
    mockFetchOk({ status: 'running', uptime_seconds: 0, version: '0' })
    const { api } = await import('../client')
    localStorageSetItemSpy.mockClear()
    await api.status()
    expect(localStorageSetItemSpy).not.toHaveBeenCalled()
  })
})

type ApiWithAuth = typeof import('../client').api & {
  auth: { login: (token: string) => Promise<void>; logout: () => Promise<void> }
}

describe('client.ts — api.auth.login posts to /api/auth/login (FR-37, FR-40)', () => {
  it('api.auth.login POSTs to /api/auth/login with token in body', async () => {
    mockFetch204()
    const { api } = await import('../client')
    await (api as ApiWithAuth).auth.login('my-secret-token')

    expect(fetchSpy).toHaveBeenCalledOnce()
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit]
    expect(url).toContain('/api/auth/login')
    expect(init?.method).toBe('POST')
    expect(init?.credentials).toBe('include')
    const body = JSON.parse(init?.body as string)
    expect(body).toEqual({ token: 'my-secret-token' })
  })

  it('api.auth.login does NOT include Authorization header', async () => {
    mockFetch204()
    const { api } = await import('../client')
    await (api as ApiWithAuth).auth.login('tok')

    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit]
    const headers = init?.headers as Record<string, string> | undefined
    expect(headers?.['Authorization']).toBeUndefined()
  })

  it('api.auth.login does NOT write to localStorage', async () => {
    mockFetch204()
    const { api } = await import('../client')
    localStorageSetItemSpy.mockClear()
    await (api as ApiWithAuth).auth.login('tok')
    expect(localStorageSetItemSpy).not.toHaveBeenCalled()
  })
})

describe('client.ts — api.auth.logout posts to /api/auth/logout (FR-16)', () => {
  it('api.auth.logout POSTs to /api/auth/logout', async () => {
    mockFetch204()
    const { api } = await import('../client')
    await (api as ApiWithAuth).auth.logout()

    expect(fetchSpy).toHaveBeenCalledOnce()
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit]
    expect(url).toContain('/api/auth/logout')
    expect(init?.method).toBe('POST')
    expect(init?.credentials).toBe('include')
  })
})

describe('client.ts — createWebSocket URL free of ?token= (FR-41, INV-7, AS-17)', () => {
  it('createWebSocket does NOT append ?token= to URL', async () => {
    const { createWebSocket } = await import('../client')
    createWebSocket('/ws/chat')

    expect(lastWSUrl).not.toContain('?token=')
    expect(lastWSUrl).not.toContain('token=')
    expect(lastWSUrl).toContain('/ws/chat')
  })

  it('createWebSocket uses ws: protocol for http:', async () => {
    // jsdom default is http:
    const { createWebSocket } = await import('../client')
    createWebSocket('/ws/metrics')

    expect(lastWSUrl.startsWith('ws://')).toBe(true)
  })
})
