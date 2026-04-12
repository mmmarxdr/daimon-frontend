import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { useConversation } from '../hooks/useApi'
import { api } from '../api/client'
import { Button } from '../components/ui/Button'
import { ChevronLeft, ChevronDown, ChevronRight, Wrench, Trash2, Download } from 'lucide-react'
import type { Message } from '../api/client'

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
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

function ToolMessage({ message }: { message: Message }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="w-full my-1">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 text-xs text-text-secondary bg-surface border border-border rounded-md px-3 py-1.5 hover:bg-hover-surface transition-colors w-full text-left"
      >
        <Wrench size={12} className="shrink-0 text-text-disabled" />
        <span className="font-mono flex-1 truncate">tool call</span>
        {open ? (
          <ChevronDown size={12} className="shrink-0" />
        ) : (
          <ChevronRight size={12} className="shrink-0" />
        )}
      </button>
      {open && (
        <div className="mt-1 bg-surface border border-border rounded-md p-3 text-xs font-mono text-text-secondary whitespace-pre-wrap break-words overflow-x-auto">
          {message.content}
        </div>
      )}
      <p className="text-xs text-text-disabled mt-1 px-1 font-mono">{relativeTime(message.timestamp)}</p>
    </div>
  )
}

/** Group consecutive messages by role */
function groupMessages(messages: Message[]): Array<{ role: Message['role']; messages: Message[] }> {
  const groups: Array<{ role: Message['role']; messages: Message[] }> = []
  for (const msg of messages) {
    const last = groups[groups.length - 1]
    if (last && last.role === msg.role) {
      last.messages.push(msg)
    } else {
      groups.push({ role: msg.role, messages: [msg] })
    }
  }
  return groups
}

function SkeletonRow() {
  return (
    <div className="border-l-2 border-border py-2 pl-4 mb-3">
      <div className="h-4 w-3/4 animate-pulse bg-hover-surface rounded mb-2" />
      <div className="h-3 w-16 animate-pulse bg-hover-surface rounded" />
    </div>
  )
}

export function ConversationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: conversation, isLoading, isError } = useConversation(id ?? '')

  const groups = conversation ? groupMessages(conversation.messages) : []

  const { mutate: deleteConv } = useMutation({
    mutationFn: () => api.deleteConversation(id ?? ''),
    onSuccess: () => navigate('/conversations'),
  })

  const handleDelete = () => {
    if (window.confirm('Delete this conversation? This cannot be undone.')) {
      deleteConv()
    }
  }

  const handleExportJSON = () => {
    if (!conversation) return
    downloadFile(
      JSON.stringify(conversation, null, 2),
      `conversation-${conversation.id}.json`,
      'application/json'
    )
  }

  const handleExportMarkdown = () => {
    if (!conversation) return
    const lines: string[] = [
      `# Conversation ${conversation.id}`,
      `**Channel:** ${conversation.channel_id}`,
      `**Created:** ${new Date(conversation.created_at).toLocaleString()}`,
      '',
      '---',
      '',
    ]
    for (const msg of conversation.messages) {
      const role = msg.role.charAt(0).toUpperCase() + msg.role.slice(1)
      const time = new Date(msg.timestamp).toLocaleString()
      lines.push(`### ${role} — ${time}`)
      lines.push('')
      lines.push(msg.content)
      lines.push('')
    }
    downloadFile(
      lines.join('\n'),
      `conversation-${conversation.id}.md`,
      'text/markdown'
    )
  }

  return (
    <div className="px-6 md:px-8 py-6 md:py-8 max-w-3xl mx-auto">
      {/* Back link + action buttons */}
      <div className="flex items-start justify-between mb-6">
        <Link
          to="/conversations"
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <ChevronLeft size={16} />
          Conversations
        </Link>
        {conversation && (
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" size="sm" onClick={handleExportJSON}>
              <Download size={14} />
              JSON
            </Button>
            <Button variant="secondary" size="sm" onClick={handleExportMarkdown}>
              <Download size={14} />
              Markdown
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              <Trash2 size={14} />
              Delete
            </Button>
          </div>
        )}
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-lg font-semibold text-text-primary">Conversation</h1>
        {conversation && (
          <p className="text-sm text-text-secondary mt-1">
            <span className="font-mono">{conversation.channel_id}</span> &mdash; {conversation.messages.length} messages
          </p>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-1">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      )}

      {/* Error */}
      {isError && (
        <p className="text-sm text-error">Failed to load conversation.</p>
      )}

      {/* Messages */}
      {!isLoading && !isError && conversation && (
        <div className="space-y-4">
          {groups.map((group, gi) => (
            <div key={gi}>
              {/* Role label */}
              <p className="text-xs font-medium text-text-disabled mb-1 font-mono uppercase tracking-wide">
                {group.role === 'user' ? '> you' : group.role === 'assistant' ? '$ agent' : '@ tool'}
              </p>

              <div className="space-y-1">
                {group.messages.map((msg, mi) => {
                  if (msg.role === 'tool') {
                    return <ToolMessage key={mi} message={msg} />
                  }

                  const isUser = msg.role === 'user'

                  return (
                    <div
                      key={mi}
                      className={`border-l-2 pl-4 py-2 ${
                        isUser ? 'border-l-accent' : 'border-l-border-strong'
                      }`}
                    >
                      <p className={`text-sm leading-relaxed whitespace-pre-wrap break-words text-text-primary ${
                        !isUser ? 'font-mono' : ''
                      }`}>
                        {msg.content}
                      </p>
                      <p className="text-xs text-text-disabled font-mono mt-1">
                        {relativeTime(msg.timestamp)}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty conversation */}
      {!isLoading && !isError && conversation && conversation.messages.length === 0 && (
        <p className="text-sm text-text-secondary text-center py-12">
          No messages in this conversation.
        </p>
      )}
    </div>
  )
}
