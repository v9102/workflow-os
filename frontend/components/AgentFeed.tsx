"use client"

import { Activity, Loader2, CheckCircle, XCircle, Clock, LayoutDashboard } from "lucide-react"

interface AgentActivity {
  agent_name: string
  status: string
  message: string
  timestamp: string
}

interface AgentFeedProps {
  activities: AgentActivity[]
  isProcessing: boolean
}

const AGENT_ORDER = ["ExtractionAgent", "RiskAgent", "AssignmentAgent", "ReportingAgent", "ValidatorAgent"]

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "running":
      return <Loader2 className="w-4 h-4 text-primary-500 animate-spin" />
    case "completed":
      return <CheckCircle className="w-3.5 h-3.5" style={{ color: "var(--color-success)" }} />
    case "failed":
      return <XCircle className="w-3.5 h-3.5" style={{ color: "var(--color-danger)" }} />
    default:
      return <Clock className="w-4 h-4 text-dark-400" />
  }
}

export function AgentFeed({ activities, isProcessing }: AgentFeedProps) {
  const sorted = [...activities].sort(
    (a, b) => AGENT_ORDER.indexOf(a.agent_name) - AGENT_ORDER.indexOf(b.agent_name)
  )

  const waiting = AGENT_ORDER.filter(
    name => !sorted.some(a => a.agent_name === name)
  )

  return (
    <div className="bg-white dark:bg-dark-800 rounded-2xl border border-dark-200 dark:border-dark-700 shadow-sm">
      <div className="flex border-b border-dark-200 dark:border-dark-700">
        <button
          onClick={() => setActiveTab("feed")}
          className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 ${
            activeTab === "feed"
              ? "text-primary-600 dark:text-primary-400 border-b-2 border-primary-500"
              : "text-dark-500 dark:text-dark-400"
          }`}
        >
          <Activity className="w-4 h-4" />
          Agent Feed
        </button>
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 ${
            activeTab === "dashboard"
              ? "text-primary-600 dark:text-primary-400 border-b-2 border-primary-500"
              : "text-dark-500 dark:text-dark-400"
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          Dashboard
        </button>
      </div>

      <div className="p-4 max-h-96 overflow-y-auto space-y-3">
        {activities.length === 0 && isProcessing && (
          <div className="flex items-center gap-2 text-sm text-dark-500 dark:text-dark-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            Waiting for agents to start...
          </div>
        )}

        {activities.map((activity, index) => (
          <div key={index} className="flex items-start gap-3">
            <div className="mt-0.5">
              <StatusIcon status={activity.status} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-dark-900 dark:text-white">{activity.agent_name}</p>
              <p className="text-xs text-dark-500 dark:text-dark-400">{activity.message}</p>
            </div>
          </div>
        ))}

        {isProcessing && waiting.length > 0 && (
          <div className="px-3 py-2.5 text-xs" style={{ color: "var(--color-ink-muted)" }}>
            <span className="animate-pulse-soft">
              {waiting.length} agent{waiting.length > 1 ? "s" : ""} pending…
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
