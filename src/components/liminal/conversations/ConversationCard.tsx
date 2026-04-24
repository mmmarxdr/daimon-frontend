import { useState, type CSSProperties } from 'react'
import type { ConversationSummary } from '../../../api/client'

export type Density = 'sparse' | 'normal' | 'dense'

interface ConversationCardProps {
  conv: ConversationSummary
  density?: Density
  onOpen: (id: string) => void
  onDelete: (id: string) => void
}

/**
 * Liminal-language card for a conversation summary. Visual parity with
 * MemoryCard (border-left accent, hover, density-aware padding) but owns
 * its own types and content layout. Intentionally NOT a shared shell in
 * v1 to avoid touching MemoryPage; follow-up can extract a LiminalCard
 * base once both surfaces are stable.
 */
export function ConversationCard({ conv, density = 'normal', onOpen, onDelete }: ConversationCardProps) {
  const [hover, setHover] = useState(false)

  const padY = density === 'dense' ? 10 : density === 'sparse' ? 20 : 14
  const padX = density === 'dense' ? 14 : density === 'sparse' ? 22 : 18

  const hasExplicitTitle = conv.title !== ''
  const titleText = conv.title || '(sin título)'
  const isDerived = !hasExplicitTitle || looksDerived(conv)
  const preview = conv.last_message || ''

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => onOpen(conv.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen(conv.id)
        }
      }}
      role="button"
      tabIndex={0}
      className="font-sans relative cursor-pointer"
      style={{
        padding: `${padY}px ${padX}px`,
        background: 'var(--bg-elev)',
        border: `1px solid ${hover ? 'var(--line-strong)' : 'var(--line)'}`,
        borderRadius: 6,
        borderLeft: `2px solid var(--accent)`,
        transition: 'border-color 0.15s',
      }}
    >
      {/* Header row: channel, relative time, delete */}
      <div
        className="flex items-center"
        style={{ gap: 8, marginBottom: 8, fontSize: 10.5, color: 'var(--ink-muted)' }}
      >
        <span
          className="font-mono uppercase"
          style={{ letterSpacing: 0.7, color: 'var(--ink-soft)' }}
        >
          {conv.channel_id}
        </span>
        <span style={{ color: 'var(--ink-faint)' }}>·</span>
        <span style={{ color: 'var(--ink-muted)' }}>{relativeTime(conv.updated_at)}</span>
        <span className="flex-1" />
        <span style={{ color: 'var(--ink-muted)' }}>
          {conv.message_count} msg{conv.message_count === 1 ? '' : 's'}
        </span>
        <button
          type="button"
          aria-label="Delete conversation"
          onClick={(e) => {
            e.stopPropagation()
            onDelete(conv.id)
          }}
          className="cursor-pointer"
          style={{
            width: 22,
            height: 22,
            borderRadius: 4,
            background: 'transparent',
            border: '1px solid transparent',
            color: 'var(--ink-muted)',
            fontSize: 12,
            lineHeight: 1,
            opacity: hover ? 1 : 0,
            transition: 'opacity 0.15s',
          }}
        >
          ×
        </button>
      </div>

      {/* Title */}
      <div
        className={isDerived ? 'font-serif italic' : 'font-sans'}
        style={{
          fontSize: 14,
          lineHeight: 1.45,
          color: 'var(--ink)',
          fontWeight: isDerived ? 400 : 500,
        }}
      >
        {titleText}
      </div>

      {/* Preview — subtle, collapsed when identical to title */}
      {preview && preview !== titleText && (
        <div
          className="font-sans"
          style={{
            marginTop: 4,
            fontSize: 12,
            lineHeight: 1.55,
            color: 'var(--ink-muted)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {preview}
        </div>
      )}
    </div>
  )
}

/**
 * Heuristic: a title derived from the first user message typically starts
 * with a lowercase letter or punctuation and runs the full length. Real
 * titles (LLM-generated or manual) capitalise and are concise. Used to
 * render derived titles in italic so the user sees the distinction.
 */
function looksDerived(conv: ConversationSummary): boolean {
  if (!conv.title) return true
  // If title equals last_message's prefix, it's almost certainly derived.
  return conv.last_message?.startsWith(conv.title.slice(0, 20)) ?? false
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'hace un instante'
  if (m < 60) return `hace ${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `hace ${h}h`
  const d = Math.floor(h / 24)
  if (d < 30) return `hace ${d}d`
  return new Date(iso).toLocaleDateString()
}

export type { ConversationSummary }

// Hint for the future LiminalCard extraction.
export const __TODO_LIMINAL_CARD_EXTRACTION__ =
  'ConversationCard copies MemoryCard visual patterns for v1. Extract a LiminalCard shell in a follow-up change.'

// Type guard so CSSProperties is used (silences unused import if the file
// evolves without inline style props).
const _unused: CSSProperties = {}
export const _typeAnchor = _unused
