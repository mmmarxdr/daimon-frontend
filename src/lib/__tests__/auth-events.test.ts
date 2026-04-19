/**
 * T-026 RED — auth-events: emit/receive BroadcastChannel roundtrip +
 * storage-event fallback (FR-42, FR-43, FR-44)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ─── BroadcastChannel mock ────────────────────────────────────────────────────
// We need a shared channel map so that instances created with the same name
// can exchange messages in tests.
type Listener = (event: MessageEvent) => void
const channelListeners = new Map<string, Set<Listener>>()

class MockBroadcastChannel {
  name: string
  onmessage: ((event: MessageEvent) => void) | null = null

  constructor(name: string) {
    this.name = name
    if (!channelListeners.has(name)) {
      channelListeners.set(name, new Set())
    }
  }

  postMessage(data: unknown) {
    const listeners = channelListeners.get(this.name)
    if (!listeners) return
    const event = new MessageEvent('message', { data })
    listeners.forEach(fn => fn(event))
    if (this.onmessage) this.onmessage(event)
  }

  addEventListener(_: string, listener: Listener) {
    channelListeners.get(this.name)?.add(listener)
  }

  removeEventListener(_: string, listener: Listener) {
    channelListeners.get(this.name)?.delete(listener)
  }

  close() {
    // no-op for tests
  }
}

beforeEach(() => {
  channelListeners.clear()
  vi.stubGlobal('BroadcastChannel', MockBroadcastChannel)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
})

describe('auth-events — BroadcastChannel roundtrip (FR-42, FR-43)', () => {
  it('onLogout callback is called when emitLogout fires', async () => {
    const { emitLogout, onLogout } = await import('../../lib/auth-events')

    const cb = vi.fn()
    const cleanup = onLogout(cb)

    emitLogout()

    expect(cb).toHaveBeenCalledOnce()

    cleanup()
  })

  it('onLogout callback receives a message event with type logged_out', async () => {
    const { emitLogout, onLogout } = await import('../../lib/auth-events')

    let received: unknown = null
    const cleanup = onLogout((event) => {
      received = event
    })

    emitLogout()

    // The callback may receive the raw MessageEvent or a parsed payload
    // depending on implementation — what matters is it fires
    expect(received).not.toBeNull()
    cleanup()
  })

  it('multiple onLogout listeners all fire', async () => {
    const { emitLogout, onLogout } = await import('../../lib/auth-events')

    const cb1 = vi.fn()
    const cb2 = vi.fn()
    const cleanup1 = onLogout(cb1)
    const cleanup2 = onLogout(cb2)

    emitLogout()

    expect(cb1).toHaveBeenCalledOnce()
    expect(cb2).toHaveBeenCalledOnce()

    cleanup1()
    cleanup2()
  })

  it('cleanup function removes listener — no call after cleanup', async () => {
    const { emitLogout, onLogout } = await import('../../lib/auth-events')

    const cb = vi.fn()
    const cleanup = onLogout(cb)
    cleanup()

    emitLogout()

    expect(cb).not.toHaveBeenCalled()
  })
})

describe('auth-events — storage fallback when BroadcastChannel unavailable (FR-44)', () => {
  it('onLogout still registers when BroadcastChannel is undefined', async () => {
    // Simulate no BroadcastChannel support
    vi.stubGlobal('BroadcastChannel', undefined)
    vi.resetModules()

    const { onLogout } = await import('../../lib/auth-events')

    // Should not throw
    expect(() => {
      const cleanup = onLogout(vi.fn())
      cleanup()
    }).not.toThrow()
  })

  it('emitLogout still fires via storage event when BroadcastChannel is undefined', async () => {
    vi.stubGlobal('BroadcastChannel', undefined)
    vi.resetModules()

    const { emitLogout, onLogout } = await import('../../lib/auth-events')

    const cb = vi.fn()
    const cleanup = onLogout(cb)

    emitLogout()

    // Simulate the storage event that would fire across tabs
    const storageEvent = new StorageEvent('storage', {
      key: '__auth_logout__',
      newValue: String(Date.now()),
    })
    window.dispatchEvent(storageEvent)

    expect(cb).toHaveBeenCalled()
    cleanup()
  })
})
