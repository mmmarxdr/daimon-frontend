import { type CSSProperties } from 'react'
import { useStatus, useMetrics, useMemory, useConfig } from '../hooks/useApi'
import { LiminalGlyph } from '../components/liminal/LiminalGlyph'
import { formatUSD, formatTokens } from '../lib/format'

// ─── Formatting helpers ─────────────────────────────────────────────────────

function fmtUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h === 0) return `${m}m`
  return `${h}h ${m}m`
}

// ─── Card primitive ─────────────────────────────────────────────────────────

interface StatCardProps {
  label: string
  value: string | number
  hint?: string
  accent?: boolean
  loading?: boolean
  error?: boolean
  monoValue?: boolean
}

const cardStyle = (accent: boolean): CSSProperties => ({
  background: 'var(--bg-elev)',
  border: `1px solid var(--line)`,
  borderLeft: accent ? '2px solid var(--accent)' : '1px solid var(--line)',
  borderRadius: 6,
  padding: '16px 18px',
  minHeight: 88,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
})

const labelStyle: CSSProperties = {
  fontSize: 10.5,
  letterSpacing: 1,
  color: 'var(--ink-muted)',
  textTransform: 'uppercase',
}

function StatCard({
  label,
  value,
  hint,
  accent = false,
  loading = false,
  error = false,
  monoValue = false,
}: StatCardProps) {
  return (
    <div style={cardStyle(accent)}>
      <div className="font-mono" style={labelStyle}>
        {label}
      </div>
      <div style={{ marginTop: 10 }}>
        {loading ? (
          <div
            style={{
              height: 24,
              width: 72,
              background: 'var(--bg-deep)',
              borderRadius: 3,
              animation: 'pulse 1.8s ease-in-out infinite',
            }}
          />
        ) : error ? (
          <div className="font-serif italic" style={{ fontSize: 13, color: 'var(--red)' }}>
            couldn't read this.
          </div>
        ) : (
          <>
            <div
              className={monoValue ? 'font-mono' : 'font-sans'}
              style={{
                fontSize: 22,
                fontWeight: 500,
                color: 'var(--ink)',
                letterSpacing: monoValue ? 0 : -0.3,
                lineHeight: 1.1,
              }}
            >
              {value}
            </div>
            {hint && (
              <div
                className="font-serif italic"
                style={{ fontSize: 11.5, color: 'var(--ink-muted)', marginTop: 4 }}
              >
                {hint}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ─── Status card (special — has a breathing dot) ────────────────────────────

const STATUS_COPY: Record<string, { label: string; tone: 'teal' | 'muted' | 'red' }> = {
  running: { label: 'listening', tone: 'teal' },
  idle:    { label: 'quiet',     tone: 'muted' },
  error:   { label: 'troubled',  tone: 'red' },
}

function StatusCard() {
  const { data, isLoading, isError } = useStatus()

  if (isLoading) {
    return (
      <div style={cardStyle(true)}>
        <div className="font-mono" style={labelStyle}>
          STATUS
        </div>
        <div
          style={{
            height: 24,
            width: 96,
            background: 'var(--bg-deep)',
            borderRadius: 3,
            animation: 'pulse 1.8s ease-in-out infinite',
            marginTop: 10,
          }}
        />
      </div>
    )
  }

  if (isError) {
    return (
      <div style={cardStyle(true)}>
        <div className="font-mono" style={labelStyle}>
          STATUS
        </div>
        <div className="font-serif italic" style={{ fontSize: 13, color: 'var(--red)', marginTop: 10 }}>
          can't reach the agent.
        </div>
      </div>
    )
  }

  const s = STATUS_COPY[data?.status ?? 'idle'] ?? STATUS_COPY.idle
  const color =
    s.tone === 'teal' ? 'var(--accent)' : s.tone === 'red' ? 'var(--red)' : 'var(--ink-muted)'

  return (
    <div style={cardStyle(true)}>
      <div className="font-mono" style={labelStyle}>
        STATUS
      </div>
      <div style={{ marginTop: 10 }}>
        <div className="flex items-center" style={{ gap: 8 }}>
          <span
            className={s.tone === 'teal' ? 'liminal-breathe' : undefined}
            style={{
              width: 7,
              height: 7,
              borderRadius: 99,
              background: color,
              boxShadow: s.tone === 'teal' ? `0 0 6px ${color}` : 'none',
            }}
          />
          <span
            className="font-serif italic"
            style={{ fontSize: 16, color: 'var(--ink)', letterSpacing: -0.2 }}
          >
            {s.label}
          </span>
        </div>
        {data?.uptime_seconds != null && (
          <div
            className="font-mono"
            style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 4 }}
          >
            up {fmtUptime(data.uptime_seconds)}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Budget bar ─────────────────────────────────────────────────────────────

function QuotaBar({ spent, budget }: { spent: number; budget: number }) {
  const pct = Math.min((spent / budget) * 100, 100)
  const isWarning = pct >= 80
  const isOver = pct >= 100
  const barColor = isOver ? 'var(--red)' : isWarning ? 'var(--amber)' : 'var(--accent)'

  return (
    <div
      style={{
        marginTop: 32,
        padding: '18px 20px',
        background: 'var(--bg-elev)',
        border: '1px solid var(--line)',
        borderRadius: 6,
      }}
    >
      <div className="flex items-baseline justify-between" style={{ marginBottom: 10 }}>
        <span className="font-mono" style={labelStyle}>
          MONTHLY BUDGET
        </span>
        <span
          className="font-mono"
          style={{
            fontSize: 13,
            color: isOver ? 'var(--red)' : isWarning ? 'var(--amber)' : 'var(--ink)',
            fontWeight: 500,
          }}
        >
          ${spent.toFixed(2)}
          <span style={{ color: 'var(--ink-muted)', fontWeight: 400 }}> / ${budget.toFixed(2)}</span>
          <span style={{ color: 'var(--ink-faint)', marginLeft: 6, fontSize: 11 }}>
            {pct.toFixed(1)}%
          </span>
        </span>
      </div>
      <div
        style={{
          width: '100%',
          height: 4,
          background: 'var(--bg-deep)',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: barColor,
            transition: 'width 0.5s ease, background 0.2s',
          }}
        />
      </div>
      {isWarning && !isOver && (
        <p
          className="font-serif italic"
          style={{ fontSize: 12, color: 'var(--amber)', marginTop: 10 }}
        >
          we're getting close to the edge this month.
        </p>
      )}
      {isOver && (
        <p
          className="font-serif italic"
          style={{ fontSize: 12, color: 'var(--red)', marginTop: 10 }}
        >
          the budget for this month is spent.
        </p>
      )}
    </div>
  )
}

// ─── Config subset ─────────────────────────────────────────────────────────

interface ConfigOverview {
  provider?: { type?: string; model?: string }
  limits?: { monthly_budget_usd?: number }
}

// ─── Page ──────────────────────────────────────────────────────────────────

export function OverviewPage() {
  const { data: metrics, isLoading: metricsLoading, isError: metricsError } = useMetrics()
  const { data: memory } = useMemory('')
  const { data: config } = useConfig()
  const cfg = config as ConfigOverview | undefined
  const budget = cfg?.limits?.monthly_budget_usd ?? 0

  const totalTokensToday = metrics
    ? metrics.today.input_tokens + metrics.today.output_tokens
    : 0

  return (
    <div
      style={{
        padding: '28px 32px 40px',
        maxWidth: 1100,
        margin: '0 auto',
      }}
    >
      {/* Preamble — matches MemoryPage / ConversationsPage pattern */}
      <div style={{ marginBottom: 32 }}>
        <div className="flex items-baseline" style={{ gap: 14, marginBottom: 6 }}>
          <LiminalGlyph size={20} animate />
          <h1
            className="font-serif"
            style={{
              margin: 0,
              fontSize: 28,
              fontWeight: 500,
              color: 'var(--ink)',
              letterSpacing: -0.6,
            }}
          >
            <span className="italic" style={{ color: 'var(--accent)', fontWeight: 400 }}>
              how I've been
            </span>
            <span style={{ color: 'var(--ink-muted)', fontWeight: 400 }}>&nbsp;·&nbsp;</span>
            <span>today</span>
          </h1>
        </div>
        <p
          className="font-serif italic"
          style={{
            fontSize: 14.5,
            color: 'var(--ink-soft)',
            maxWidth: 640,
            lineHeight: 1.55,
            marginLeft: 34,
            marginTop: 0,
          }}
        >
          a quiet look at the shape of today — what was spent, what was remembered,
          what was said.
        </p>
      </div>

      {/* Stat grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 10,
        }}
      >
        <StatusCard />

        <StatCard
          label="COST TODAY"
          value={metrics ? formatUSD(metrics.today.cost_usd) : '—'}
          monoValue
          loading={metricsLoading}
          error={metricsError}
        />
        <StatCard
          label="COST THIS MONTH"
          value={metrics ? formatUSD(metrics.month.cost_usd) : '—'}
          monoValue
          loading={metricsLoading}
          error={metricsError}
        />
        <StatCard
          label="TOKENS TODAY"
          value={metrics ? formatTokens(totalTokensToday) : '—'}
          hint={
            metrics
              ? `${formatTokens(metrics.today.input_tokens)} in · ${formatTokens(metrics.today.output_tokens)} out`
              : undefined
          }
          monoValue
          loading={metricsLoading}
          error={metricsError}
        />
        <StatCard
          label="CONVERSATIONS"
          value={metrics?.today.conversations ?? '—'}
          hint="today"
          monoValue
          loading={metricsLoading}
          error={metricsError}
        />
        <StatCard
          label="MESSAGES"
          value={metrics?.today.messages ?? '—'}
          hint="today"
          monoValue
          loading={metricsLoading}
          error={metricsError}
        />
        <StatCard
          label="MEMORY"
          value={memory?.items.length ?? '—'}
          hint="things I remember"
          monoValue
        />
        <StatCard
          label="MODEL"
          value={cfg?.provider?.model ?? '—'}
          hint={cfg?.provider?.type ?? 'configure in Settings'}
        />
      </div>

      {budget > 0 && metrics && <QuotaBar spent={metrics.month.cost_usd} budget={budget} />}
    </div>
  )
}
