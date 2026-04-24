import { useEffect, useRef, useState } from 'react'

interface DangerZoneModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  isPending: boolean
  error?: string | null
}

/**
 * DangerZoneModal — Liminal-styled destructive-action confirmation.
 *
 * The visual restraint is deliberate: in this design language we avoid
 * red-flooded warning panels (they read as alarming OS dialogs). The
 * confirmation type-`DELETE` interaction does the heavy lifting; red lives
 * only on the final button + a thin left accent on the prompt card.
 */
export function DangerZoneModal({
  isOpen,
  onClose,
  onConfirm,
  isPending,
  error,
}: DangerZoneModalProps) {
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  const handleClose = () => {
    setInputValue('')
    onClose()
  }

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleConfirm() {
    if (inputValue !== 'DELETE') return
    await onConfirm()
    if (!error) setInputValue('')
  }

  if (!isOpen) return null

  const confirmed = inputValue === 'DELETE'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="danger-zone-modal-title"
    >
      <div
        className="absolute inset-0"
        onClick={handleClose}
        aria-hidden="true"
        style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)' }}
      />

      <div
        className="relative z-10 mx-4"
        style={{
          width: '100%',
          maxWidth: 440,
          background: 'var(--bg-elev)',
          border: '1px solid var(--line-strong)',
          borderRadius: 8,
          boxShadow: '0 10px 40px rgba(0,0,0,0.35)',
          overflow: 'hidden',
        }}
      >
        {/* Header — serif italic title sets the tone, no warning icon needed */}
        <div
          style={{
            padding: '20px 22px 16px',
            borderBottom: '1px solid var(--line)',
            borderLeft: '2px solid var(--red)',
          }}
        >
          <h2
            id="danger-zone-modal-title"
            className="font-serif italic"
            style={{
              margin: 0,
              fontSize: 19,
              color: 'var(--ink)',
              letterSpacing: -0.3,
            }}
          >
            are you sure?
          </h2>
          <p
            className="font-sans"
            style={{
              margin: '6px 0 0 0',
              fontSize: 13,
              lineHeight: 1.55,
              color: 'var(--ink-soft)',
            }}
          >
            this clears the provider + model and restarts the setup wizard.
            memory, conversations and knowledge stay intact.
          </p>
        </div>

        {/* Confirm body */}
        <div style={{ padding: '18px 22px 20px' }}>
          <label
            htmlFor="danger-confirm-input"
            className="font-mono"
            style={{
              display: 'block',
              fontSize: 10.5,
              letterSpacing: 0.7,
              textTransform: 'uppercase',
              color: 'var(--ink-muted)',
              marginBottom: 8,
            }}
          >
            type{' '}
            <span style={{ color: 'var(--ink)', fontWeight: 600 }}>DELETE</span>
            {' '}to confirm
          </label>
          <input
            id="danger-confirm-input"
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="DELETE"
            autoComplete="off"
            spellCheck={false}
            disabled={isPending}
            className="font-mono"
            style={{
              width: '100%',
              background: 'var(--bg-deep)',
              border: '1px solid var(--line)',
              borderRadius: 6,
              padding: '9px 12px',
              fontSize: 13,
              color: 'var(--ink)',
              outline: 'none',
            }}
          />

          {error && (
            <div
              className="font-sans"
              style={{
                marginTop: 12,
                padding: '8px 12px',
                background: 'color-mix(in srgb, var(--red) 8%, transparent)',
                border: '1px solid color-mix(in srgb, var(--red) 25%, transparent)',
                borderRadius: 6,
                fontSize: 12,
                color: 'var(--red)',
              }}
            >
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end" style={{ gap: 8, marginTop: 18 }}>
            <button
              type="button"
              onClick={handleClose}
              disabled={isPending}
              className="font-sans"
              style={{
                background: 'transparent',
                color: 'var(--ink-soft)',
                border: '1px solid var(--line)',
                borderRadius: 6,
                padding: '8px 14px',
                fontSize: 12,
                fontWeight: 500,
                cursor: isPending ? 'not-allowed' : 'pointer',
                opacity: isPending ? 0.5 : 1,
              }}
            >
              cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!confirmed || isPending}
              className="font-sans"
              style={{
                background: confirmed && !isPending
                  ? 'var(--red)'
                  : 'color-mix(in srgb, var(--red) 25%, transparent)',
                color: confirmed && !isPending ? 'var(--bg-elev)' : 'var(--ink-muted)',
                border: 'none',
                borderRadius: 6,
                padding: '8px 14px',
                fontSize: 12,
                fontWeight: 600,
                cursor: confirmed && !isPending ? 'pointer' : 'not-allowed',
                transition: 'background 0.15s',
              }}
            >
              {isPending ? 'resetting…' : 'reset'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
