import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LiminalToolGroup, type ToolGroupItem } from '../LiminalToolGroup'
import { LiminalAssistantMsg, type AssistantBlock } from '../LiminalAssistantMsg'
import type { ToolCall } from '../../../types/chat'

const mkTool = (over: Partial<ToolCall> = {}): ToolCall => ({
  name: 'batch_exec',
  input: '{"command":"ls"}',
  output: 'ok',
  tool_call_id: Math.random().toString(36).slice(2),
  done: true,
  ...over,
})

const items = (n: number, over: Partial<ToolCall> = {}): ToolGroupItem[] =>
  Array.from({ length: n }, (_, i) => ({ tool: mkTool({ tool_call_id: `t${i}`, ...over }) }))

describe('LiminalToolGroup', () => {
  it('collapses to a "N tools" header and hides the tool list by default', () => {
    render(<LiminalToolGroup items={items(6)} />)
    expect(screen.getByTestId('tool-group-header').textContent).toContain('6 tools')
    expect(screen.queryByTestId('tool-group-body')).toBeNull()
  })

  it('reveals the individual tool chips when the header is clicked', () => {
    render(<LiminalToolGroup items={items(6)} />)
    fireEvent.click(screen.getByTestId('tool-group-header'))
    const body = screen.getByTestId('tool-group-body')
    // All 6 batch_exec chips render inside the expanded body.
    expect(body.querySelectorAll('button').length).toBeGreaterThanOrEqual(6)
  })

  it('surfaces a running indicator while any tool is unfinished', () => {
    const mix: ToolGroupItem[] = [...items(5), { tool: mkTool({ done: false, output: undefined }) }]
    render(<LiminalToolGroup items={mix} />)
    expect(screen.getByTestId('tool-group-header').textContent).toMatch(/running/i)
  })

  it('surfaces an error count when tools failed', () => {
    const mix: ToolGroupItem[] = [...items(5), { tool: mkTool({ isError: true, output: 'boom' }) }]
    render(<LiminalToolGroup items={mix} />)
    expect(screen.getByTestId('tool-group-header').textContent).toMatch(/1 failed/)
  })
})

describe('LiminalAssistantMsg — tool-run grouping', () => {
  const toolBlock = (name: string): AssistantBlock => ({ kind: 'tool', tool: mkTool({ name }) })

  it('renders a short run (< threshold) as individual chips, no group header', () => {
    const blocks: AssistantBlock[] = [toolBlock('alpha_tool'), toolBlock('beta_tool'), toolBlock('gamma_tool')]
    render(<LiminalAssistantMsg blocks={blocks} />)
    expect(screen.queryByTestId('tool-group-header')).toBeNull()
    expect(screen.getByText('alpha_tool')).toBeInTheDocument()
    expect(screen.getByText('gamma_tool')).toBeInTheDocument()
  })

  it('collapses a long run (>= threshold) into a group, hiding chips until expanded', () => {
    const blocks: AssistantBlock[] = Array.from({ length: 6 }, (_, i) => toolBlock(`tool_${i}`))
    render(<LiminalAssistantMsg blocks={blocks} />)

    const header = screen.getByTestId('tool-group-header')
    expect(header.textContent).toContain('6 tools')
    expect(screen.queryByText('tool_0')).toBeNull()

    fireEvent.click(header)
    expect(screen.getByText('tool_0')).toBeInTheDocument()
    expect(screen.getByText('tool_5')).toBeInTheDocument()
  })

  it('groups tools even when blank/whitespace-only text blocks are interspersed', () => {
    // Some models emit tiny empty text segments between tool calls; they render
    // nothing and must not break the run (which would defeat grouping).
    const blocks: AssistantBlock[] = []
    for (let i = 0; i < 6; i++) {
      blocks.push(toolBlock(`itool_${i}`))
      blocks.push({ kind: 'text', content: i % 2 ? '  ' : '\n' })
    }
    render(<LiminalAssistantMsg blocks={blocks} />)

    expect(screen.getByTestId('tool-group-header').textContent).toContain('6 tools')
    expect(screen.queryByText('itool_0')).toBeNull()
  })
})
