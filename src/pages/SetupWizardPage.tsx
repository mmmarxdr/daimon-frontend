import { useState, useEffect, type CSSProperties } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Eye, EyeOff, Loader2 } from 'lucide-react'
import { setupApi, type ProviderInfo } from '../api/setup'
import { getProviderModels, type ModelInfo } from '../api/client'
import { ModelPicker } from '../components/provider/ModelPicker'
import { useSetup } from '../contexts/SetupContext'
import { LiminalGlyph } from '../components/liminal/LiminalGlyph'

// ─── Step indicator ───────────────────────────────────────────────────────────

const STEPS = ['welcome', 'provider', 'credentials', 'done']

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center" style={{ gap: 6, marginBottom: 28 }}>
      {STEPS.map((_, i) => (
        <div
          key={i}
          style={{
            height: 2,
            width: i === current ? 28 : 18,
            borderRadius: 1,
            background:
              i < current
                ? 'color-mix(in srgb, var(--accent) 55%, transparent)'
                : i === current
                  ? 'var(--accent)'
                  : 'var(--line-strong)',
            transition: 'all 0.2s ease',
          }}
        />
      ))}
    </div>
  )
}

// ─── Reusable styled primitives ──────────────────────────────────────────────

const sectionTitleStyle: CSSProperties = {
  fontSize: 22,
  lineHeight: 1.25,
  letterSpacing: -0.4,
  color: 'var(--ink)',
  margin: 0,
  marginBottom: 6,
}

const sectionSubStyle: CSSProperties = {
  fontSize: 13,
  lineHeight: 1.55,
  color: 'var(--ink-muted)',
  marginBottom: 22,
}

const labelStyle: CSSProperties = {
  display: 'block',
  fontSize: 10.5,
  letterSpacing: 0.7,
  color: 'var(--ink-muted)',
  marginBottom: 6,
  textTransform: 'uppercase',
}

const inputStyle: CSSProperties = {
  width: '100%',
  background: 'var(--bg-deep)',
  border: '1px solid var(--line)',
  borderRadius: 6,
  padding: '9px 12px',
  fontSize: 13,
  color: 'var(--ink)',
  outline: 'none',
}

function primaryBtnStyle(disabled: boolean): CSSProperties {
  return {
    background: 'var(--accent)',
    color: 'var(--bg-elev)',
    border: 'none',
    borderRadius: 6,
    padding: '9px 18px',
    fontSize: 12,
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    transition: 'opacity 0.15s',
  }
}

function ghostBtnStyle(): CSSProperties {
  return {
    background: 'transparent',
    color: 'var(--ink-soft)',
    border: '1px solid var(--line)',
    borderRadius: 6,
    padding: '9px 18px',
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
  }
}

// ─── Step 1: Welcome ──────────────────────────────────────────────────────────

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col" style={{ gap: 0 }}>
      <h2 className="font-serif italic" style={sectionTitleStyle}>
        let's bring me into being.
      </h2>
      <p className="font-serif italic" style={sectionSubStyle}>
        three steps. two minutes. then we can speak.
      </p>

      <div
        className="font-sans"
        style={{
          background: 'var(--bg-deep)',
          border: '1px solid var(--line)',
          borderRadius: 6,
          padding: '18px 20px',
          marginBottom: 26,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <WelcomeRow
          n="01"
          title="pick a provider"
          hint="Anthropic, OpenAI, Gemini, OpenRouter, or a local Ollama"
        />
        <WelcomeRow
          n="02"
          title="hand me an API key"
          hint="I check it against the provider before I save anything"
        />
        <WelcomeRow
          n="03"
          title="and that's it"
          hint="conversations, memory, tools — all yours from there"
        />
      </div>

      <div className="flex justify-end">
        <button type="button" onClick={onNext} style={primaryBtnStyle(false)}>
          begin →
        </button>
      </div>
    </div>
  )
}

