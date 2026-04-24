interface ConversationsPreambleProps {
  count: number
}

/**
 * Liminal-voice header for the Conversations list. Mirrors MemoryPreamble's
 * serif-italic aspirational voice; copy is conversational and first-person
 * ("las conversaciones que hemos tenido"). Empty state swaps in an
 * explicitly neutral line — no dedicated illustration in v1.
 */
export function ConversationsPreamble({ count }: ConversationsPreambleProps) {
  const isEmpty = count === 0
  return (
    <div className="font-sans" style={{ marginBottom: 24 }}>
      <div
        className="font-serif italic"
        style={{ fontSize: 22, lineHeight: 1.3, color: 'var(--ink)' }}
      >
        {isEmpty
          ? 'Nada aún.'
          : 'Las conversaciones que hemos tenido.'}
      </div>
      <div
        className="font-sans"
        style={{
          marginTop: 6,
          fontSize: 12.5,
          color: 'var(--ink-muted)',
          maxWidth: 520,
          lineHeight: 1.55,
        }}
      >
        {isEmpty
          ? 'Empezá un chat y lo encontrás acá la próxima vez que vuelvas.'
          : 'Retomá desde donde dejaste, revisitá lo que dijimos, o archivá lo que ya no te sirve.'}
      </div>
    </div>
  )
}
