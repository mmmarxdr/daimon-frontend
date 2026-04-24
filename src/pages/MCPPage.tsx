import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
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
  BookOpen,
  Brain,
  Globe,
  Workflow,
  Clock,
  MessageSquare,
  Bug,
  Copy,
  ExternalLink,
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
import { LiminalGlyph } from '../components/liminal/LiminalGlyph'

// ─── Recipe catalog ───────────────────────────────────────────────────────────
//
// Each recipe carries a `setup` object with intro + numbered steps + docs URL.
// The UI renders this inline when the recipe is selected so users don't need
// to leave the dashboard to figure out installation.

interface SetupStep {
  text: string
  /** Optional shell command to run. Rendered as a copy-able code block. */
  code?: string
}

interface McpRecipe {
  id: string
  name: string
  description: string
  category: 'productivity' | 'dev' | 'web' | 'memory' | 'reasoning' | 'utility'
  icon: RecipeIcon
  transport: 'stdio' | 'http'
  command: string[]
  prefix_tools: boolean
  env: Record<string, string>
  /** "archived" → upstream maintainers stopped updating. Package still runs via
   *  npm cache but no security/feature updates. UI shows a small warning. */
  status?: 'active' | 'archived'
  setup: {
    intro: string
    steps: SetupStep[]
    docs_url?: string
  }
  /** When present, an "ask the agent to install this for me" action is shown
   *  alongside Add. The text is delivered as the first user message in a new
   *  chat — the agent works through the steps using its shell tool. Should
   *  include verify-before-execute checks and explicit failure stop conditions
   *  so the agent doesn't barrel through a broken environment. */
  install_prompt?: string
}

