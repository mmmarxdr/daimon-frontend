import { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useWebSocket } from './useWebSocket'
import type { MetricsSnapshot } from '../api/client'

export function useMetricsSocket() {
  const qc = useQueryClient()

  const handleMessage = useCallback((data: unknown) => {
    const snapshot = data as MetricsSnapshot
    if (!snapshot?.today || !snapshot?.month) return
    // Push into the TanStack Query cache — Overview re-renders automatically
    qc.setQueryData(['metrics'], snapshot)
  }, [qc])

  return useWebSocket({ path: '/ws/metrics', onMessage: handleMessage })
}
