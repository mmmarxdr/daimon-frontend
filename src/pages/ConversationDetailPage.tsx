import { useMemo, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useConversation } from '../hooks/useApi'
import { useInfiniteConversationMessages } from '../hooks/useInfiniteConversationMessages'
import { api, type Message } from '../api/client'

function formatTime(iso: string): string {
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

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function ConversationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const convID = id ?? ''

  // Summary-ish info (conv metadata). The paginated display uses a
  // separate infinite query so we only materialise a window at a time.
  const { data: conversation, isLoading: loadingMeta, isError: errorMeta } =
    useConversation(convID)

  const {
    data: messagesData,
    isLoading: loadingMsgs,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteConversationMessages(convID || null)

  // Flatten newest-first pages into oldest-first for rendering.
  const messages: Message[] = useMemo(() => {
    if (!messagesData) return []
    const out: Message[] = []
    // Pages arrive newest-first; the first page is the latest window.
    // We render oldest → newest, so reverse page order and concat each.
    for (let i = messagesData.pages.length - 1; i >= 0; i--) {
      out.push(...messagesData.pages[i].messages)
    }
    return out
  }, [messagesData])

  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')

  const { mutate: renameConv } = useMutation({
    mutationFn: (title: string) => api.renameConversation(convID, title),
    onSuccess: () => {
      setEditingTitle(false)
      qc.invalidateQueries({ queryKey: ['conversation', convID] })
      qc.invalidateQueries({ queryKey: ['conversations'] })
    },
  })

  const { mutate: deleteConv } = useMutation({
    mutationFn: () => api.deleteConversation(convID),
    onSuccess: () => navigate('/conversations'),
  })

  const handleDelete = () => {
    if (window.confirm('¿Eliminar esta conversación? Podés restaurarla desde la base de datos dentro de los próximos 30 días.')) {
      deleteConv()
    }
  }

  const handleResume = () => {
    navigate(`/chat?conversation_id=${encodeURIComponent(convID)}`)
  }

  const handleExportJSON = () => {
    if (!conversation) return
    downloadFile(
      JSON.stringify(conversation, null, 2),
      `conversation-${conversation.id}.json`,
      'application/json',
    )
  }

  const handleExportMarkdown = () => {
    if (!conversation) return
    const lines: string[] = [
      `# ${displayTitle(conversation.id)}`,
      `**Channel:** ${conversation.channel_id}`,
      `**Created:** ${new Date(conversation.created_at).toLocaleString()}`,
      '',
      '---',
      '',
    ]
    for (const msg of conversation.messages) {
      const role = msg.role.charAt(0).toUpperCase() + msg.role.slice(1)
      const time = msg.timestamp ? new Date(msg.timestamp).toLocaleString() : ''
      lines.push(`### ${role}${time ? ` — ${time}` : ''}`)
      lines.push('')
      lines.push(msg.content)
      lines.push('')
    }
    downloadFile(
      lines.join('\n'),
      `conversation-${conversation.id}.md`,
      'text/markdown',
    )
  }

  const displayTitle = (fallback: string) => {
    const t = conversation?.metadata_title ?? ''
    return t || fallback || 'Conversación'
  }

  // Backend List endpoint returns the title in summaries; the detail endpoint
  // returns `Conversation` which does NOT have `title`. Derive from conv.id
  // for now; best-effort rename lives on the same conv.
  const currentTitle = conversation ? displayTitle(conversation.id) : 'Conversación'

  return (
    <div className="px-6 md:px-8 py-6 md:py-8 max-w-3xl mx-auto">
      {/* Back link + action buttons */}
      <div className="flex items-start justify-between" style={{ marginBottom: 20 }}>
        <Link
          to="/conversations"
          className="inline-flex items-center font-sans"
          style={{ gap: 4, fontSize: 12, color: 'var(--ink-muted)' }}
        >
          ← Conversaciones
        </Link>
        {conversation && (
          <div className="flex flex-wrap items-center" style={{ gap: 8 }}>
            <button type="button" onClick={handleExportJSON} style={actionBtnStyle(false)}>
              JSON
            </button>
            <button type="button" onClick={handleExportMarkdown} style={actionBtnStyle(false)}>
              Markdown
            </button>
            <button type="button" onClick={handleResume} style={actionBtnStyle(true)}>
              Retomar
            </button>
            <button
              type="button"
              onClick={handleDelete}
              style={{ ...actionBtnStyle(false), color: 'var(--red)' }}
            >
              Borrar
            </button>
          </div>
        )}
      </div>

      {/* Preamble */}
      <div className="font-sans" style={{ marginBottom: 24 }}>
        {editingTitle ? (
          <input
            type="text"
            defaultValue={currentTitle}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                renameConv((e.target as HTMLInputElement).value.trim())
              } else if (e.key === 'Escape') {
                setEditingTitle(false)
              }
            }}
            onBlur={(e) => {
              const v = e.target.value.trim()
              if (v && v !== currentTitle) {
                renameConv(v)
              } else {
                setEditingTitle(false)
              }
            }}
            className="font-serif italic"
            style={{
              fontSize: 22,
              lineHeight: 1.3,
              color: 'var(--ink)',
              padding: '4px 8px',
              margin: '-4px -8px',
              background: 'var(--bg-deep)',
              border: '1px solid color-mix(in srgb, var(--accent) 40%, transparent)',
              borderRadius: 4,
              outline: 'none',
              width: '100%',
            }}
            onChange={(e) => setTitleDraft(e.target.value)}
            value={titleDraft || currentTitle}
          />
        ) : (
          <h1
            className="font-serif italic cursor-text"
            style={{ fontSize: 22, lineHeight: 1.3, color: 'var(--ink)' }}
            onClick={() => {
              setTitleDraft(currentTitle)
              setEditingTitle(true)
            }}
            title="Click para renombrar"
          >
            {currentTitle}
          </h1>
        )}
        {conversation && (
          <div
            className="font-sans"
            style={{
              marginTop: 6,
              fontSize: 12,
              color: 'var(--ink-muted)',
              display: 'flex',
              gap: 10,
              alignItems: 'center',
            }}
          >
            <span className="font-mono">{conversation.channel_id}</span>
            <span style={{ color: 'var(--ink-faint)' }}>·</span>
            <span>{messages.length} mensajes cargados</span>
            {hasNextPage && (
              <>
                <span style={{ color: 'var(--ink-faint)' }}>·</span>
                <span className="font-serif italic">más arriba</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Load-more above */}
      {hasNextPage && !loadingMsgs && (
        <div style={{ marginBottom: 16, textAlign: 'center' }}>
          <button
            type="button"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="font-serif italic"
            style={{
              fontSize: 12,
              color: 'var(--ink-soft)',
              background: 'transparent',
              border: '1px dashed var(--line)',
              borderRadius: 4,
              padding: '6px 14px',
              cursor: isFetchingNextPage ? 'wait' : 'pointer',
            }}
          >
            {isFetchingNextPage ? 'Cargando…' : 'Cargar anteriores'}
          </button>
        </div>
      )}

      {/* Loading / errors */}
      {(loadingMeta || loadingMsgs) && (
        <div className="font-serif italic" style={{ fontSize: 13, color: 'var(--ink-muted)' }}>
          Cargando…
        </div>
      )}
      {errorMeta && (
        <div className="font-sans" style={{ fontSize: 13, color: 'var(--red)' }}>
          No pude cargar esta conversación.
        </div>
      )}

      {/* Messages — liminal thread style */}
      {!loadingMeta && !errorMeta && messages.length > 0 && (
        <div className="flex flex-col" style={{ gap: 14 }}>
          {messages.map((m, i) => (
            <ThreadMessage key={i} msg={m} />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loadingMeta && !errorMeta && messages.length === 0 && !loadingMsgs && (
        <p
          className="font-serif italic"
          style={{ fontSize: 13, color: 'var(--ink-muted)', textAlign: 'center', padding: 48 }}
        >
          Sin mensajes en esta conversación.
        </p>
      )}
    </div>
  )
}

function ThreadMessage({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user'
  const isTool = msg.role === 'tool'

  return (
    <div
      className="font-sans"
      style={{
        borderLeft: `2px solid ${isUser ? 'var(--accent)' : 'var(--line-strong)'}`,
        paddingLeft: 14,
        paddingTop: 4,
        paddingBottom: 4,
      }}
    >
      <div
        className="font-mono uppercase"
        style={{ fontSize: 10.5, letterSpacing: 0.7, color: 'var(--ink-muted)', marginBottom: 4 }}
      >
        {isUser ? '> vos' : isTool ? '@ tool' : '$ agente'}
      </div>
      <div
        className={isTool ? 'font-mono' : 'font-sans'}
        style={{
          fontSize: isTool ? 12 : 13.5,
          lineHeight: 1.6,
          color: 'var(--ink)',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {msg.content}
      </div>
      {msg.timestamp && (
        <div
          className="font-mono"
          style={{ fontSize: 10, color: 'var(--ink-faint)', marginTop: 4 }}
        >
          {formatTime(msg.timestamp)}
        </div>
      )}
    </div>
  )
}

function actionBtnStyle(primary: boolean) {
  return {
    fontSize: 11,
    padding: '5px 12px',
    borderRadius: 4,
    fontFamily: 'inherit',
    fontWeight: 500,
    cursor: 'pointer',
    background: primary ? 'var(--accent)' : 'transparent',
    color: primary ? 'var(--bg-elev)' : 'var(--ink-soft)',
    border: primary ? 'none' : '1px solid var(--line)',
  } as const
}
