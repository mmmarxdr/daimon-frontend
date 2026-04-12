import { useEffect, useRef, useState } from 'react'
import type { TurnStatus } from '../../types/chat'

interface StatusBarProps {
  turnStatus: TurnStatus | null
}

export function StatusBar({ turnStatus }: StatusBarProps) {
  const [displayElapsed, setDisplayElapsed] = useState(0)
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<number | null>(null)
  const hideTimerRef = useRef<number | null>(null)

  useEffect(() => {
    if (turnStatus?.active) {
      setVisible(true)
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current)
        hideTimerRef.current = null
      }
      timerRef.current = window.setInterval(() => {
        setDisplayElapsed(Date.now() - (turnStatus?.startTime ?? Date.now()))
      }, 100)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      if (turnStatus !== null) {
        // Keep showing final elapsed for 2s then hide
        hideTimerRef.current = window.setTimeout(() => {
          setVisible(false)
        }, 2000)
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [turnStatus?.active, turnStatus?.startTime])

  // Reset visibility when turnStatus goes null
  useEffect(() => {
    if (turnStatus === null) {
      setVisible(false)
      setDisplayElapsed(0)
    }
  }, [turnStatus])

  if (!turnStatus || !visible) return null

  // Format: "1.2s" or "12.3s"
  const elapsed = (displayElapsed / 1000).toFixed(1) + 's'
  const tokens = `${turnStatus.inputTokens} in / ${turnStatus.outputTokens} out`

  return (
    <div
      className={`flex items-center justify-between px-4 h-8 bg-[#111] border-t border-[#222] text-xs font-mono transition-opacity duration-300 shrink-0 ${
        turnStatus.active ? 'opacity-100' : 'opacity-60'
      }`}
    >
      <div className="flex items-center gap-3">
        {turnStatus.active && (
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        )}
        <span className="text-[#a1a1aa]">{elapsed}</span>
        <span className="text-[#71717a]">{turnStatus.activity}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[#71717a]">{tokens}</span>
        {turnStatus.iteration > 1 && (
          <span className="text-[#555] text-[10px] border border-[#333] rounded px-1">
            iter {turnStatus.iteration}
          </span>
        )}
      </div>
    </div>
  )
}
