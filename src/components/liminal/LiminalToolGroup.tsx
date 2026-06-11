import { useState } from 'react'
import type { ToolCall } from '../../types/chat'
import { LiminalTool } from './LiminalTool'

export interface ToolGroupItem {
  tool: ToolCall
  onOpen?: () => void
}

interface LiminalToolGroupProps {
  items: ToolGroupItem[]
}

/**
 * Collapses a run of consecutive tool calls into a single "⚙ N tools" header
 * to keep long tool-heavy turns readable. Collapsed by default; expanding
 * reveals the individual tool chips (each still independently expandable).
 * A live "running" pill and an error count surface state without expanding.
 */
export function LiminalToolGroup({ items }: LiminalToolGroupProps) {
  const [expanded, setExpanded] = useState(false)
  const count = items.length
  const errors = items.filter((it) => it.tool.done && it.tool.isError).length
  const running = items.some((it) => !it.tool.done)

  return (
    <div className="my-1.5">
      <button
        type="button"
        data-testid="tool-group-header"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        className="flex items-center gap-2 w-full text-left font-mono"
        style={{ padding: '3px 0', fontSize: 12, cursor: 'pointer' }}
      >
        <span style={{ fontSize: 12, opacity: 0.75 }}>⚙</span>
        <span className="text-ink font-medium">{count} tools</span>
        {running && (
          <span
            className="flex items-center gap-1.5"
            style={{ fontSize: 10.5, color: 'var(--amber)' }}
          >
            <span
              className="liminal-breathe"
              style={{ width: 6, height: 6, borderRadius: 99, background: 'var(--amber)' }}
            />
            running
          </span>
        )}
        {errors > 0 && (
          <span style={{ fontSize: 10.5, color: 'var(--red)' }}>
            {errors} failed
          </span>
        )}
        <span
          style={{ fontSize: 10, color: 'var(--ink-muted)', marginLeft: 'auto', width: 10 }}
        >
          {expanded ? '▾' : '▸'}
        </span>
      </button>
      {expanded && (
        <div data-testid="tool-group-body" style={{ paddingLeft: 6 }}>
          {items.map((it, i) => (
            <LiminalTool key={it.tool.tool_call_id || i} tool={it.tool} onOpen={it.onOpen} />
          ))}
        </div>
      )}
    </div>
  )
}
