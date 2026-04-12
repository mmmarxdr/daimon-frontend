import { z } from 'zod'

const MASKED = '••••••••'

export const configSchema = z.object({
  agent: z.object({
    name: z.string().min(1, 'Name is required'),
    system_prompt: z.string(),
    max_iterations: z.number().int().min(1).max(50),
    max_tokens: z.number().int().min(1),
    history_length: z.number().int().min(1).max(100),
  }),
  provider: z.object({
    type: z.enum(['anthropic', 'openai', 'ollama', 'gemini']),
    model: z.string().min(1, 'Model is required'),
    api_key: z.string(),    // may be masked — handled on submit
    base_url: z.string().optional(),
    timeout: z.number().int().min(1),
  }),
  channels: z.object({
    active: z.enum(['cli', 'telegram', 'discord']),
    telegram: z.object({
      token: z.string(),
      allowed_user_ids: z.array(z.string()),
    }).optional(),
  }),
  tools: z.object({
    shell: z.object({
      enabled: z.boolean(),
      allow_all: z.boolean(),
      allowed_commands: z.array(z.string()),
    }),
    file: z.object({
      enabled: z.boolean(),
      base_path: z.string(),
      max_file_size: z.number().int().min(1),
    }),
    http: z.object({
      enabled: z.boolean(),
      timeout: z.number().int().min(1),
      max_response_size: z.number().int().min(1),
      blocked_domains: z.array(z.string()),
    }),
  }),
  limits: z.object({
    tool_timeout: z.number().int().min(1),
    total_timeout: z.number().int().min(1),
    monthly_budget_usd: z.number().min(0).optional(),
  }),
  dashboard: z.object({
    port: z.number().int().min(1024).max(65535),
    auth_token: z.string().optional(),
  }),
})

export type ConfigFormData = z.infer<typeof configSchema>

export const MASKED_VALUE = MASKED

export const KNOWN_MODELS: Record<string, string[]> = {
  anthropic: ['claude-opus-4-5', 'claude-sonnet-4-5', 'claude-haiku-3-5'],
  openai:    ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  ollama:    ['llama3', 'mistral', 'phi3', 'gemma2'],
  gemini:    ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.0-pro'],
}

export const DEFAULT_CONFIG: ConfigFormData = {
  agent: { name: 'MicroAgent', system_prompt: '', max_iterations: 10, max_tokens: 4096, history_length: 20 },
  provider: { type: 'anthropic', model: 'claude-sonnet-4-5', api_key: '', base_url: '', timeout: 60 },
  channels: { active: 'cli', telegram: { token: '', allowed_user_ids: [] } },
  tools: {
    shell: { enabled: true, allow_all: false, allowed_commands: [] },
    file:  { enabled: true, base_path: '~', max_file_size: 1048576 },
    http:  { enabled: true, timeout: 30, max_response_size: 1048576, blocked_domains: [] },
  },
  limits: { tool_timeout: 30, total_timeout: 300, monthly_budget_usd: 0 },
  dashboard: { port: 8080, auth_token: '' },
}
