import { type CSSProperties } from 'react'
import { useMetricsHistory, useMetrics } from '../hooks/useApi'
import { LiminalGlyph } from '../components/liminal/LiminalGlyph'
import { LiminalAreaChart } from '../components/liminal/charts/LiminalAreaChart'
import { LiminalBarChart } from '../components/liminal/charts/LiminalBarChart'
import { formatUSD, formatTokens } from '../lib/format'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ─── Card primitives (shared with OverviewPage style) ────────────────────────

const cardBaseStyle: CSSProperties = {
  background: 'var(--bg-elev)',
  border: '1px solid var(--line)',
  borderRadius: 6,
  padding: '18px 20px',
}

const labelStyle: CSSProperties = {
  fontSize: 10.5,
  letterSpacing: 1,
  color: 'var(--ink-muted)',
  textTransform: 'uppercase',
}

function SummaryCard({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint?: string
}) {
  return (
    <div style={cardBaseStyle}>
      <div className="font-mono" style={labelStyle}>
        {label}
      </div>
      <div
        className="font-mono"
        style={{
          fontSize: 22,
          fontWeight: 500,
          color: 'var(--ink)',
          lineHeight: 1.1,
          marginTop: 10,
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
    </div>
  )
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <div style={{ ...cardBaseStyle, padding: '20px 22px 22px' }}>
      <div style={{ marginBottom: 14 }}>
        <div
          className="font-serif"
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: 'var(--ink)',
            letterSpacing: -0.2,
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div
            className="font-serif italic"
            style={{ fontSize: 11.5, color: 'var(--ink-muted)', marginTop: 2 }}
          >
            {subtitle}
          </div>
        )}
      </div>
      {children}
    </div>
  )
}

function EmptyCard({ title, hint }: { title: string; hint: string }) {
  return (
    <div
      style={{
        ...cardBaseStyle,
        padding: '40px 24px',
        textAlign: 'center',
      }}
    >
      <p
        className="font-serif italic"
        style={{ fontSize: 14, color: 'var(--ink-muted)', margin: 0 }}
      >
        {title}
      </p>
      <p
        className="font-mono"
        style={{
          fontSize: 11,
          color: 'var(--ink-faint)',
          marginTop: 6,
          letterSpacing: 0.5,
        }}
      >
        {hint}
      </p>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function MetricsPage() {
  const { data: history30, isLoading: histLoading } = useMetricsHistory(30)
  const { data: metrics } = useMetrics()

  const history = history30?.history ?? []

  const totalTokens = history.reduce(
    (s, d) => s + d.input_tokens + d.output_tokens,
    0,
  )
  const totalCost = history.reduce((s, d) => s + d.cost_usd, 0)
  // Average over days that actually had activity, not the full 30-day window
  // (which would dilute the signal if the agent has only been used recently).
  const activeDays = history.filter((d) => d.input_tokens + d.output_tokens > 0).length
  const avgCost = activeDays > 0 ? totalCost / activeDays : 0

  const labels = history.map((d) => fmtDate(d.date))
  const inputSeries = history.map((d) => d.input_tokens)
  const outputSeries = history.map((d) => d.output_tokens)
  const costSeries = history.map((d) => d.cost_usd)

  return (
    <div
      style={{
        padding: '28px 32px 40px',
        maxWidth: 1100,
        margin: '0 auto',
      }}
    >
      {/* Preamble */}
      <div style={{ marginBottom: 28 }}>
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
              what I've been costing
            </span>
            <span style={{ color: 'var(--ink-muted)', fontWeight: 400 }}>&nbsp;·&nbsp;</span>
            <span>last 30 days</span>
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
          tokens flow in, tokens flow out, dollars get spent — here's the shape
          of it over time.
        </p>
      </div>

      {/* Summary cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 10,
          marginBottom: 18,
        }}
      >
        <SummaryCard
          label="TOTAL TOKENS · 30D"
          value={formatTokens(totalTokens)}
          hint={`today: ${formatTokens(
            (metrics?.today.input_tokens ?? 0) + (metrics?.today.output_tokens ?? 0),
          )}`}
        />
        <SummaryCard
          label="TOTAL COST · 30D"
          value={formatUSD(totalCost)}
          hint={`today: ${formatUSD(metrics?.today.cost_usd ?? 0)}`}
        />
        <SummaryCard
          label="AVG COST / ACTIVE DAY"
          value={formatUSD(avgCost)}
          hint={`${activeDays} day${activeDays === 1 ? '' : 's'} of activity`}
        />
      </div>

      {/* Loading skeleton */}
      {histLoading && (
        <div
          style={{
            ...cardBaseStyle,
            height: 220,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <p className="font-serif italic" style={{ fontSize: 13, color: 'var(--ink-muted)' }}>
            gathering the days…
          </p>
        </div>
      )}

      {/* Empty state */}
      {!histLoading && totalTokens === 0 && (
        <EmptyCard
          title="no history yet."
          hint="data accumulates as we exchange messages."
        />
      )}

      {/* Charts */}
      {!histLoading && totalTokens > 0 && (
        <div className="flex flex-col" style={{ gap: 14 }}>
          <ChartCard title="Token usage" subtitle="input + output, stacked, day by day">
            <LiminalAreaChart
              labels={labels}
              series={[
                {
                  name: 'output',
                  values: outputSeries,
                  color: 'var(--ink-soft)',
                  fillOpacity: 0.10,
                },
                {
                  name: 'input',
                  values: inputSeries,
                  color: 'var(--accent)',
                  fillOpacity: 0.16,
                },
              ]}
              height={220}
              formatValue={formatTokens}
            />
          </ChartCard>

          <ChartCard title="Daily cost" subtitle="USD spent per day">
            <LiminalBarChart
              labels={labels}
              values={costSeries}
              seriesName="cost"
              color="var(--accent)"
              height={200}
              formatValue={(n) => formatUSD(n)}
            />
          </ChartCard>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 14,
            }}
          >
            <EmptyCard
              title="model breakdown"
              hint="per-model usage — coming soon"
            />
            <EmptyCard
              title="conversations"
              hint="daily conversation counts — coming soon"
            />
          </div>
        </div>
      )}
    </div>
  )
}
