import { useCallback, useEffect, useRef, useState } from 'react'
import { Trash2, ChevronDown } from 'lucide-react'
import { useWebSocket, type WsStatus } from '../hooks/useWebSocket'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { cn } from '../lib/utils'

// ── Types ────────────────────────────────────────────────────────────────────

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'

interface LogEntry {
  id: string
  time: string
  level: LogLevel
  msg: string
  [key: string]: unknown
}

// ── Constants ────────────────────────────────────────────────────────────────

const LEVELS: LogLevel[] = ['DEBUG', 'INFO', 'WARN', 'ERROR']
const MAX_ENTRIES = 500

const levelColor: Record<LogLevel, string> = {
  DEBUG: 'text-text-disabled',
  INFO:  'text-accent',
  WARN:  'text-warning',
  ERROR: 'text-error',
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  try {
    const d = new Date(iso)
    const hms = d.toLocaleTimeString('en-US', {
      hour12: false,
      hour:   '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
    return hms + '.' + String(d.getMilliseconds()).padStart(3, '0')
  } catch {
    return iso
  }
}

function extraFields(entry: LogEntry): string {
  return Object.entries(entry)
    .filter(([k]) => !['id', 'time', 'level', 'msg'].includes(k))
    .map(([k, v]) => `${k}=${String(v)}`)
    .join('  ')
}

// ── Connection status badge ──────────────────────────────────────────────────

function ConnectionStatus({ status }: { status: WsStatus }) {
  const map: Record<WsStatus, { label: string; variant: 'success' | 'warning' | 'default' | 'error' }> = {
    connected:    { label: 'Connected',    variant: 'success'  },
    connecting:   { label: 'Connecting…',  variant: 'warning'  },
    disconnected: { label: 'Disconnected', variant: 'default'  },
    error:        { label: 'Error',        variant: 'error'    },
  }
  const s = map[status]
  return <Badge variant={s.variant}>{s.label}</Badge>
}

// ── Main page ────────────────────────────────────────────────────────────────

export function LogsPage() {
  const [entries, setEntries] = useState<LogEntry[]>([])
  const [activeLevels, setActiveLevels] = useState<Set<LogLevel>>(new Set(LEVELS))
  const [autoScroll, setAutoScroll] = useState(true)
  const [newLineCount, setNewLineCount] = useState(0)

  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  // ── WebSocket message handler
  const handleMessage = useCallback((data: unknown) => {
    const raw = data as {
      time?: string
      level?: string
      msg?: string
      [key: string]: unknown
    }
    if (!raw.time || !raw.level || !raw.msg) return

    const { time, level, msg, ...rest } = raw

    const entry: LogEntry = {
      id:   crypto.randomUUID(),
      time: time as string,
      level: (level as string).toUpperCase() as LogLevel,
      msg:  msg as string,
      ...rest,
    }

    setEntries(prev => {
      const next = [...prev, entry]
      return next.length > MAX_ENTRIES ? next.slice(next.length - MAX_ENTRIES) : next
    })
  }, [])

  const { status } = useWebSocket({ path: '/ws/logs', onMessage: handleMessage })

  // ── Auto-scroll + new-line tracking
  useEffect(() => {
    if (autoScroll) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      setNewLineCount(0)
    } else {
      setNewLineCount(n => n + 1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries]) // intentionally omit autoScroll — we only want this to fire on new entries

  const handleScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40
    if (atBottom) {
      setAutoScroll(true)
      setNewLineCount(0)
    }
  }

  const resumeScroll = () => {
    setAutoScroll(true)
    setNewLineCount(0)
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // ── Level toggle
  const toggleLevel = (level: LogLevel) => {
    setActiveLevels(prev => {
      const next = new Set(prev)
      if (next.has(level)) {
        next.delete(level)
      } else {
        next.add(level)
      }
      // Keep at least one level active
      return next.size === 0 ? prev : next
    })
  }

  // ── Derived data
  const filteredEntries = entries.filter(e => activeLevels.has(e.level))

  return (
    <div className="relative flex flex-col h-screen">
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-background shrink-0">
        <div>
          <h1 className="text-[15px] font-semibold text-text-primary">Logs</h1>
          <p className="text-xs text-text-secondary">Live agent log stream.</p>
        </div>
        <ConnectionStatus status={status} />
      </div>

      {/* ── Filter bar ── */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-background shrink-0 flex-wrap">
        {/* Level toggles */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          {LEVELS.map(level => (
            <button
              key={level}
              onClick={() => toggleLevel(level)}
              className={cn(
                'text-xs px-3 py-1 rounded-md transition-colors border font-mono',
                activeLevels.has(level)
                  ? cn('bg-hover-surface border-border-strong font-medium', levelColor[level])
                  : 'bg-transparent text-text-disabled border-border hover:text-text-secondary'
              )}
            >
              {level}
            </button>
          ))}
          <span className="text-xs text-text-disabled font-mono ml-2">
            {filteredEntries.length} {filteredEntries.length === 1 ? 'line' : 'lines'}
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => (autoScroll ? setAutoScroll(false) : resumeScroll())}
          >
            {autoScroll ? 'Pause' : 'Resume'}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setEntries([])}
          >
            <Trash2 size={13} />
            Clear
          </Button>
        </div>
      </div>

      {/* ── Log output ── */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto font-mono text-xs bg-background leading-relaxed"
      >
        {filteredEntries.length === 0 ? (
          <div className="flex items-center justify-center h-full text-text-disabled font-mono text-xs">
            Waiting for log stream…
          </div>
        ) : (
          filteredEntries.map((entry) => {
            const extra = extraFields(entry)
            return (
              <div
                key={entry.id}
                className="flex items-baseline gap-3 px-4 py-1 hover:bg-hover-surface transition-colors"
              >
                <span className="text-text-disabled w-[140px] shrink-0 tabular-nums">
                  {formatTime(entry.time)}
                </span>
                <span className={cn('w-[50px] shrink-0 font-medium uppercase', levelColor[entry.level])}>
                  {entry.level}
                </span>
                <span className="flex-1 text-text-primary break-all">{entry.msg}</span>
                {extra && (
                  <span className="text-text-secondary shrink-0 ml-2">{extra}</span>
                )}
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── New lines pill ── */}
      {!autoScroll && newLineCount > 0 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
          <button
            onClick={resumeScroll}
            className="flex items-center gap-1.5 bg-accent text-white text-xs font-medium px-3 py-1.5 rounded-md hover:bg-accent-hover transition-colors"
          >
            <ChevronDown size={12} />
            {newLineCount} new {newLineCount === 1 ? 'line' : 'lines'}
          </button>
        </div>
      )}
    </div>
  )
}
