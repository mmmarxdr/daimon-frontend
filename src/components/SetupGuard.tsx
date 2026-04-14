import { useEffect, type ReactNode } from 'react'
import { setupApi } from '../api/setup'
import { useSetup } from '../contexts/SetupContext'
import { SetupWizardPage } from '../pages/SetupWizardPage'
import { Loader2, AlertCircle } from 'lucide-react'
import { useState } from 'react'

interface SetupGuardProps {
  children: ReactNode
}

export function SetupGuard({ children }: SetupGuardProps) {
  const { needsSetup, setNeedsSetup, isChecking, setIsChecking } = useSetup()
  const [error, setError] = useState<string | null>(null)

  const checkSetup = () => {
    setError(null)
    setIsChecking(true)
    setupApi
      .status()
      .then((res) => {
        setNeedsSetup(res.needs_setup)
        setIsChecking(false)
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Network error'
        setError(msg)
        setIsChecking(false)
      })
  }

  useEffect(() => {
    checkSetup()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (isChecking) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-5 h-5 text-neutral-500 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-sm">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#111111] border border-[#222222]">
            <AlertCircle className="w-5 h-5 text-error" />
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary mb-1">Could not reach server</p>
            <p className="text-xs text-text-secondary">{error}</p>
          </div>
          <button
            onClick={checkSetup}
            className="px-4 py-2 text-sm font-medium bg-accent text-white rounded-md hover:bg-accent-hover transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (needsSetup) {
    return <SetupWizardPage />
  }

  return <>{children}</>
}
