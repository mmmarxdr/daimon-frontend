import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LiminalTool } from '../LiminalTool'
import type { ToolCall } from '../../../types/chat'

const mkTool = (over: Partial<ToolCall> = {}): ToolCall => ({
  name: 'batch_exec',
  input: '{"command":"ls -lah"}',
  output: 'ok',
  tool_call_id: 't1',
  done: true,
  ...over,
})

const EIGHT_LINES = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8'].join('\n')

describe('LiminalTool — inline output peek', () => {
  it('shows the first 4 lines and a "+N lines (click to expand)" affordance when there is more', () => {
    render(<LiminalTool tool={mkTool({ output: EIGHT_LINES })} />)

    const peek = screen.getByTestId('tool-peek')
    const text = peek.textContent ?? ''
    expect(text).toContain('L1')
    expect(text).toContain('L4')
    // Lines beyond the peek must NOT be visible while collapsed.
    expect(text).not.toContain('L5')
    expect(text).not.toContain('L8')

    const more = screen.getByTestId('tool-expand-more')
    expect(more.textContent).toMatch(/\+4 lines/)
    expect(more.textContent).toMatch(/click to expand/i)
  })

  it('expands to the full output when the peek is clicked', () => {
    const { container } = render(<LiminalTool tool={mkTool({ output: EIGHT_LINES })} />)

    fireEvent.click(screen.getByTestId('tool-peek'))

    // Peek is replaced by the full expanded panel; hidden lines now visible.
    expect(screen.queryByTestId('tool-peek')).toBeNull()
    expect(container.textContent).toContain('L8')
  })

  it('shows no expand affordance when the output fits within the peek', () => {
    render(<LiminalTool tool={mkTool({ output: 'one\ntwo\nthree' })} />)

    expect(screen.getByTestId('tool-peek').textContent).toContain('three')
    expect(screen.queryByTestId('tool-expand-more')).toBeNull()
  })

  it('renders no peek while the tool is still running', () => {
    render(<LiminalTool tool={mkTool({ done: false, output: undefined })} />)
    expect(screen.queryByTestId('tool-peek')).toBeNull()
  })
})
