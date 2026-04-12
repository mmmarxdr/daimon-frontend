export type MessageRole = 'user' | 'assistant' | 'tool'

export interface ToolCall {
  name: string
  input: string
  output?: string
  tool_call_id: string
  done: boolean
  duration_ms?: number
  isError?: boolean
}

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  timestamp: Date
  toolCall?: ToolCall
  isStreaming?: boolean
}

export interface TurnStatus {
  active: boolean
  startTime: number  // Date.now()
  elapsedMs: number
  inputTokens: number
  outputTokens: number
  activity: string   // from "thinking" frames
  iteration: number
}
