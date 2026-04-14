import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from './contexts/ThemeContext'
import { SetupProvider } from './contexts/SetupContext'
import { SetupGuard } from './components/SetupGuard'
import { AuthGate } from './components/AuthGate'
import { AppLayout } from './components/layout/AppLayout'
import { OverviewPage } from './pages/OverviewPage'
import { MetricsPage } from './pages/MetricsPage'
import { ConversationsPage } from './pages/ConversationsPage'
import { ConversationDetailPage } from './pages/ConversationDetailPage'
import { MemoryPage } from './pages/MemoryPage'
import { ChatPage } from './pages/ChatPage'
import { SettingsPage } from './pages/SettingsPage'
import { ToolsPage } from './pages/ToolsPage'
import { LogsPage } from './pages/LogsPage'
import { MCPPage } from './pages/MCPPage'
import { useMetricsSocket } from './hooks/useMetricsSocket'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
})

// Maintains a persistent WS connection to /ws/metrics and pushes
// updates into TanStack Query cache so Overview auto-refreshes.
function MetricsSyncSocket() {
  useMetricsSocket()
  return null
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
      <SetupProvider>
      <SetupGuard>
      <AuthGate>
      <BrowserRouter>
        <MetricsSyncSocket />
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<OverviewPage />} />
            <Route path="metrics" element={<MetricsPage />} />
            <Route path="conversations" element={<ConversationsPage />} />
            <Route path="conversations/:id" element={<ConversationDetailPage />} />
            <Route path="memory" element={<MemoryPage />} />
            <Route path="chat" element={<ChatPage />} />
            <Route path="tools" element={<ToolsPage />} />
            <Route path="mcp" element={<MCPPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="logs" element={<LogsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
      </AuthGate>
      </SetupGuard>
      </SetupProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