const MCP_RECIPES: McpRecipe[] = [
  // ── Productivity ─────────────────────────────────────────────
  {
    id: 'google-workspace',
    name: 'Google Workspace',
    description: 'Gmail, Calendar, Drive, Docs, Sheets',
    category: 'productivity',
    icon: 'mail',
    transport: 'stdio',
    command: ['uvx', 'workspace-mcp', '--tool-tier', 'core'],
    prefix_tools: true,
    env: { GOOGLE_OAUTH_CLIENT_ID: '', GOOGLE_OAUTH_CLIENT_SECRET: '' },
    setup: {
      intro: 'reads and writes across Gmail, Calendar, Drive, Docs, Sheets using OAuth. Heaviest of the catalog — needs Python 3.10+ and a Google Cloud project.',
      steps: [
        { text: '1. install uv if you don\'t have it', code: 'curl -LsSf https://astral.sh/uv/install.sh | sh' },
        { text: '2. go to console.cloud.google.com → create a project (or pick existing)' },
        { text: '3. APIs & Services → Library → enable Calendar, Drive, Gmail, Docs, Sheets APIs' },
        { text: '4. APIs & Services → Credentials → Create OAuth client ID → Desktop app' },
        { text: '5. copy client_id and client_secret into the env vars below — uvx will fetch the package on first use' },
      ],
      docs_url: 'https://github.com/taylorwilsdon/google_workspace_mcp',
    },
  },
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    description: 'Calendar events, scheduling, free/busy queries',
    category: 'productivity',
    icon: 'calendar',
    transport: 'stdio',
    command: ['npx', '-y', '@cocal/google-calendar-mcp'],
    prefix_tools: true,
    env: { GOOGLE_OAUTH_CREDENTIALS: '' },
    setup: {
      intro: 'lighter-weight than Workspace if you only need Calendar. Node.js + a one-time OAuth setup.',
      steps: [
        { text: '1. go to console.cloud.google.com → create or pick a project' },
        { text: '2. APIs & Services → Library → enable "Google Calendar API"' },
        { text: '3. APIs & Services → OAuth consent screen → add your email as a Test User' },
        { text: '4. APIs & Services → Credentials → Create OAuth client ID → Desktop app (this is REQUIRED — Web app won\'t work for npx)' },
        { text: '5. download the credentials JSON, save it somewhere stable (e.g. ~/.daimon/gcp-oauth.json)' },
        { text: '6. paste the absolute path into GOOGLE_OAUTH_CREDENTIALS below' },
      ],
      docs_url: 'https://github.com/nspady/google-calendar-mcp',
    },
  },
  {
    id: 'obsidian',
    name: 'Obsidian',
    description: 'Read, search and edit notes in your Obsidian vault',
    category: 'productivity',
    icon: 'book',
    transport: 'stdio',
    command: ['uvx', 'mcp-obsidian'],
    prefix_tools: true,
    env: { OBSIDIAN_API_KEY: '', OBSIDIAN_HOST: '127.0.0.1', OBSIDIAN_PORT: '27124' },
    setup: {
      intro: 'connects to a running Obsidian instance via the Local REST API community plugin.',
      steps: [
        { text: '1. install uv via the official installer (one-time)', code: 'curl -LsSf https://astral.sh/uv/install.sh | sh' },
        { text: '2. open Obsidian → Settings → Community plugins → install "Local REST API"' },
        { text: '3. enable the plugin, copy the generated API key from its settings panel' },
        { text: '4. paste it into OBSIDIAN_API_KEY below — host/port stay default unless you changed them' },
      ],
      docs_url: 'https://github.com/MarkusPfundstein/mcp-obsidian',
    },
    install_prompt: `You are going to install the uv prerequisite for the Obsidian MCP server.

Goal: have \`uvx\` available so daimon can spawn \`uvx mcp-obsidian\` on demand.

The Obsidian Local REST API plugin install is GUI-only — I'll handle it after, you just prep the shell side.

Verify, then act, IN ORDER. STOP on first failure with a clear explanation.

1. Check if uv is already installed: \`which uvx\`. If it prints a path, skip to step 4.

2. If uv is missing, install it via the official installer (no sudo). CONFIRM with me before running:
   \`curl -LsSf https://astral.sh/uv/install.sh | sh\`

3. Verify with absolute path (PATH may not have refreshed yet):
   \`~/.local/bin/uvx --version\`
   Tell me to \`source ~/.bashrc\` (or open a new shell) so future commands find it.

4. Pre-fetch mcp-obsidian so the first MCP spawn is instant. uvx auto-installs packages on first use:
   \`uvx mcp-obsidian --help\`
   This downloads the package + dependencies. May take 10-30 seconds. If it errors with "module not found" or similar, that's fine — uvx may need the OBSIDIAN_API_KEY env var even for --help. Try instead:
   \`uv tool install mcp-obsidian\` (creates a persistent install)

5. Tell me what's left for me to do manually:
   - Open Obsidian → Settings → Community plugins → Browse → install "Local REST API"
   - Enable the plugin
   - Open the plugin's settings panel → copy the auto-generated API key
   - Come back to daimon, add Obsidian from the catalog, paste the key in OBSIDIAN_API_KEY

Use shell_exec. Confirm before step 2 (curl installer). Read-only checks (which, --version, --help) don't need confirmation.

NEVER use \`pip install mcp-obsidian\` or \`sudo apt install\` for any of these. PEP 668 blocks system pip on modern distros, and uv is the right tool here.`,
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Read channels, send messages, search history',
    category: 'productivity',
    icon: 'message',
    transport: 'stdio',
    command: ['npx', '-y', '@modelcontextprotocol/server-slack'],
    prefix_tools: true,
    status: 'archived',
    env: { SLACK_BOT_TOKEN: '', SLACK_TEAM_ID: '' },
    setup: {
      intro: 'archived May 2025 — still works via npm cache, no longer maintained. Bot tokens (xoxb-) only; user tokens not supported.',
      steps: [
        { text: '1. create a Slack app at api.slack.com/apps → "From scratch"' },
        { text: '2. OAuth & Permissions → Bot Token Scopes → add: channels:history, channels:read, chat:write, reactions:write, users:read, users:read.email, search:read' },
        { text: '3. Install App → install to workspace → copy the Bot User OAuth Token starting with xoxb- into SLACK_BOT_TOKEN' },
        { text: '4. find your workspace ID (T...): visit any Slack URL like slack.com/client/T0XXXXX, or in workspace settings → about, copy into SLACK_TEAM_ID' },
        { text: '5. (optional) SLACK_CHANNEL_IDS — comma-separated list to limit which channels the agent can touch' },
      ],
      docs_url: 'https://github.com/modelcontextprotocol/servers-archived/tree/main/src/slack',
    },
  },

  // ── Dev / Code ───────────────────────────────────────────────
  {
    id: 'github',
    name: 'GitHub (legacy)',
    description: 'Issues, PRs, repos, CI status — official archived',
    category: 'dev',
    icon: 'github',
    transport: 'stdio',
    command: ['npx', '-y', '@modelcontextprotocol/server-github'],
    prefix_tools: true,
    status: 'archived',
    env: { GITHUB_PERSONAL_ACCESS_TOKEN: '' },
    setup: {
      intro: 'archived May 2025 — replaced by GitHub\'s OFFICIAL `github/github-mcp-server` (Docker/Go). This npm version still works via npm cache and is the simplest to wire if you don\'t want Docker.',
      steps: [
        { text: '1. create a fine-grained Personal Access Token at github.com/settings/tokens?type=beta' },
        { text: '2. set token expiration + repository access (all repos or selected)' },
        { text: '3. grant scopes you need: Contents read/write, Issues read/write, Pull requests read/write, Actions read (for CI status)' },
        { text: '4. paste the token (github_pat_...) in GITHUB_PERSONAL_ACCESS_TOKEN below' },
        { text: '5. for active maintenance: see github.com/github/github-mcp-server (Docker-based, GitHub-maintained)' },
      ],
      docs_url: 'https://github.com/modelcontextprotocol/servers-archived/tree/main/src/github',
    },
  },
  {
    id: 'filesystem',
    name: 'Filesystem',
    description: 'Sandboxed file read/write access',
    category: 'dev',
    icon: 'folder',
    transport: 'stdio',
    command: ['npx', '-y', '@modelcontextprotocol/server-filesystem', '/tmp'],
    prefix_tools: false,
    env: {},
    setup: {
      intro: 'lets the agent read/write within one or more directories. The sandbox is the list of paths passed as args after the package name. Multiple paths supported.',
      steps: [
        { text: '1. requires Node.js (npm/npx). Check with', code: 'node --version' },
        { text: '2. default sandbox is /tmp (safe for demos). To expose other dirs, edit the command in your config.yaml after adding — change the args to e.g.', code: 'npx -y @modelcontextprotocol/server-filesystem /home/marxdr/projects /home/marxdr/notes' },
        { text: '3. the agent can ONLY touch paths inside those args. Anything else is blocked by the server.' },
      ],
      docs_url: 'https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem',
    },
  },

  // ── Web ──────────────────────────────────────────────────────
  {
    id: 'scrapling',
    name: 'Scrapling',
    description: 'Adaptive web scraping with anti-bot bypass',
    category: 'web',
    icon: 'spider',
    transport: 'stdio',
    command: ['scrapling', 'mcp'],
    prefix_tools: true,
    env: {},
    setup: {
      intro: 'full-featured scraper that handles JS-heavy pages, captchas, and element re-location when sites change. No API keys needed. Heavier than Fetch — installs Playwright + bundled browsers (~250 MB).',
      steps: [
        { text: '1. install uv if you don\'t have it (one-time, no sudo)', code: 'curl -LsSf https://astral.sh/uv/install.sh | sh' },
        { text: '2. install scrapling persistently with uv (no sudo)', code: "uv tool install 'scrapling[fetchers]'" },
        { text: '3. download Playwright browsers + OS deps. Scrapling runs `playwright install --with-deps` under the hood, which needs sudo to install libs like libgtk/libnss. Use the absolute path so sudo finds the binary:', code: 'sudo $(which scrapling) install' },
        { text: '4. verify it works (no sudo)', code: 'scrapling mcp --help' },
        { text: '5. add this server — daimon will spawn `scrapling mcp` over stdio' },
      ],
      docs_url: 'https://scrapling.readthedocs.io/en/latest/',
    },
    // No install_prompt: step 3 needs interactive sudo (password prompt), and
    // an LLM agent over shell_exec has no TTY to feed the password. The user
    // runs the 4 commands above once when convenient.
  },
  {
    id: 'brave-search',
    name: 'Brave Search',
    description: 'Privacy-first web + news search via API',
    category: 'web',
    icon: 'search',
    transport: 'stdio',
    command: ['npx', '-y', '@modelcontextprotocol/server-brave-search'],
    prefix_tools: false,
    status: 'archived',
    env: { BRAVE_API_KEY: '' },
    setup: {
      intro: 'archived May 2025 — still works via npm cache. Fast keyword search via Brave\'s privacy-first API. Free tier: 2k queries/month, 1 query/sec.',
      steps: [
        { text: '1. requires Node.js (npm/npx). Check', code: 'node --version' },
        { text: '2. sign up at api.search.brave.com (the docs page is brave.com/search/api but signup goes through api.search.brave.com)' },
        { text: '3. dashboard → API Keys → "Add API Key" → free "Data for AI" plan' },
        { text: '4. copy the key (BSA...) into BRAVE_API_KEY below' },
      ],
      docs_url: 'https://api.search.brave.com/app/documentation',
    },
  },
  {
    id: 'fetch',
    name: 'Fetch',
    description: 'Pull a URL and convert to clean markdown',
    category: 'web',
    icon: 'globe',
    transport: 'stdio',
    command: ['uvx', 'mcp-server-fetch'],
    prefix_tools: false,
    env: {},
    setup: {
      intro: 'simpler alternative to Scrapling for plain articles, blog posts, and docs sites. No API keys. By default respects robots.txt for model-initiated requests.',
      steps: [
        { text: '1. install uv via the official installer (no sudo, puts uvx on PATH)', code: 'curl -LsSf https://astral.sh/uv/install.sh | sh' },
        { text: '2. verify uvx is available (open a new shell or source ~/.bashrc first)', code: 'which uvx' },
        { text: '3. add — daimon spawns `uvx mcp-server-fetch` on demand. uvx fetches the package first time, caches it after.' },
        { text: '4. (optional) edit the command in config.yaml to add `--ignore-robots-txt` if you need to scrape sites that block crawlers, or `--user-agent="..."` for custom UA' },
      ],
      docs_url: 'https://github.com/modelcontextprotocol/servers/tree/main/src/fetch',
    },
    install_prompt: `You are going to install the uv prerequisite for the Fetch MCP server.

Goal: have \`uvx mcp-server-fetch\` runnable from any shell.

Verify, then act, IN ORDER. STOP on first failure with a clear explanation.

1. Check if uv is already installed: \`which uvx\`. If it prints a path, skip to step 4.

2. If uv is missing, install it via the official installer (no sudo). CONFIRM with me before running:
   \`curl -LsSf https://astral.sh/uv/install.sh | sh\`

3. The installer puts uvx in ~/.local/bin/. Verify with absolute path:
   \`~/.local/bin/uvx --version\`
   Tell me to \`source ~/.bashrc\` (or open a new shell) so PATH picks it up.

4. Pre-fetch mcp-server-fetch so the first MCP call is instant:
   \`uvx mcp-server-fetch --help\`
   This downloads + caches the package. Takes 5-15 seconds.

5. Tell me I can now add Fetch from the catalog. No env vars needed for basic use.

Use shell_exec. Confirm before step 2 (curl installer). Read-only checks (which, --version, --help) don't need confirmation.

NEVER use \`pip install mcp-server-fetch\` or \`sudo apt install\` — PEP 668 blocks system pip on modern distros. uv is the only path here.`,
  },

  // ── Memory / Reasoning ──────────────────────────────────────
  {
    id: 'memory',
    name: 'Memory (knowledge graph)',
    description: 'Persistent entities + relationships across sessions',
    category: 'memory',
    icon: 'brain',
    transport: 'stdio',
    command: ['npx', '-y', '@modelcontextprotocol/server-memory'],
    prefix_tools: true,
    env: {},
    setup: {
      intro: 'a separate, structured knowledge graph (nodes + edges) the agent can grow. Complements daimon\'s built-in memory — useful for explicit entity tracking. Storage is a local JSONL file (default: memory.jsonl in the server\'s working dir).',
      steps: [
        { text: '1. requires Node.js. Check', code: 'node --version' },
        { text: '2. add — npx fetches the package on first use, caches after' },
        { text: '3. (optional) override the storage location: set MEMORY_FILE_PATH env var to an absolute path like ~/.daimon/memory.jsonl' },
      ],
      docs_url: 'https://github.com/modelcontextprotocol/servers/tree/main/src/memory',
    },
  },
  {
    id: 'sequential-thinking',
    name: 'Sequential Thinking',
    description: 'Structured chain-of-thought tool',
    category: 'reasoning',
    icon: 'workflow',
    transport: 'stdio',
    command: ['npx', '-y', '@modelcontextprotocol/server-sequential-thinking'],
    prefix_tools: false,
    env: {},
    setup: {
      intro: 'gives the model an explicit "think step by step" tool — useful for multi-step problem solving without flooding the conversation with reasoning text. Most useful for non-reasoning models (claude-haiku, gpt-4o-mini).',
      steps: [
        { text: '1. requires Node.js. Check', code: 'node --version' },
        { text: '2. add — npx fetches the package on first use, no env vars needed' },
      ],
      docs_url: 'https://github.com/modelcontextprotocol/servers/tree/main/src/sequentialthinking',
    },
  },

  // ── Utility ──────────────────────────────────────────────────
  {
    id: 'time',
    name: 'Time',
    description: 'Timezone conversions and date arithmetic',
    category: 'utility',
    icon: 'clock',
    transport: 'stdio',
    command: ['uvx', 'mcp-server-time'],
    prefix_tools: false,
    env: {},
    setup: {
      intro: 'small but useful — LLMs are notoriously bad at timezone math. Python server via uv. Auto-detects your system timezone.',
      steps: [
        { text: '1. install uv if you don\'t have it', code: 'curl -LsSf https://astral.sh/uv/install.sh | sh' },
        { text: '2. add — daimon spawns `uvx mcp-server-time` on demand' },
        { text: '3. (optional) override the detected timezone by editing the command in config.yaml to add e.g. `--local-timezone=America/New_York`' },
      ],
      docs_url: 'https://github.com/modelcontextprotocol/servers/tree/main/src/time',
    },
    install_prompt: `You are going to install the uv prerequisite for the Time MCP server.

Goal: have \`uvx mcp-server-time\` runnable from any shell.

Verify, then act, IN ORDER. STOP on first failure.

1. Check if uv is already installed: \`which uvx\`. If yes, skip to step 4.

2. If uv is missing, install it (no sudo). CONFIRM with me before running:
   \`curl -LsSf https://astral.sh/uv/install.sh | sh\`

3. Verify with absolute path (PATH may not have refreshed):
   \`~/.local/bin/uvx --version\`
   Tell me to \`source ~/.bashrc\` so future commands find uvx.

4. Pre-fetch the Time package:
   \`uvx mcp-server-time --help\`

5. Tell me I can add Time from the catalog. No env vars; auto-detects timezone.

Use shell_exec. Confirm before step 2. Read-only checks need no confirmation.

NEVER use \`pip install mcp-server-time\` or system apt — PEP 668 issues. uv only.`,
  },
]

