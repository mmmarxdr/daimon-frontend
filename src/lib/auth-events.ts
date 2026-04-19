/**
 * auth-events — cross-tab logout notification (FR-42, FR-43, FR-44)
 *
 * Primary channel: BroadcastChannel("auth") — fires within a browser session.
 * Fallback: localStorage key '__auth_logout__' storage event — for browsers
 * that don't support BroadcastChannel (FR-44).
 *
 * Constraint: BroadcastChannel listener MUST be set up once at app init, NOT
 * per-component. Consumers call onLogout() once and store the cleanup fn.
 */

const CHANNEL_NAME = 'auth'
const STORAGE_KEY = '__auth_logout__'
const MSG_TYPE = 'logged_out'

// ─── Shared BroadcastChannel instance (singleton) ─────────────────────────────

let _bc: BroadcastChannel | null = null

function getBroadcastChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === 'undefined') return null
  if (!_bc) {
    _bc = new BroadcastChannel(CHANNEL_NAME)
  }
  return _bc
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Emit a logout event to all tabs.
 * Fires both via BroadcastChannel (primary) and localStorage storage event
 * (fallback for browsers without BroadcastChannel support).
 */
export function emitLogout(): void {
  const bc = getBroadcastChannel()
  if (bc) {
    bc.postMessage({ type: MSG_TYPE })
  } else {
    // Fallback: write a marker key — storage event fires in OTHER tabs.
    // For the CURRENT tab, we rely on the caller handling local state directly.
    try {
      localStorage.setItem(STORAGE_KEY, String(Date.now()))
    } catch {
      // Private browsing mode may block localStorage — ignore silently.
    }
  }
}

/**
 * Register a callback to be invoked when a logout event is received.
 * Returns a cleanup function that removes the listener.
 *
 * Must be called ONCE at app init level (e.g. in App.tsx), not per-component.
 */
export function onLogout(callback: (event?: MessageEvent | StorageEvent) => void): () => void {
  const bc = getBroadcastChannel()

  if (bc) {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === MSG_TYPE) {
        callback(event)
      }
    }
    bc.addEventListener('message', handler)
    return () => bc.removeEventListener('message', handler)
  } else {
    // Storage event fallback
    const handler = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY && event.newValue) {
        callback(event)
      }
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }
}
