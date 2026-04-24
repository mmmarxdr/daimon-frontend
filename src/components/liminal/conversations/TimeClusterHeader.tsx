import type { TimeBucket } from '../../../utils/timeBuckets'
import { BUCKET_LABELS } from '../../../utils/timeBuckets'

interface TimeClusterHeaderProps {
  bucket: TimeBucket
  count: number
}

/**
 * Liminal-style header for a time-relative cluster of conversations.
 * Visual parallel to ClusterHeader (memory side) but typed to the
 * TimeBucket domain.
 */
export function TimeClusterHeader({ bucket, count }: TimeClusterHeaderProps) {
  return (
    <div
      className="flex items-baseline font-sans"
      style={{
        gap: 10,
        paddingBottom: 6,
        marginBottom: 10,
        borderBottom: '1px solid var(--line)',
      }}
    >
      <span
        className="font-serif italic"
        style={{ fontSize: 13, color: 'var(--ink-soft)' }}
      >
        {BUCKET_LABELS[bucket]}
      </span>
      <span
        className="font-mono"
        style={{ fontSize: 10.5, color: 'var(--ink-muted)', letterSpacing: 0.6 }}
      >
        {count}
      </span>
    </div>
  )
}
