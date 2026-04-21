import { describe, it, expect } from 'vitest'

import {
  EMBEDDING_PROVIDERS,
  EMBEDDING_PROVIDER_BY_ID,
  EMBEDDING_INTRO_COPY,
  EMBEDDING_MODEL_CHANGE_WARNING,
} from '../embeddingCatalog'

describe('EMBEDDING_PROVIDERS', () => {
  it('exposes openai and gemini in stable order', () => {
    const ids = EMBEDDING_PROVIDERS.map((p) => p.id)
    expect(ids).toEqual(['openai', 'gemini'])
  })

  it('every provider has at least one recommended model', () => {
    for (const p of EMBEDDING_PROVIDERS) {
      const recommended = p.models.filter((m) => m.recommended)
      expect(recommended.length).toBeGreaterThan(0)
    }
  })

  it('every model has pricing copy and dimensions', () => {
    for (const p of EMBEDDING_PROVIDERS) {
      for (const m of p.models) {
        expect(m.pricing.length).toBeGreaterThan(0)
        expect(m.dimensions).toBeGreaterThan(0)
      }
    }
  })

  it('apiKeyUrl is a real https url for each provider', () => {
    for (const p of EMBEDDING_PROVIDERS) {
      expect(p.apiKeyUrl.startsWith('https://')).toBe(true)
    }
  })
})

describe('EMBEDDING_PROVIDER_BY_ID', () => {
  it('lookups return the matching provider entry', () => {
    expect(EMBEDDING_PROVIDER_BY_ID.openai.id).toBe('openai')
    expect(EMBEDDING_PROVIDER_BY_ID.gemini.id).toBe('gemini')
  })
})

describe('editorial copy', () => {
  it('intro copy mentions the search-by-meaning concept', () => {
    expect(EMBEDDING_INTRO_COPY.toLowerCase()).toContain('meaning')
  })

  it('change warning explicitly says invalidating prior embeddings', () => {
    expect(EMBEDDING_MODEL_CHANGE_WARNING.toLowerCase()).toContain('invalidat')
  })
})