function WelcomeRow({ n, title, hint }: { n: string; title: string; hint: string }) {
  return (
    <div className="flex items-start" style={{ gap: 14 }}>
      <span
        className="font-mono"
        style={{
          fontSize: 11,
          color: 'var(--accent)',
          letterSpacing: 0.5,
          paddingTop: 2,
          minWidth: 18,
        }}
      >
        {n}
      </span>
      <div>
        <div style={{ fontSize: 13.5, color: 'var(--ink)', fontWeight: 500 }}>{title}</div>
        <div
          className="font-serif italic"
          style={{ fontSize: 12.5, color: 'var(--ink-muted)', marginTop: 2 }}
        >
          {hint}
        </div>
      </div>
    </div>
  )
}

// ─── Step 2: Provider ─────────────────────────────────────────────────────────

interface ProviderStepProps {
  selected: string | null
  onSelect: (id: string) => void
  onNext: () => void
  onBack: () => void
}

function ProviderStep({ selected, onSelect, onNext, onBack }: ProviderStepProps) {
  const [providers, setProviders] = useState<Record<string, ProviderInfo>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setupApi
      .providers()
      .then((res) => {
        setProviders(res.providers)
        setLoading(false)
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load providers')
        setLoading(false)
      })
  }, [])

  return (
    <div>
      <h2 className="font-serif italic" style={sectionTitleStyle}>
        choose a voice.
      </h2>
      <p className="font-serif italic" style={sectionSubStyle}>
        every provider speaks with a different timbre. you can change it later.
      </p>

      {loading && (
        <div className="flex items-center justify-center" style={{ padding: '40px 0' }}>
          <Loader2 size={18} className="animate-spin" style={{ color: 'var(--ink-muted)' }} />
        </div>
      )}

      {error && (
        <div
          style={{
            fontSize: 12,
            color: 'var(--red)',
            background: 'color-mix(in srgb, var(--red) 8%, transparent)',
            border: '1px solid color-mix(in srgb, var(--red) 25%, transparent)',
            borderRadius: 6,
            padding: '8px 12px',
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      )}

      {!loading && !error && (
        <div
          className="grid"
          style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 24 }}
        >
          {Object.entries(providers).map(([id, info]) => (
            <ProviderCard
              key={id}
              id={id}
              info={info}
              selected={selected === id}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}

      <div className="flex justify-between">
        <button type="button" onClick={onBack} style={ghostBtnStyle()}>
          ← back
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!selected}
          style={primaryBtnStyle(!selected)}
        >
          continue →
        </button>
      </div>
    </div>
  )
}

function ProviderCard({
  id,
  info,
  selected,
  onSelect,
}: {
  id: string
  info: ProviderInfo
  selected: boolean
  onSelect: (id: string) => void
}) {
  const [hover, setHover] = useState(false)
  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        textAlign: 'left',
        background: selected ? 'color-mix(in srgb, var(--accent) 8%, transparent)' : 'var(--bg-deep)',
        border: `1px solid ${selected ? 'var(--accent)' : hover ? 'var(--line-strong)' : 'var(--line)'}`,
        borderRadius: 6,
        padding: '12px 14px',
        cursor: 'pointer',
        transition: 'border-color 0.15s, background 0.15s',
      }}
    >
      <div style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 500 }}>
        {info.display_name}
      </div>
      <div
        className="font-mono"
        style={{
          fontSize: 10.5,
          color: 'var(--ink-muted)',
          marginTop: 4,
          letterSpacing: 0.3,
        }}
      >
        {info.requires_api_key ? 'api key' : 'no key needed'}
      </div>
    </button>
  )
}

// ─── Step 3: Credentials ──────────────────────────────────────────────────────

interface CredentialsState {
  apiKey: string
  model: string
  baseUrl: string
  showKey: boolean
  validating: boolean
  validationStatus: 'idle' | 'success' | 'error'
  validationError: string
  skipped: boolean
}

