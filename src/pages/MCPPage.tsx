import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plug,
  Plus,
  Trash2,
  TestTube,
  Check,
  X,
  Server,
  Mail,
  Calendar,
  Github,
  Folder,
  Search,
} from 'lucide-react'
import { api } from '../api/client'
import type { MCPServer, MCPServerConfig, MCPTestResult } from '../api/client'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Toggle } from '../components/ui/Toggle'
import { Badge } from '../components/ui/Badge'
import { Toast } from '../components/ui/Toast'
import { FormField } from '../components/ui/FormField'
import { cn } from '../lib/utils'

// ─── Recipe catalog ───────────────────────────────────────────────────────────

const MCP_RECIPES = [
  {
    id: 'google-workspace',
    name: 'Google Workspace',
    description: 'Gmail, Calendar, Drive, Docs, Sheets',
    icon: 'mail' as const,
    transport: 'stdio' as const,
    command: ['uv', 'run', 'workspace-mcp'],
    prefix_tools: true,
    env: { GOOGLE_OAUTH_CLIENT_ID: '', GOOGLE_OAUTH_CLIENT_SECRET: '' },
    setup_hint: 'Requires Google OAuth credentials from console.cloud.google.com',
  },
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    description: 'Calendar events, scheduling, free/busy queries',
    icon: 'calendar' as const,
    transport: 'stdio' as const,
    command: ['npx', '@cocal/google-calendar-mcp'],
    prefix_tools: true,
    env: { GOOGLE_OAUTH_CREDENTIALS: '' },
    setup_hint: 'Requires OAuth credentials JSON file',
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'Issues, PRs, repos, CI status',
    icon: 'github' as const,
    transport: 'stdio' as const,
    command: ['npx', '-y', '@modelcontextprotocol/server-github'],
    prefix_tools: true,
    env: { GITHUB_PERSONAL_ACCESS_TOKEN: '' },
    setup_hint: 'Requires a GitHub personal access token',
  },
  {
    id: 'filesystem',
    name: 'Filesystem',
    description: 'Sandboxed file read/write access',
    icon: 'folder' as const,
    transport: 'stdio' as const,
    command: ['npx', '-y', '@modelcontextprotocol/server-filesystem', '/tmp'],
    prefix_tools: false,
    env: {},
    setup_hint: 'Edit the path in the command after adding',
  },
  {
    id: 'brave-search',
    name: 'Brave Search',
    description: 'Web search without scraping',
    icon: 'search' as const,
    transport: 'stdio' as const,
    command: ['npx', '-y', '@modelcontextprotocol/server-brave-search'],
    prefix_tools: false,
    env: { BRAVE_API_KEY: '' },
    setup_hint: 'Get a free API key at brave.com/search/api',
  },
]

type RecipeIcon = 'mail' | 'calendar' | 'github' | 'folder' | 'search'

const RECIPE_ICONS: Record<RecipeIcon, React.ElementType> = {
  mail: Mail,
  calendar: Calendar,
  github: Github,
  folder: Folder,
  search: Search,
}

// ─── Env var editor ───────────────────────────────────────────────────────────

interface EnvEditorProps {
  value: Record<string, string>
  onChange: (v: Record<string, string>) => void
}

