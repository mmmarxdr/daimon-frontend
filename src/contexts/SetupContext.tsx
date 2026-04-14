import { createContext, useContext, useState, type ReactNode } from 'react'

export interface SetupContextValue {
  needsSetup: boolean
  setNeedsSetup: (v: boolean) => void
  isChecking: boolean
  setIsChecking: (v: boolean) => void
}

export const SetupContext = createContext<SetupContextValue | null>(null)

export function SetupProvider({ children }: { children: ReactNode }) {
  const [needsSetup, setNeedsSetup] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  return (
    <SetupContext.Provider value={{ needsSetup, setNeedsSetup, isChecking, setIsChecking }}>
      {children}
    </SetupContext.Provider>
  )
}

export function useSetup(): SetupContextValue {
  const ctx = useContext(SetupContext)
  if (!ctx) throw new Error('useSetup must be used within SetupProvider')
  return ctx
}