interface CredentialsStepProps {
  providerId: string
  providerInfo: ProviderInfo | null
  onComplete: (apiKey: string, model: string, baseUrl: string) => void
  onBack: () => void
}

const OTHER_SENTINEL = '__other__'

function CredentialsStep({ providerId, providerInfo, onComplete, onBack }: CredentialsStepProps) {
  const isOllama = providerId === 'ollama'
  const catalogModels: ModelInfo[] = (providerInfo?.models ?? []).map((m) => ({
    id: m.id,
    name: m.display_name,
    context_length: m.context_k * 1000,
    prompt_cost: m.cost_in,
    completion_cost: m.cost_out,
    free: false,
  }))

  const [state, setState] = useState<CredentialsState>({
    apiKey: '',
    model: catalogModels[0]?.id ?? '',
    baseUrl: providerInfo?.default_base_url ?? '',
    showKey: false,
    validating: false,
    validationStatus: 'idle',
    validationError: '',
    skipped: false,
  })

  const [dynamicModels, setDynamicModels] = useState<ModelInfo[] | null>(null)
  const [dynamicModelsLoading, setDynamicModelsLoading] = useState(false)
  const [dynamicModelsError, setDynamicModelsError] = useState<Error | null>(null)

  const [modelDropdown, setModelDropdown] = useState(
    catalogModels[0]?.id ?? (isOllama ? '' : OTHER_SENTINEL),
  )
  const [customModel, setCustomModel] = useState('')

  const effectiveModel = dynamicModels
    ? state.model
    : modelDropdown === OTHER_SENTINEL || isOllama
      ? customModel
      : modelDropdown

  const canContinue = state.validationStatus === 'success' || state.skipped

  const update = (patch: Partial<CredentialsState>) => setState((s) => ({ ...s, ...patch }))

  const handleValidate = async () => {
    update({ validating: true, validationStatus: 'idle', validationError: '' })
    try {
      const res = await setupApi.validateKey({
        provider: providerId,
        api_key: state.apiKey,
        model: effectiveModel,
        base_url: state.baseUrl || undefined,
      })
      if (res.valid) {
        update({ validating: false, validationStatus: 'success' })
        if (!isOllama) {
          setDynamicModelsLoading(true)
          setDynamicModelsError(null)
          try {
            const result = await getProviderModels(providerId)
            setDynamicModels(result.models)
            if (result.models.length > 0 && !state.model) {
              update({ model: result.models[0].id })
            }
          } catch (err) {
            setDynamicModelsError(err instanceof Error ? err : new Error('Failed to load models'))
          } finally {
            setDynamicModelsLoading(false)
          }
        }
      } else {
        update({
          validating: false,
          validationStatus: 'error',
          validationError: res.error ?? 'Validation failed',
        })
      }
    } catch (err) {
      update({
        validating: false,
        validationStatus: 'error',
        validationError: err instanceof Error ? err.message : 'Network error',
      })
    }
  }

  const handleContinue = () => {
    onComplete(state.apiKey, effectiveModel, state.baseUrl)
  }

  return (
    <div>
      <h2 className="font-serif italic" style={sectionTitleStyle}>
        your keys.
      </h2>
      <p className="font-serif italic" style={sectionSubStyle}>
        {isOllama
          ? 'point me at your local Ollama. nothing leaves your machine.'
          : "I'll check it before I save anything."}
      </p>

      <div className="flex flex-col" style={{ gap: 16 }}>
        {!isOllama && (
          <div>
            <label className="font-mono" style={labelStyle}>
              API KEY
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={state.showKey ? 'text' : 'password'}
                value={state.apiKey}
                onChange={(e) => update({ apiKey: e.target.value, validationStatus: 'idle' })}
                placeholder="sk-ant-api..."
                className="font-mono"
                style={{ ...inputStyle, paddingRight: 36 }}
              />
              <button
                type="button"
                onClick={() => update({ showKey: !state.showKey })}
                tabIndex={-1}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--ink-muted)',
                  padding: 4,
                }}
              >
                {state.showKey ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
        )}

        {isOllama && (
          <div>
            <label className="font-mono" style={labelStyle}>
              BASE URL
            </label>
            <input
              type="text"
              value={state.baseUrl}
              onChange={(e) => update({ baseUrl: e.target.value, validationStatus: 'idle' })}
              placeholder="http://localhost:11434"
              className="font-mono"
              style={inputStyle}
            />
          </div>
        )}

        <div>
          <label className="font-mono" style={labelStyle}>
            MODEL
          </label>
          {isOllama ? (
            <input
              type="text"
              value={customModel}
              onChange={(e) => setCustomModel(e.target.value)}
              placeholder="llama3, mistral, codestral..."
              className="font-mono"
              style={inputStyle}
            />
          ) : dynamicModels !== null ? (
            <ModelPicker
              value={state.model}
              onChange={(id) => update({ model: id })}
              modelList={dynamicModels}
              isLoading={dynamicModelsLoading}
              error={dynamicModelsError}
            />
          ) : (
            <div className="flex flex-col" style={{ gap: 8 }}>
              <select
                value={modelDropdown}
                onChange={(e) => {
                  setModelDropdown(e.target.value)
                  if (e.target.value !== OTHER_SENTINEL) setCustomModel('')
                }}
                className="font-mono"
                style={{
                  ...inputStyle,
                  appearance: 'none',
                  paddingRight: 30,
                  backgroundImage:
                    "url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%237a7465'%3e%3cpath d='M4 6l4 4 4-4'/%3e%3c/svg%3e\")",
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 8px center',
                }}
              >
                {catalogModels.map((m) => (
                  <option key={m.id} value={m.id} style={{ background: 'var(--bg-elev)' }}>
                    {m.name}
                  </option>
                ))}
                <option value={OTHER_SENTINEL} style={{ background: 'var(--bg-elev)' }}>
                  other…
                </option>
              </select>
              {modelDropdown === OTHER_SENTINEL && (
                <input
                  type="text"
                  value={customModel}
                  onChange={(e) => setCustomModel(e.target.value)}
                  placeholder="model id"
                  autoFocus
                  className="font-mono"
                  style={inputStyle}
                />
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleValidate}
          disabled={state.validating || (!isOllama && !state.apiKey) || !effectiveModel}
          className="font-sans flex items-center justify-center"
          style={{
            ...ghostBtnStyle(),
            width: '100%',
            padding: '10px 16px',
            gap: 8,
            opacity: state.validating || (!isOllama && !state.apiKey) || !effectiveModel ? 0.45 : 1,
            cursor:
              state.validating || (!isOllama && !state.apiKey) || !effectiveModel
                ? 'not-allowed'
                : 'pointer',
          }}
        >
          {state.validating ? (
            <>
              <Loader2 size={13} className="animate-spin" />
              validating…
            </>
          ) : (
            'validate'
          )}
        </button>

        {state.validationStatus === 'success' && (
          <div
            className="flex items-center"
            style={{
              gap: 8,
              fontSize: 12,
              color: 'var(--accent)',
              background: 'color-mix(in srgb, var(--accent) 8%, transparent)',
              border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)',
              borderRadius: 6,
              padding: '8px 12px',
            }}
          >
            <CheckCircle2 size={14} />
            key validated.
          </div>
        )}
        {state.validationStatus === 'error' && (
          <div
            style={{
              fontSize: 12,
              color: 'var(--red)',
              background: 'color-mix(in srgb, var(--red) 8%, transparent)',
              border: '1px solid color-mix(in srgb, var(--red) 25%, transparent)',
              borderRadius: 6,
              padding: '8px 12px',
            }}
          >
            {state.validationError}
          </div>
        )}
      </div>

      <div className="text-center" style={{ marginTop: 14 }}>
        <button
          type="button"
          onClick={() => update({ skipped: true, validationStatus: 'idle' })}
          className="font-serif italic"
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: 11.5,
            color: 'var(--ink-faint)',
          }}
        >
          skip validation (advanced)
        </button>
      </div>

      <div className="flex justify-between" style={{ marginTop: 22 }}>
        <button type="button" onClick={onBack} style={ghostBtnStyle()}>
          ← back
        </button>
        <button
          type="button"
          onClick={handleContinue}
          disabled={!canContinue}
          style={primaryBtnStyle(!canContinue)}
        >
          continue →
        </button>
      </div>
    </div>
  )
}