function EnvEditor({ value, onChange }: EnvEditorProps) {
  const entries = Object.entries(value)

  const updateKey = (oldKey: string, newKey: string) => {
    const next: Record<string, string> = {}
    for (const [k, v] of Object.entries(value)) {
      next[k === oldKey ? newKey : k] = v
    }
    onChange(next)
  }

  const updateVal = (key: string, val: string) => {
    onChange({ ...value, [key]: val })
  }

  const removeEntry = (key: string) => {
    const next = { ...value }
    delete next[key]
    onChange(next)
  }

  const addEntry = () => {
    onChange({ ...value, '': '' })
  }

  return (
    <div className="space-y-2">
      {entries.map(([k, v], i) => (
        <div key={i} className="flex gap-2 items-center">
          <Input
            placeholder="KEY"
            value={k}
            onChange={e => updateKey(k, e.target.value)}
            className="font-mono text-xs flex-1"
          />
          <Input
            placeholder="value"
            value={v}
            onChange={e => updateVal(k, e.target.value)}
            className="font-mono text-xs flex-1"
          />
          <button
            type="button"
            onClick={() => removeEntry(k)}
            className="text-text-secondary hover:text-error transition-colors p-1"
          >
            <X size={14} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addEntry}
        className="text-xs text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1"
      >
        <Plus size={12} /> Add variable
      </button>
    </div>
  )
}

// ─── Server card ──────────────────────────────────────────────────────────────

interface TestState {
  loading: boolean
  result?: MCPTestResult
}

interface ServerCardProps {
  server: MCPServer
  onRemove: (name: string) => void
  isRemoving: boolean
}

function ServerCard({ server, onRemove, isRemoving }: ServerCardProps) {
  const [testState, setTestState] = useState<TestState>({ loading: false })
  const [confirmRemove, setConfirmRemove] = useState(false)

  const handleTest = async () => {
    setTestState({ loading: true })
    try {
      const result = await api.testMCPServer(server.name)
      setTestState({ loading: false, result })
    } catch (err) {
      setTestState({ loading: false, result: { connected: false, error: String(err) } })
    }
  }

  const displayCommand = server.transport === 'stdio' ? server.command : server.url

  return (
    <div className="border border-border rounded-md p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Server size={16} className="text-text-secondary shrink-0" strokeWidth={1.75} />
          <span className="font-medium text-sm text-text-primary truncate">{server.name}</span>
          <Badge variant={server.transport === 'stdio' ? 'default' : 'accent'}>
            {server.transport}
          </Badge>
          <Badge variant={server.connected ? 'success' : 'error'}>
            {server.connected ? 'connected' : 'disconnected'}
          </Badge>
          {server.connected && server.tool_count > 0 && (
            <span className="text-xs text-text-secondary">{server.tool_count} tools</span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleTest}
            disabled={testState.loading}
            title="Test connection"
          >
            <TestTube size={14} strokeWidth={1.75} />
            {testState.loading ? 'Testing...' : 'Test'}
          </Button>
          {confirmRemove ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove(server.name)}
                disabled={isRemoving}
                className="text-error hover:text-error"
              >
                Confirm
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmRemove(false)}
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmRemove(true)}
              title="Remove server"
            >
              <Trash2 size={14} strokeWidth={1.75} />
            </Button>
          )}
        </div>
      </div>

      {displayCommand && (
        <p className="text-xs font-mono text-text-secondary truncate">
          {displayCommand}
        </p>
      )}

      {testState.result && (
        <div
          className={cn(
            'flex items-start gap-2 text-xs rounded-md px-3 py-2',
            testState.result.connected
              ? 'bg-success-light text-success'
              : 'bg-error-light text-error'
          )}
        >
          {testState.result.connected ? (
            <>
              <Check size={13} className="shrink-0 mt-0.5" strokeWidth={2} />
              <span>
                Connected — {testState.result.tools?.length ?? 0} tools:{' '}
                {testState.result.tools?.join(', ')}
              </span>
            </>
          ) : (
            <>
              <X size={13} className="shrink-0 mt-0.5" strokeWidth={2} />
              <span>{testState.result.error ?? 'Connection failed'}</span>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Add server form ──────────────────────────────────────────────────────────

type AddMode = 'catalog' | 'custom'

interface AddServerFormProps {
  onAdd: (config: MCPServerConfig) => void
  isAdding: boolean
}

function AddServerForm({ onAdd, isAdding }: AddServerFormProps) {
  const [mode, setMode] = useState<AddMode>('catalog')
  const [selectedRecipe, setSelectedRecipe] = useState<string | null>(null)

  // Custom form state
  const [name, setName] = useState('')
  const [transport, setTransport] = useState<'stdio' | 'http'>('stdio')
  const [commandStr, setCommandStr] = useState('')
  const [url, setUrl] = useState('')
  const [prefixTools, setPrefixTools] = useState(false)
  const [env, setEnv] = useState<Record<string, string>>({})

  // Recipe env overrides
  const [recipeEnv, setRecipeEnv] = useState<Record<string, string>>({})

  const handleRecipeSelect = (recipeId: string) => {
    if (selectedRecipe === recipeId) {
      setSelectedRecipe(null)
      setRecipeEnv({})
      return
    }
    const recipe = MCP_RECIPES.find(r => r.id === recipeId)
    if (recipe) {
      setSelectedRecipe(recipeId)
      setRecipeEnv(Object.fromEntries(Object.entries(recipe.env).map(([k, v]) => [k, v ?? ''])))
    }
  }

  const handleAddRecipe = () => {
    const recipe = MCP_RECIPES.find(r => r.id === selectedRecipe)
    if (!recipe) return
    onAdd({
      name: recipe.id,
      transport: recipe.transport,
      command: recipe.command,
      prefix_tools: recipe.prefix_tools,
      env: recipeEnv,
    })
  }

  const handleAddCustom = () => {
    if (!name.trim()) return
    const config: MCPServerConfig = {
      name: name.trim(),
      transport,
      prefix_tools: prefixTools,
      env,
    }
    if (transport === 'stdio') {
      config.command = commandStr.trim().split(/\s+/).filter(Boolean)
    } else {
      config.url = url.trim()
    }
    onAdd(config)
  }

  const selectedRecipeData = MCP_RECIPES.find(r => r.id === selectedRecipe)

  return (
    <div className="border border-border rounded-md">
      {/* Mode tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setMode('catalog')}
          className={cn(
            'flex-1 py-2.5 text-xs font-medium transition-colors',
            mode === 'catalog'
              ? 'text-text-primary border-b-2 border-accent -mb-px'
              : 'text-text-secondary hover:text-text-primary'
          )}
        >
          From catalog
        </button>
        <button
          onClick={() => setMode('custom')}
          className={cn(
            'flex-1 py-2.5 text-xs font-medium transition-colors',
            mode === 'custom'
              ? 'text-text-primary border-b-2 border-accent -mb-px'
              : 'text-text-secondary hover:text-text-primary'
          )}
        >
          Custom
        </button>
      </div>

      <div className="p-4">
        {mode === 'catalog' && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-2">
              {MCP_RECIPES.map(recipe => {
                const IconComp = RECIPE_ICONS[recipe.icon]
                const isSelected = selectedRecipe === recipe.id
                return (
                  <button
                    key={recipe.id}
                    type="button"
                    onClick={() => handleRecipeSelect(recipe.id)}
                    className={cn(
                      'w-full text-left flex items-start gap-3 p-3 rounded-md border transition-colors',
                      isSelected
                        ? 'border-accent bg-accent-light'
                        : 'border-border hover:bg-hover-surface'
                    )}
                  >
                    <div className={cn(
                      'mt-0.5 p-1.5 rounded-md shrink-0',
                      isSelected ? 'bg-accent text-white' : 'bg-hover-surface text-text-secondary'
                    )}>
                      <IconComp size={14} strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-primary">{recipe.name}</p>
                      <p className="text-xs text-text-secondary mt-0.5">{recipe.description}</p>
                      {isSelected && (
                        <p className="text-xs text-text-secondary mt-1 italic">{recipe.setup_hint}</p>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>

            {selectedRecipeData && Object.keys(selectedRecipeData.env).length > 0 && (
              <div className="space-y-2 border-t border-border pt-3">
                <p className="text-xs font-medium text-text-primary">Environment variables</p>
                <EnvEditor value={recipeEnv} onChange={setRecipeEnv} />
              </div>
            )}

            <Button
              onClick={handleAddRecipe}
              disabled={!selectedRecipe || isAdding}
              className="w-full"
            >
              <Plus size={14} strokeWidth={1.75} />
              {isAdding ? 'Adding...' : 'Add server'}
            </Button>
          </div>
        )}

        {mode === 'custom' && (
          <div className="space-y-4">
            <FormField label="Name" required>
              <Input
                placeholder="my-server"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </FormField>

            <FormField label="Transport">
              <Select
                value={transport}
                onChange={e => setTransport(e.target.value as 'stdio' | 'http')}
              >
                <option value="stdio">stdio</option>
                <option value="http">http</option>
              </Select>
            </FormField>

            {transport === 'stdio' ? (
              <FormField label="Command" hint="Full command string, e.g. npx -y @org/server">
                <Input
                  placeholder="npx -y @modelcontextprotocol/server-github"
                  value={commandStr}
                  onChange={e => setCommandStr(e.target.value)}
                  className="font-mono text-xs"
                />
              </FormField>
            ) : (
              <FormField label="URL">
                <Input
                  placeholder="http://localhost:8080/mcp"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  className="font-mono text-xs"
                />
              </FormField>
            )}

            <Toggle
              checked={prefixTools}
              onChange={setPrefixTools}
              label="Prefix tools"
              description="Prefix tool names with the server name to avoid collisions"
            />

            <FormField label="Environment variables" hint="Optional key-value pairs passed to the server process">
              <EnvEditor value={env} onChange={setEnv} />
            </FormField>

            <Button
              onClick={handleAddCustom}
              disabled={!name.trim() || isAdding}
              className="w-full"
            >
              <Plus size={14} strokeWidth={1.75} />
              {isAdding ? 'Adding...' : 'Add server'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function MCPPage() {
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['mcp-servers'],
    queryFn: api.mcpServers,
  })

  const { mutate: addServer, isPending: isAdding } = useMutation({
    mutationFn: api.addMCPServer,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mcp-servers'] })
      setShowAddForm(false)
      setToast({ message: 'Server added successfully.', variant: 'success' })
    },
    onError: (err: Error) => {
      setToast({ message: err.message ?? 'Failed to add server.', variant: 'error' })
    },
  })

  const { mutate: removeServer, variables: removingName, isPending: isRemoving } = useMutation({
    mutationFn: api.removeMCPServer,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mcp-servers'] })
      setToast({ message: 'Server removed.', variant: 'success' })
    },
    onError: (err: Error) => {
      setToast({ message: err.message ?? 'Failed to remove server.', variant: 'error' })
    },
  })

  const servers: MCPServer[] = data?.servers ?? []

  return (
    <div className="px-6 md:px-10 py-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            <Plug size={18} strokeWidth={1.75} />
            Integrations
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Manage MCP servers that extend the agent with external tools.
          </p>
        </div>
        <Button onClick={() => setShowAddForm(v => !v)}>
          <Plus size={14} strokeWidth={1.75} />
          Add server
        </Button>
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="mb-6">
          <AddServerForm onAdd={addServer} isAdding={isAdding} />
        </div>
      )}

      {/* Server list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(k => (
            <div key={k} className="h-20 animate-pulse bg-surface rounded-md border border-border" />
          ))}
        </div>
      ) : servers.length === 0 ? (
        <div className="border border-dashed border-border rounded-md p-10 text-center">
          <Server size={24} className="text-text-disabled mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-sm text-text-secondary">No MCP servers configured.</p>
          <p className="text-xs text-text-disabled mt-1">
            Add a server from the catalog or configure one manually.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {servers.map(server => (
            <ServerCard
              key={server.name}
              server={server}
              onRemove={removeServer}
              isRemoving={isRemoving && removingName === server.name}
            />
          ))}
        </div>
      )}

      {toast && (
        <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />
      )}
    </div>
  )
}
