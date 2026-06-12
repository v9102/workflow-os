"use client"

import { Loader2, CheckCircle, XCircle, Clock, Timer } from "lucide-react"

interface AgentActivity {
  agent_name: string
  status: string
  message: string
  timestamp: string
  elapsed_seconds?: number | null
}

interface AgentFeedProps {
  activities: AgentActivity[]
  isProcessing: boolean
}

const AGENT_ORDER = ["ExtractionAgent", "RiskAgent", "AssignmentAgent", "ReportingAgent", "ValidatorAgent"]

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "running":
      return <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: "var(--color-accent)" }} />
    case "completed":
      return <CheckCircle className="w-3.5 h-3.5" style={{ color: "var(--color-success)" }} />
    case "failed":
      return <XCircle className="w-3.5 h-3.5" style={{ color: "var(--color-danger)" }} />
    default:
      return <Clock className="w-3.5 h-3.5" style={{ color: "var(--color-ink-muted)" }} />
  }
}

function elapsedColor(seconds: number): string {
  if (seconds < 5) return "var(--color-success)"
  if (seconds < 15) return "var(--color-warning)"
  return "var(--color-danger)"
}

export function AgentFeed({ activities, isProcessing }: AgentFeedProps) {
  const sorted = [...activities].sort(
    (a, b) => AGENT_ORDER.indexOf(a.agent_name) - AGENT_ORDER.indexOf(b.agent_name)
  )

  const waiting = AGENT_ORDER.filter(
    name => !sorted.some(a => a.agent_name === name)
  )

  const hasFailures = sorted.some(a => a.status === "failed")

  return (
    <div
      className="rounded-2xl border overflow-hidden transition-all duration-300"
      style={{
        backgroundColor: "var(--color-surface)",
        borderColor: "var(--color-border)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.02)",
      }}
    >
      <div className="px-5 py-3.5 border-b flex items-center justify-between" style={{ borderColor: "var(--color-border)" }}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{
            backgroundColor: hasFailures ? "var(--color-danger)" : isProcessing ? "var(--color-accent)" : "var(--color-success)",
            animation: isProcessing ? "pulseSoft 1.5s ease-in-out infinite" : "none",
          }} />
          <span className="text-xs font-medium" style={{ color: "var(--color-ink-muted)" }}>
            {isProcessing ? "Agents running…" : sorted.length > 0 ? "All agents complete" : "No activity yet"}
          </span>
        </div>
        {sorted.length > 0 && (
          <span className="text-2xs" style={{ color: "var(--color-ink-muted)" }}>
            {sorted.filter(a => a.elapsed_seconds).length} timed
          </span>
        )}
      </div>

      <div className="p-2">
        {activities.length === 0 && isProcessing && (
          <div className="flex items-center gap-2 px-3 py-4 text-xs" style={{ color: "var(--color-ink-muted)" }}>
            <Loader2 className="w-3.5 h-3.5" style={{ color: "var(--color-accent)" }} />
            Waiting for agents to start…
          </div>
        )}

        {sorted.map((activity, index) => (
          <div
            key={index}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors"
            style={{
              animation: `slideUp 0.3s ease-out ${index * 0.08}s both`,
            }}
          >
            <div className="w-6 h-6 flex items-center justify-center rounded-full" style={{
              backgroundColor: activity.status === "running"
                ? "var(--color-accent-subtle)"
                : activity.status === "completed"
                  ? "rgba(16, 185, 129, 0.1)"
                  : activity.status === "failed"
                    ? "rgba(244, 63, 94, 0.1)"
                    : "transparent",
            }}>
              <StatusIcon status={activity.status} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate flex items-center gap-2" style={{ color: "var(--color-ink)" }}>
                {activity.agent_name.replace("Agent", "")}
                {activity.elapsed_seconds != null && (
                  <span className="inline-flex items-center gap-0.5 text-2xs font-medium px-1 py-0.5 rounded"
                    style={{
                      backgroundColor: `${elapsedColor(activity.elapsed_seconds)}15`,
                      color: elapsedColor(activity.elapsed_seconds),
                    }}
                  >
                    <Timer className="w-2.5 h-2.5" />
                    {activity.elapsed_seconds.toFixed(1)}s
                  </span>
                )}
              </p>
              <p className="text-xs truncate" style={{ color: "var(--color-ink-muted)" }}>
                {activity.message}
              </p>
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
