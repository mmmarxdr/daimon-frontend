// Curated catalog of embedding-capable providers + models for the Settings UI.
// Hand-maintained because pricing comes from provider docs, not from any API.
//
// **Important**: changing the model after data is already embedded silently
// invalidates prior vectors — embeddings from different models live in
// different vector spaces. The settings UI surfaces this via the
// `EMBEDDING_MODEL_CHANGE_WARNING` copy.

export type EmbeddingProviderId = 'openai' | 'gemini'

export interface EmbeddingModel {
  /** Model ID sent to the provider's embeddings endpoint. */
  id: string
  /** Short human label for the dropdown. */
  label: string
  /** One-line pricing description, sourced from the provider's pricing page. */
  pricing: string
  /** Vector dimensionality — useful context for advanced users. */
  dimensions: number
  /** True for the recommended default per provider. */
  recommended?: boolean
  /** Optional editorial caveat the UI shows beneath the dropdown. */
  note?: string
}

export interface EmbeddingProviderEntry {
  id: EmbeddingProviderId
  label: string
  /** Where the user gets an API key. */
  apiKeyUrl: string
  /** Short editorial intro shown above the model picker. */
  intro: string
  models: EmbeddingModel[]
}

export const EMBEDDING_PROVIDERS: EmbeddingProviderEntry[] = [
  {
    id: 'openai',
    label: 'OpenAI',
    apiKeyUrl: 'https://platform.openai.com/api-keys',
    intro:
      'Reliable, fast, and cheap at personal volume. The small model handles books for under a cent each.',
    models: [
      {
        id: 'text-embedding-3-small',
        label: 'text-embedding-3-small',
        pricing: '$0.02 / 1M tokens',
        dimensions: 1536,
        recommended: true,
        note: 'Best default. ~$0.001 per average book.',
      },
      {
        id: 'text-embedding-3-large',
        label: 'text-embedding-3-large',
        pricing: '$0.13 / 1M tokens',
        dimensions: 3072,
        note: 'Higher recall on subtle queries. 6.5× the cost.',
      },
      {
        id: 'text-embedding-ada-002',
        label: 'text-embedding-ada-002 (legacy)',
        pricing: '$0.10 / 1M tokens',
        dimensions: 1536,
        note: 'Older generation. Pick text-embedding-3-small instead unless you have a specific reason.',
      },
    ],
  },
  {
    id: 'gemini',
    label: 'Google Gemini',
    apiKeyUrl: 'https://aistudio.google.com/app/apikey',
    intro:
      'Free tier is generous. Same Google AI Studio key that works for the chat models.',
    models: [
      {
        id: 'gemini-embedding-001',
        label: 'gemini-embedding-001',
        pricing: 'Free tier (generous quota)',
        dimensions: 3072,
        recommended: true,
        note: 'Current stable model. Wider vectors than the older text-embedding-004 — better recall on subtle queries.',
      },
      {
        id: 'gemini-embedding-2-preview',
        label: 'gemini-embedding-2-preview',
        pricing: 'Free tier (generous quota)',
        dimensions: 3072,
        note: 'Preview generation. Stick with the stable model unless you have a reason.',
      },
    ],
  },
]

export const EMBEDDING_PROVIDER_BY_ID: Record<EmbeddingProviderId, EmbeddingProviderEntry> = {
  openai: EMBEDDING_PROVIDERS[0],
  gemini: EMBEDDING_PROVIDERS[1],
}

/**
 * Editorial copy shown in the info `i` tooltip beside the section header.
 * Tone: Daimon speaks to the user, no jargon. Mirrors the Liminal voice from
 * the Memory page ("how I find the right thing to remember").
 */
export const EMBEDDING_INTRO_COPY = `When you ask me about something, I do a fast keyword search. That works, but it misses things you described differently than the document did.

If you let me build embeddings — small numerical signatures of each chunk — I can also search by meaning. Asking about "memory leaks" finds a chunk that talks about "unfreed allocations".

Worth knowing: changing the model later means I lose the meaning of what I already knew. Pick one and stick with it for a while.`

/**
 * Warning shown when the user changes provider or model after embeddings have
 * been generated. Surfaced inline near the model dropdown.
 */
export const EMBEDDING_MODEL_CHANGE_WARNING = `Heads-up: changing the model invalidates everything I've already embedded. Old documents will still appear, but searches won't use their vectors until they're re-indexed. (Re-indexing UI is coming in a future update — for now, deleting and re-uploading is the way to refresh.)`
