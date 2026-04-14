// ─── Setup API types ──────────────────────────────────────────────────────────

export interface SetupStatusResponse {
  needs_setup: boolean
  missing: string[] | null
}

export interface ModelInfo {
  id: string
  display_name: string
  cost_in: number
  cost_out: number
  context_k: number
  description: string
}

export interface ProviderInfo {
  display_name: string
  requires_api_key: boolean
  supports_base_url: boolean
  default_base_url?: string
  models: ModelInfo[]
}

export interface ProvidersResponse {
  providers: Record<string, ProviderInfo>
  other_model_sentinel?: { id: string; display_name: string; description: string }
}

export interface ValidateKeyRequest {
  provider: string
  api_key: string
  model: string
  base_url?: string
}

export interface ValidateKeyResponse {
  valid: boolean
  error: string | null
  model_name?: string
}

export interface SetupCompleteRequest {
  provider: string
  api_key: string
  model: string
  base_url?: string
}

export interface SetupCompleteResponse {
  success: boolean
  auth_token: string
  restart_required: boolean
  config_path: string
}

// ─── No-auth fetch helpers ────────────────────────────────────────────────────

async function fetchNoAuth<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
    throw new Error(err.error ?? `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

function postNoAuth<T>(path: string, body: unknown): Promise<T> {
  return fetchNoAuth<T>(path, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

// ─── Setup API ────────────────────────────────────────────────────────────────

export const setupApi = {
  status: (): Promise<SetupStatusResponse> =>
    fetchNoAuth<SetupStatusResponse>('/api/setup/status'),

  providers: (): Promise<ProvidersResponse> =>
    fetchNoAuth<ProvidersResponse>('/api/setup/providers'),

  validateKey: (req: ValidateKeyRequest): Promise<ValidateKeyResponse> =>
    postNoAuth<ValidateKeyResponse>('/api/setup/validate-key', req),

  complete: (req: SetupCompleteRequest): Promise<SetupCompleteResponse> =>
    postNoAuth<SetupCompleteResponse>('/api/setup/complete', req),

  deleteConfig: (confirm: string): Promise<{ needs_setup: boolean }> =>
    postNoAuth<{ needs_setup: boolean }>('/api/setup/reset', { confirm }),
}
