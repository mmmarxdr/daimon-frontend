/**
 * Regression tests — stuck streaming cursor after multi-step (tool-using) turns.
 *
 * Bug: In a text → tool → text turn sequence, the FIRST text message keeps
 * `isStreaming: true` forever. `tool_start` never finalizes the preceding
 * streaming assistant message, and `done` only clears the LAST message.
 *
 * Fix expectations:
 *   1. After `tool_start`, any preceding assistant message with
 *      `isStreaming: true` must be finalized (`isStreaming: false`).
 *   2. After `done`, NO message may have `isStreaming: true` (belt-and-suspenders).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, act, waitFor } from '@testing-library/react'

vi.mock('../../api/client', () => ({
  api: {
    listMedia: vi.fn().mockResolvedValue([]),
    uploadFile: vi.fn(),
    deleteMedia: vi.fn(),
  },
  createWebSocket: vi.fn(),
}))

window.HTMLElement.prototype.scrollIntoView = vi.fn()

import { createWebSocket } from '../../api/client'
import { ChatPage } from '../ChatPage'

class MockWS {
  static instance: MockWS | null = null
  onmessage: ((e: MessageEvent) => void) | null = null
  onopen: (() => void) | null = null
  onclose: (() => void) | null = null
  onerror: (() => void) | null = null
  readyState = 1

  constructor() {
    MockWS.instance = this
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  send(_data: string) {}
  close() {}

  emit(data: unknown) {
    if (this.onmessage) {
      this.onmessage(new MessageEvent('message', { data: JSON.stringify(data) }))
    }
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  MockWS.instance = null
  ;(createWebSocket as ReturnType<typeof vi.fn>).mockImplementation(() => {
    return new MockWS() as unknown as WebSocket
  })
})

describe('ChatPage.streamingCursor', () => {
  it('no message has isStreaming=true after done in a text→tool→text turn', async () => {
    const { container } = render(<ChatPage />)
    const ws = MockWS.instance!
    expect(ws).toBeTruthy()

    act(() => {
      ws.emit({ type: 'turn_start' })
      // First text block starts streaming
      ws.emit({ type: 'token', text: "I'll search for that." })
      // Tool starts — the first text block is now complete
      ws.emit({ type: 'tool_start', name: 'web_search', tool_call_id: 'tc_1' })
      ws.emit({ type: 'tool_done', tool_call_id: 'tc_1', output: 'results', is_error: false })
      // Second text block streams
      ws.emit({ type: 'token', text: 'Here is the answer.' })
      // Turn completes
      ws.emit({ type: 'done' })
    })

    await waitFor(() => {
      // After done, no element with the blinking cursor class should exist.
      // The cursor is rendered by LiminalMd/LiminalReasoning only when
      // streaming === true on the block.
      const cursors = container.querySelectorAll('.liminal-cursor')
      expect(cursors).toHaveLength(0)
    })
  })

  it('first text block cursor disappears immediately when tool_start arrives', async () => {
    const { container } = render(<ChatPage />)
    const ws = MockWS.instance!

    // Emit the first text chunk and verify cursor is present.
    act(() => {
      ws.emit({ type: 'turn_start' })
      ws.emit({ type: 'token', text: "I'll search for that." })
    })

    await waitFor(() => {
      const cursors = container.querySelectorAll('.liminal-cursor')
      expect(cursors.length).toBeGreaterThanOrEqual(1)
    })

    // Now a tool starts — the text streaming phase is over.
    act(() => {
      ws.emit({ type: 'tool_start', name: 'web_search', tool_call_id: 'tc_2' })
    })

    await waitFor(() => {
      // The first text block's cursor must be gone now.
      // (The tool block itself never has a cursor, so zero is correct.)
      const cursors = container.querySelectorAll('.liminal-cursor')
      expect(cursors).toHaveLength(0)
    })
  })
})