type RecipeIcon =
  | 'mail' | 'calendar' | 'github' | 'folder' | 'search'
  | 'book' | 'message' | 'spider' | 'globe'
  | 'brain' | 'workflow' | 'clock'

const RECIPE_ICONS: Record<RecipeIcon, React.ElementType> = {
  mail: Mail,
  calendar: Calendar,
  github: Github,
  folder: Folder,
  search: Search,
  book: BookOpen,
  message: MessageSquare,
  spider: Bug,
  globe: Globe,
  brain: Brain,
  workflow: Workflow,
  clock: Clock,
}

// Group recipes by category for the catalog UI.
const RECIPES_BY_CATEGORY: Record<McpRecipe['category'], McpRecipe[]> = MCP_RECIPES.reduce(
  (acc, r) => {
    acc[r.category] = [...(acc[r.category] ?? []), r]
    return acc
  },
  {} as Record<McpRecipe['category'], McpRecipe[]>,
)

const CATEGORY_LABEL: Record<McpRecipe['category'], string> = {
  productivity: 'productivity',
  dev: 'dev + code',
  web: 'web',
  memory: 'memory',
  reasoning: 'reasoning',
  utility: 'utility',
}

// ─── Setup steps panel ───────────────────────────────────────────────────────
//
// Inline expansion that appears below a selected catalog recipe. Renders the
// recipe's intro + numbered steps (each with optional copy-able code block) +
// a docs link. Designed to replace "go google how to install this" with a
// self-contained guide right next to the form.

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    } catch {
      // Clipboard API can fail in non-secure contexts; silently no-op.
    }
  }
  return (
    <div
      className="font-mono"
      style={{
        position: 'relative',
        marginTop: 6,
        background: 'var(--bg-deep)',
        border: '1px solid var(--line)',
        borderRadius: 4,
        padding: '8px 36px 8px 12px',
        fontSize: 12,
        color: 'var(--ink-soft)',
        overflowX: 'auto',
        whiteSpace: 'pre',
      }}
    >
      {code}
      <button
        type="button"
        onClick={handleCopy}
        aria-label="Copy to clipboard"
        style={{
          position: 'absolute',
          top: 6,
          right: 6,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: copied ? 'var(--accent)' : 'var(--ink-muted)',
          padding: 4,
          transition: 'color 0.15s',
        }}
      >
        {copied ? <Check size={13} /> : <Copy size={13} />}
      </button>
    </div>
  )
}

