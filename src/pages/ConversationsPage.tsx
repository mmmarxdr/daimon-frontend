import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useConversations } from '../hooks/useApi'
import { api, type ConversationSummary } from '../api/client'
import {
  bucketForTimestamp,
  TIME_BUCKET_ORDER,
  type TimeBucket,
} from '../utils/timeBuckets'
import { ConversationCard } from '../components/liminal/conversations/ConversationCard'
import { TimeClusterHeader } from '../components/liminal/conversations/TimeClusterHeader'
import { ConversationsPreamble } from '../components/liminal/conversations/ConversationsPreamble'

const PAGE_SIZE = 50

function matchesSearch(conv: ConversationSummary, q: string): boolean {
  if (!q) return true
  const needle = q.toLowerCase()
  return (
    conv.title.toLowerCase().includes(needle) ||
    conv.last_message.toLowerCase().includes(needle) ||
    conv.channel_id.toLowerCase().includes(needle)
  )
}

export function ConversationsPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)

  const { data, isLoading, isError } = useConversations({
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  })

  const { mutate: deleteConv } = useMutation({
    mutationFn: (id: string) => api.deleteConversation(id),
    onMutate: async (id: string) => {
      // Optimistic update so the card disappears immediately.
      await qc.cancelQueries({ queryKey: ['conversations'] })
      const prev = qc.getQueryData<{ items: ConversationSummary[]; total: number }>([
        'conversations',
        { limit: PAGE_SIZE, offset: page * PAGE_SIZE },
      ])
      qc.setQueryData(
        ['conversations', { limit: PAGE_SIZE, offset: page * PAGE_SIZE }],
        (old: { items: ConversationSummary[]; total: number } | undefined) =>
          old
            ? { ...old, items: old.items.filter((c) => c.id !== id), total: Math.max(0, old.total - 1) }
            : old,
      )
      return { prev, id }
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) {
        qc.setQueryData(
          ['conversations', { limit: PAGE_SIZE, offset: page * PAGE_SIZE }],
          ctx.prev,
        )
      }
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['conversations'] }),
  })

  const items = data?.items ?? []
  const filtered = useMemo(
    () => items.filter((c) => matchesSearch(c, search)),
    [items, search],
  )

  // Group into time buckets, anchored to the render-time `now` (stable
  // within a single render pass).
  const grouped = useMemo(() => {
    const now = new Date()
    const byBucket = new Map<TimeBucket, ConversationSummary[]>()
    for (const c of filtered) {
      const b = bucketForTimestamp(new Date(c.updated_at), now)
      const arr = byBucket.get(b) ?? []
      arr.push(c)
      byBucket.set(b, arr)
    }
    return byBucket
  }, [filtered])

  const handleOpen = (id: string) => navigate(`/chat?conversation_id=${encodeURIComponent(id)}`)
  const handleDelete = (id: string) => {
    if (window.confirm('Delete this conversation? You can restore it from the database within the next 30 days.')) {
      deleteConv(id)
    }
  }

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0

  return (
    <div className="px-6 md:px-8 py-6 md:py-8 max-w-[900px] mx-auto">
      <ConversationsPreamble count={items.length} />

      {/* Search */}
      {items.length > 0 && (
        <div className="mb-6" style={{ maxWidth: 360 }}>
          <input
            type="text"
            placeholder="Search by title, channel, or message…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="font-sans w-full"
            style={{
              fontSize: 13,
              padding: '8px 12px',
              background: 'var(--bg-elev)',
              border: '1px solid var(--line)',
              borderRadius: 6,
              color: 'var(--ink)',
              outline: 'none',
            }}
          />
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="font-serif italic" style={{ fontSize: 13, color: 'var(--ink-muted)' }}>
          loading…
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="font-sans" style={{ fontSize: 13, color: 'var(--red)' }}>
          Failed to load conversations.
        </div>
      )}

      {/* Empty — first run, no conversations yet */}
      {!isLoading && !isError && items.length === 0 && (
        <div
          className="flex flex-col items-center"
          style={{
            gap: 18,
            padding: '40px 20px 60px',
            textAlign: 'center',
          }}
        >
          <p
            className="font-serif italic"
            style={{
              fontSize: 14.5,
              color: 'var(--ink-soft)',
              maxWidth: 420,
              lineHeight: 1.55,
              margin: 0,
            }}
          >
            every chat with the agent lives here. start one and it will show up automatically.
          </p>
          <button
            type="button"
            onClick={() => navigate('/chat')}
            className="font-mono"
            style={{
              fontSize: 11,
              letterSpacing: 0.8,
              textTransform: 'uppercase',
              padding: '10px 22px',
              borderRadius: 4,
              background: 'var(--accent)',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              transition: 'opacity 120ms ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            start chatting →
          </button>
        </div>
      )}

      {/* Grouped cards */}
      {!isLoading && !isError && filtered.length > 0 && (
        <div className="flex flex-col" style={{ gap: 28 }}>
          {TIME_BUCKET_ORDER.map((bucket) => {
            const convs = grouped.get(bucket) ?? []
            if (convs.length === 0) return null
            return (
              <section key={bucket}>
                <TimeClusterHeader bucket={bucket} count={convs.length} />
                <div className="flex flex-col" style={{ gap: 8 }}>
                  {convs.map((c) => (
                    <ConversationCard
                      key={c.id}
                      conv={c}
                      onOpen={handleOpen}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}

      {/* Client-side filter: nothing matches */}
      {!isLoading && !isError && items.length > 0 && filtered.length === 0 && (
        <div
          className="font-serif italic"
          style={{ fontSize: 13, color: 'var(--ink-muted)', marginTop: 12 }}
        >
          Nothing matches "{search}".
        </div>
      )}

      {/* Pagination */}
      {!isLoading && !isError && totalPages > 1 && (
        <div
          className="mt-8 flex items-center justify-between font-mono"
          style={{ fontSize: 11, color: 'var(--ink-muted)' }}
        >
          <span>
            Page {page + 1} of {totalPages} · {data?.total} total
          </span>
          <div className="flex" style={{ gap: 8 }}>
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              style={paginationBtnStyle(page === 0)}
            >
              ← Previous
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              style={paginationBtnStyle(page >= totalPages - 1)}
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function paginationBtnStyle(disabled: boolean) {
  return {
    fontSize: 11,
    padding: '4px 10px',
    borderRadius: 4,
    fontFamily: 'inherit',
    cursor: disabled ? 'not-allowed' : 'pointer',
    background: 'transparent',
    color: disabled ? 'var(--ink-faint)' : 'var(--ink-soft)',
    border: '1px solid var(--line)',
    opacity: disabled ? 0.5 : 1,
  } as const
}