// ─── Step 4: Done ─────────────────────────────────────────────────────────────

interface DoneStepProps {
  providerId: string
  model: string
  apiKey: string
  baseUrl: string
}

function maskApiKey(key: string): string {
  if (!key || key.length < 8) return key ? '••••••••' : 'none'
  return `${key.slice(0, 6)}…${key.slice(-4)}`
}

function DoneStep({ providerId, model, apiKey, baseUrl }: DoneStepProps) {
  const { setNeedsSetup } = useSetup()
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    setLoading(true)
    setupApi
      .complete({
        provider: providerId,
        api_key: apiKey,
        model,
        base_url: baseUrl || undefined,
      })
      .then(() => {
        setLoading(false)
        setDone(true)
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to save configuration')
        setLoading(false)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleGoToDashboard = () => {
    queryClient.clear()
    setNeedsSetup(false)
  }

  const handleRetry = () => {
    setError(null)
    setLoading(true)
    setupApi
      .complete({ provider: providerId, api_key: apiKey, model, base_url: baseUrl || undefined })
      .then(() => {
        setLoading(false)
        setDone(true)
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to save configuration')
        setLoading(false)
      })
  }

  if (loading) {
    return (
      <div className="text-center" style={{ padding: '40px 0' }}>
        <Loader2 size={20} className="animate-spin" style={{ color: 'var(--ink-muted)', margin: '0 auto 12px' }} />
        <p className="font-serif italic" style={{ fontSize: 13, color: 'var(--ink-muted)' }}>
          saving…
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center" style={{ padding: '20px 0' }}>
        <p className="font-serif italic" style={{ fontSize: 14, color: 'var(--red)', marginBottom: 6 }}>
          something broke.
        </p>
        <p style={{ fontSize: 12, color: 'var(--ink-muted)', marginBottom: 20 }}>{error}</p>
        <button type="button" onClick={handleRetry} style={primaryBtnStyle(false)}>
          try again
        </button>
      </div>
    )
  }

  if (!done) return null

  return (
    <div className="text-center">
      <div
        className="flex items-center justify-center"
        style={{
          width: 44,
          height: 44,
          borderRadius: 999,
          background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
          border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)',
          margin: '0 auto 16px',
        }}
      >
        <CheckCircle2 size={20} style={{ color: 'var(--accent)' }} />
      </div>
      <h2 className="font-serif italic" style={{ ...sectionTitleStyle, fontSize: 20, marginBottom: 4 }}>
        I'm here now.
      </h2>
      <p className="font-serif italic" style={{ ...sectionSubStyle, marginBottom: 22 }}>
        everything saved. we can start talking.
      </p>

      <div
        className="font-sans"
        style={{
          background: 'var(--bg-deep)',
          border: '1px solid var(--line)',
          borderRadius: 6,
          padding: '14px 16px',
          marginBottom: 22,
          textAlign: 'left',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <SummaryRow label="PROVIDER" value={providerId} />
        <SummaryRow label="MODEL" value={model} mono />
        {apiKey && <SummaryRow label="API KEY" value={maskApiKey(apiKey)} mono />}
      </div>

      <button
        type="button"
        onClick={handleGoToDashboard}
        style={{ ...primaryBtnStyle(false), width: '100%', padding: '10px 18px' }}
      >
        enter dashboard
      </button>

      <p
        className="font-serif italic"
        style={{ marginTop: 14, fontSize: 11.5, color: 'var(--ink-faint)' }}
      >
        change any of this from Settings whenever.
      </p>
    </div>
  )
}

function SummaryRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between" style={{ gap: 12 }}>
      <span
        className="font-mono"
        style={{ fontSize: 10.5, color: 'var(--ink-muted)', letterSpacing: 0.7 }}
      >
        {label}
      </span>
      <span
        className={mono ? 'font-mono' : 'font-sans'}
        style={{ fontSize: 12, color: 'var(--ink)', fontWeight: 500 }}
      >
        {value}
      </span>
    </div>
  )
}

// ─── Wizard shell ─────────────────────────────────────────────────────────────

interface WizardState {
  step: number
  selectedProvider: string | null
  apiKey: string
  model: string
  baseUrl: string
}

export function SetupWizardPage() {
  const [state, setState] = useState<WizardState>({
    step: 0,
    selectedProvider: null,
    apiKey: '',
    model: '',
    baseUrl: '',
  })
  const [providers, setProviders] = useState<Record<string, ProviderInfo>>({})

  useEffect(() => {
    setupApi
      .providers()
      .then((res) => setProviders(res.providers))
      .catch(() => {})
  }, [])

  const goTo = (step: number) => setState((s) => ({ ...s, step }))

  const selectedProviderInfo = state.selectedProvider
    ? (providers[state.selectedProvider] ?? null)
    : null

  return (
    <div
      className="flex items-center justify-center"
      style={{ minHeight: '100vh', background: 'var(--bg)', padding: 24 }}
    >
      <div style={{ width: '100%', maxWidth: 480 }}>
        <div className="text-center" style={{ marginBottom: 32 }}>
          <div className="flex items-center justify-center" style={{ marginBottom: 14 }}>
            <LiminalGlyph size={28} animate />
          </div>
          <p
            className="font-mono"
            style={{
              fontSize: 10.5,
              color: 'var(--ink-muted)',
              letterSpacing: 2.5,
              textTransform: 'uppercase',
              margin: 0,
            }}
          >
            DAIMON · SETUP
          </p>
        </div>

        <StepIndicator current={state.step} />

        <div
          style={{
            background: 'var(--bg-elev)',
            border: '1px solid var(--line)',
            borderRadius: 8,
            padding: '28px 28px 26px',
          }}
        >
          {state.step === 0 && <WelcomeStep onNext={() => goTo(1)} />}

          {state.step === 1 && (
            <ProviderStep
              selected={state.selectedProvider}
              onSelect={(id) => setState((s) => ({ ...s, selectedProvider: id }))}
              onNext={() => goTo(2)}
              onBack={() => goTo(0)}
            />
          )}

          {state.step === 2 && state.selectedProvider && (
            <CredentialsStep
              providerId={state.selectedProvider}
              providerInfo={selectedProviderInfo}
              onComplete={(apiKey, model, baseUrl) => {
                setState((s) => ({ ...s, apiKey, model, baseUrl }))
                goTo(3)
              }}
              onBack={() => goTo(1)}
            />
          )}

          {state.step === 3 && state.selectedProvider && (
            <DoneStep
              providerId={state.selectedProvider}
              model={state.model}
              apiKey={state.apiKey}
              baseUrl={state.baseUrl}
            />
          )}
        </div>

        <p
          className="font-mono text-center"
          style={{
            marginTop: 18,
            fontSize: 10.5,
            color: 'var(--ink-faint)',
            letterSpacing: 1.2,
            textTransform: 'uppercase',
          }}
        >
          step {state.step + 1} of {STEPS.length} · {STEPS[state.step]}
        </p>
      </div>
    </div>
  )
}
