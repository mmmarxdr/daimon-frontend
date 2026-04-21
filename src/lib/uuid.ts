// uuid() returns a RFC 4122 v4 UUID. Wraps crypto.randomUUID when available
// (modern browsers in secure contexts: HTTPS, localhost, 127.0.0.1) and falls
// back to a hand-rolled v4 generator when the API is missing — which happens
// when daimon is hosted under a non-localhost origin over plain HTTP (the
// common WSL `http://172.x.x.x:8080` case where Chrome refuses to expose
// crypto.randomUUID outside of secure contexts).
//
// The fallback uses crypto.getRandomValues for actual randomness (still
// available outside secure contexts) and falls back to Math.random as a last
// resort — predictable but never blocks the UI from rendering.
export function uuid(): string {
  const c = globalThis.crypto
  if (c && typeof c.randomUUID === 'function') {
    return c.randomUUID()
  }
  // RFC 4122 v4 from random bytes.
  const bytes = new Uint8Array(16)
  if (c && typeof c.getRandomValues === 'function') {
    c.getRandomValues(bytes)
  } else {
    for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256)
  }
  // Set version (4) and variant (10) bits per RFC 4122.
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0'))
  return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10, 16).join('')}`
}