function SetupSteps({ recipe }: { recipe: McpRecipe }) {
  return (
    <div
      style={{
        marginTop: 14,
        padding: '14px 16px',
        background: 'var(--bg-deep)',
        border: '1px solid var(--line)',
        borderRadius: 6,
      }}
    >
      <p
        className="font-serif italic"
        style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 0, marginBottom: 12, lineHeight: 1.5 }}
      >
        {recipe.setup.intro}
      </p>

      <ol style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        {recipe.setup.steps.map((step, i) => (
          <li key={i} style={{ marginBottom: 10 }}>
            <div className="font-sans" style={{ fontSize: 12.5, color: 'var(--ink)', lineHeight: 1.5 }}>
              {step.text}
            </div>
            {step.code && <CodeBlock code={step.code} />}
          </li>
        ))}
      </ol>

      {recipe.setup.docs_url && (
        <a
          href={recipe.setup.docs_url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono inline-flex items-center"
          style={{
            gap: 4,
            fontSize: 11,
            letterSpacing: 0.4,
            color: 'var(--accent)',
            marginTop: 4,
            textDecoration: 'none',
          }}
        >
          official docs <ExternalLink size={11} />
        </a>
      )}
    </div>
  )
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

  // The List endpoint can't probe MCP processes (they only run on agent boot,
  // not on every list call), so server.connected is always false at fetch time.
  // After a manual Test, the local result IS authoritative — surface it on
  // the badge so the user doesn't see a contradictory "disconnected" label
  // right next to a green "Connected — 14 tools" pill.
  const effectiveConnected =
    testState.result?.connected ?? server.connected
  const effectiveToolCount =
    testState.result?.connected ? (testState.result.tools?.length ?? 0) : server.tool_count
  // Until the user Tests at least once, there's no way to verify state,
  // so call it "untested" rather than the misleading "disconnected".
  const statusLabel = testState.result
    ? (effectiveConnected ? 'connected' : 'disconnected')
    : 'untested'
  const statusVariant: 'success' | 'error' | 'default' = testState.result
    ? (effectiveConnected ? 'success' : 'error')
    : 'default'

  return (
    <div className="border border-border rounded-md p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Server size={16} className="text-text-secondary shrink-0" strokeWidth={1.75} />
          <span className="font-medium text-sm text-text-primary truncate">{server.name}</span>
          <Badge variant={server.transport === 'stdio' ? 'default' : 'accent'}>
            {server.transport}
          </Badge>
          <Badge variant={statusVariant}>{statusLabel}</Badge>
          {effectiveConnected && effectiveToolCount > 0 && (
            <span className="text-xs text-text-secondary">{effectiveToolCount} tools</span>
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
          <div className="flex flex-col" style={{ gap: 18 }}>
            {(Object.keys(RECIPES_BY_CATEGORY) as Array<McpRecipe['category']>).map((cat) => (
              <div key={cat}>
                <div
                  className="font-mono"
                  style={{
                    fontSize: 10.5,
                    letterSpacing: 0.7,
                    textTransform: 'uppercase',
                    color: 'var(--ink-muted)',
                    marginBottom: 8,
                  }}
                >
                  {CATEGORY_LABEL[cat]}
                </div>
                <div className="grid grid-cols-1" style={{ gap: 6 }}>
                  {RECIPES_BY_CATEGORY[cat].map(recipe => {
                    const IconComp = RECIPE_ICONS[recipe.icon]
                    const isSelected = selectedRecipe === recipe.id
                    return (
                      <button
                        key={recipe.id}
                        type="button"
                        onClick={() => handleRecipeSelect(recipe.id)}
                        className="w-full text-left flex items-start"
                        style={{
                          gap: 12,
                          padding: '12px 14px',
                          background: isSelected
                            ? 'color-mix(in srgb, var(--accent) 8%, transparent)'
                            : 'var(--bg-elev)',
                          border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--line)'}`,
                          borderLeft: isSelected ? '2px solid var(--accent)' : '1px solid var(--line)',
                          borderRadius: 6,
                          cursor: 'pointer',
                          transition: 'border-color 0.15s, background 0.15s',
                        }}
                      >
                        <div
                          className="shrink-0"
                          style={{
                            marginTop: 2,
                            padding: 6,
                            borderRadius: 4,
                            background: isSelected
                              ? 'var(--accent)'
                              : 'var(--bg-deep)',
                            color: isSelected ? 'var(--bg-elev)' : 'var(--ink-muted)',
                          }}
                        >
                          <IconComp size={13} strokeWidth={1.75} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center" style={{ gap: 8 }}>
                            <span style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 500 }}>
                              {recipe.name}
                            </span>
                            {recipe.status === 'archived' && (
                              <span
                                className="font-mono"
                                style={{
                                  fontSize: 9.5,
                                  letterSpacing: 0.6,
                                  textTransform: 'uppercase',
                                  color: 'var(--amber)',
                                  background: 'color-mix(in srgb, var(--amber) 10%, transparent)',
                                  border: '1px solid color-mix(in srgb, var(--amber) 25%, transparent)',
                                  padding: '1px 5px',
                                  borderRadius: 2,
                                }}
                                title="Upstream maintainers stopped updates May 2025. Package still works via npm cache."
                              >
                                legacy
                              </span>
                            )}
                          </div>
                          <div
                            className="font-serif italic"
                            style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 2 }}
                          >
                            {recipe.description}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}

            {/* Selected recipe — rich setup + env vars + add button */}
            {selectedRecipeData && (
              <div
                style={{
                  marginTop: 4,
                  paddingTop: 16,
                  borderTop: '1px solid var(--line)',
                }}
              >
                <SetupSteps recipe={selectedRecipeData} />

                {Object.keys(selectedRecipeData.env).length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <div
                      className="font-mono"
                      style={{
                        fontSize: 10.5,
                        letterSpacing: 0.7,
                        textTransform: 'uppercase',
                        color: 'var(--ink-muted)',
                        marginBottom: 8,
                      }}
                    >
                      env vars
                    </div>
                    <EnvEditor value={recipeEnv} onChange={setRecipeEnv} />
                  </div>
                )}

                {/* Action row — right-aligned, content-sized buttons. Hierarchy
                    is filled-vs-ghost (matches the Wizard's back/continue
                    pattern), not full-width vs link. Same height/padding so
                    they read as a coherent pair. */}
                <div
                  className="flex items-center justify-end"
                  style={{ gap: 8, marginTop: 16, flexWrap: 'wrap' }}
                >
                  {selectedRecipeData.install_prompt && (
                    <button
                      type="button"
                      onClick={() => {
                        const prompt = selectedRecipeData.install_prompt ?? ''
                        const url = `/chat?prompt=${encodeURIComponent(prompt)}`
                        window.open(url, '_blank', 'noopener,noreferrer')
                      }}
                      title="Opens a new chat where the agent verifies your environment and runs the install commands"
                      className="font-sans inline-flex items-center"
                      style={{
                        gap: 6,
                        background: 'transparent',
                        color: 'var(--ink-soft)',
                        border: '1px solid var(--line)',
                        borderRadius: 6,
                        padding: '8px 14px',
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'border-color 0.15s, color 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--line-strong)'
                        e.currentTarget.style.color = 'var(--ink)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--line)'
                        e.currentTarget.style.color = 'var(--ink-soft)'
                      }}
                    >
                      have the agent install it
                      <ExternalLink size={11} strokeWidth={2} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleAddRecipe}
                    disabled={!selectedRecipe || isAdding}
                    className="font-sans inline-flex items-center"
                    style={{
                      gap: 6,
                      background: 'var(--accent)',
                      color: 'var(--bg-elev)',
                      border: 'none',
                      borderRadius: 6,
                      padding: '8px 14px',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: !selectedRecipe || isAdding ? 'not-allowed' : 'pointer',
                      opacity: !selectedRecipe || isAdding ? 0.5 : 1,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <Plus size={13} strokeWidth={2} />
                    {isAdding ? 'adding…' : `add ${selectedRecipeData.name.toLowerCase()}`}
                  </button>
                </div>
              </div>
            )}

            {!selectedRecipeData && (
              <p
                className="font-serif italic text-center"
                style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 4 }}
              >
                pick one to see setup steps.
              </p>
            )}
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
    <div style={{ padding: '28px 32px 40px', maxWidth: 760, margin: '0 auto' }}>
      {/* Preamble — matches Memory / Overview / Settings / Conversations */}
      <div style={{ marginBottom: 24 }}>
        <div className="flex items-baseline" style={{ gap: 14, marginBottom: 6 }}>
          <LiminalGlyph size={20} animate />
          <h1
            className="font-serif"
            style={{
              margin: 0,
              fontSize: 28,
              fontWeight: 500,
              color: 'var(--ink)',
              letterSpacing: -0.6,
            }}
          >
            <span className="italic" style={{ color: 'var(--accent)', fontWeight: 400 }}>
              extend me
            </span>
          </h1>
        </div>
        <p
          className="font-serif italic"
          style={{
            fontSize: 14.5,
            color: 'var(--ink-soft)',
            maxWidth: 640,
            lineHeight: 1.55,
            marginLeft: 34,
            marginTop: 0,
          }}
        >
          plug in MCP servers — Obsidian, GitHub, Slack, scrapers — and the
          agent gains their tools at every turn.
        </p>
      </div>

      {/* Action row */}
      <div className="flex items-center justify-end" style={{ marginBottom: 18 }}>
        <Button onClick={() => setShowAddForm(v => !v)}>
          <Plus size={14} strokeWidth={1.75} />
          {showAddForm ? 'close' : 'add server'}
        </Button>
      </div>

      {/* Add form */}
      {showAddForm && (
        <div style={{ marginBottom: 22 }}>
          <AddServerForm onAdd={addServer} isAdding={isAdding} />
        </div>
      )}

      {/* Server list */}
      {isLoading ? (
        <div
          className="font-serif italic"
          style={{ fontSize: 13, color: 'var(--ink-muted)', padding: '20px 0' }}
        >
          loading servers…
        </div>
      ) : servers.length === 0 ? (
        <div
          className="text-center"
          style={{
            padding: '48px 24px',
            background: 'var(--bg-elev)',
            border: '1px dashed var(--line)',
            borderRadius: 6,
          }}
        >
          <Server size={22} style={{ color: 'var(--ink-faint)', margin: '0 auto 10px' }} strokeWidth={1.5} />
          <p
            className="font-serif italic"
            style={{ fontSize: 14, color: 'var(--ink-muted)', margin: 0 }}
          >
            no servers wired in yet.
          </p>
          <p
            className="font-mono"
            style={{
              fontSize: 11,
              color: 'var(--ink-faint)',
              marginTop: 6,
              letterSpacing: 0.4,
            }}
          >
            click "add server" to start.
          </p>
        </div>
      ) : (
        <div className="flex flex-col" style={{ gap: 10 }}>
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
