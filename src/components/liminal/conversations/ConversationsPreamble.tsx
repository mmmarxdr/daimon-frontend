interface ConversationsPreambleProps {
  count: number
}

export function ConversationsPreamble({ count }: ConversationsPreambleProps) {
  const isEmpty = count === 0
  return (
    <div className="font-sans" style={{ marginBottom: 24 }}>
      <div
        className="font-serif italic"
        style={{ fontSize: 22, lineHeight: 1.3, color: 'var(--ink)' }}
      >
        {isEmpty
          ? 'nothing yet.'
          : 'the conversations we have had.'}
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
          ? 'start a chat and you will find it here the next time you come back.'
          : 'pick up where you left off, revisit what we said, or archive what you no longer need.'}
      </div>
    </div>
  )
}
