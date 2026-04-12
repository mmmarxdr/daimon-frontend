const BASE_URL = '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error ?? `HTTP ${res.status}`)
  }
  return res.json()
}

// ─── Types (mirroring API contract from dashboard-design.md) ─────────────────

export interface AgentStatus {
  status: 'running' | 'idle' | 'error'
  uptime_seconds: number
  version: string
}

export interface MetricsSnapshot {
  today: {
    input_tokens: number
    output_tokens: number
    cost_usd: number
    conversations: number
    messages: number
  }
  month: {
    input_tokens: number
    output_tokens: number
    cost_usd: number
  }
  history: Array<{
    date: string
    input_tokens: number
    output_tokens: number
    cost_usd: number
  }>
}

export interface Message {
  role: 'user' | 'assistant' | 'tool'
  content: string
  timestamp: string
}

export interface Conversation {
  id: string
  channel_id: string
  messages: Message[]
  created_at: string
  updated_at: string
}

export interface MemoryEntry {
  id: string
  content: string
  tags: string[]
  source_conversation_id: string
  created_at: string
}

// ─── API functions ────────────────────────────────────────────────────────────

const _realApi = {
  status: () => request<AgentStatus>('/status'),

  metrics: () => request<MetricsSnapshot>('/metrics'),
  metricsHistory: (days = 30) => request<MetricsSnapshot>(`/metrics/history?days=${days}`),

  conversations: (params?: { limit?: number; offset?: number; channel?: string }) => {
    const q = new URLSearchParams()
    if (params?.limit)   q.set('limit',   String(params.limit))
    if (params?.offset)  q.set('offset',  String(params.offset))
    if (params?.channel) q.set('channel', params.channel)
    return request<{ items: Conversation[]; total: number }>(`/conversations?${q}`)
  },

  conversation: (id: string) => request<Conversation>(`/conversations/${id}`),
  deleteConversation: (id: string) => request<void>(`/conversations/${id}`, { method: 'DELETE' }),

  memory: (q = '', limit = 20) =>
    request<{ items: MemoryEntry[] }>(`/memory?q=${encodeURIComponent(q)}&limit=${limit}`),

  deleteMemory: () => request<void>('/memory', { method: 'DELETE' }),
  deleteMemoryEntry: (id: string) => request<void>(`/memory/${id}`, { method: 'DELETE' }),
  postMemory: (content: string, tags: string[]) =>
    request<MemoryEntry>('/memory', { method: 'POST', body: JSON.stringify({ content, tags }) }),

  config: () => request<Record<string, unknown>>('/config'),
  updateConfig: (config: Record<string, unknown>) =>
    request<{ message: string }>('/config', { method: 'PUT', body: JSON.stringify(config) }),
}

// ─── WebSocket helper ─────────────────────────────────────────────────────────

import { mockApi as _mockApi, MockWebSocket as _MockWebSocket } from './mock'

export function createWebSocket(path: string): WebSocket {
  if (import.meta.env.VITE_MOCK === 'true') {
    return new _MockWebSocket(path) as unknown as WebSocket
  }
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const host = window.location.host
  return new WebSocket(`${protocol}//${host}${path}`)
}

// ─── Conditional mock swap (tree-shaken in production) ────────────────────────

export const api = import.meta.env.VITE_MOCK === 'true' ? _mockApi : _realApi
