"use client"

import { ClipboardList, CalendarClock, AlertTriangle, Send, Copy, Check, BarChart3 } from "lucide-react"
import { useState } from "react"

interface DashboardData {
  tasks: Array<{
    id: string
    task: string
    deadline: string | null
    dependencies: string[]
    owner: string | null
    risk: string
    decision: string | null
  }>
  summary: string
  timeline: Array<{ task: string; deadline: string; owner: string; risk: string }>
  validation_issues?: Array<{ task_id: string; issue_type: string; detail: string }>
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

function riskColor(risk: string): string {
  switch (risk) {
    case "High": return "var(--color-danger)"
    case "Medium": return "var(--color-warning)"
    case "Low": return "var(--color-success)"
    default: return "var(--color-ink-muted)"
  }
}

function riskBg(risk: string): string {
  switch (risk) {
    case "High": return "rgba(244, 63, 94, 0.1)"
    case "Medium": return "rgba(245, 158, 11, 0.1)"
    case "Low": return "rgba(16, 185, 129, 0.1)"
    default: return "transparent"
  }
}

export function ExecutionDashboard({ data, sessionId }: { data: DashboardData; sessionId?: string }) {
  const [copied, setCopied] = useState(false)
  const [exporting, setExporting] = useState<string | null>(null)

  const handleCopyMarkdown = () => {
    const md = `# Meeting Summary\n\n${data.summary}\n\n## Tasks\n| Task | Owner | Deadline | Risk |\n|------|-------|----------|------|\n${data.tasks.map(t => `| ${t.task} | ${t.owner || "—"} | ${t.deadline || "—"} | ${t.risk} |`).join("\n")}`
    navigator.clipboard.writeText(md)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleExportPlanner = async () => {
    if (!sessionId) return
    setExporting("planner")
    try {
      await fetch(`${API_URL}/api/export/planner`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, plan_id: "demo-plan" }),
      })
    } finally { setExporting(null) }
  }

  const handleExportTeams = async () => {
    if (!sessionId) return
    setExporting("teams")
    try {
      await fetch(`${API_URL}/api/export/teams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, team_id: "demo-team", channel_id: "demo-channel" }),
      })
    } finally { setExporting(null) }
  }

  const riskCounts = { High: 0, Medium: 0, Low: 0, Unknown: 0 }
  data.tasks.forEach(t => { riskCounts[t.risk as keyof typeof riskCounts]++ })

  const owners = Array.from(new Set(data.tasks.map(t => t.owner || "Unassigned")))
  const heatmap = owners.map(owner => ({
    owner,
    High: data.tasks.filter(t => (t.owner || "Unassigned") === owner && t.risk === "High").length,
    Medium: data.tasks.filter(t => (t.owner || "Unassigned") === owner && t.risk === "Medium").length,
    Low: data.tasks.filter(t => (t.owner || "Unassigned") === owner && t.risk === "Low").length,
  }))

  const maxRisk = Math.max(...heatmap.flatMap(h => [h.High, h.Medium, h.Low]), 1)

  return (
    <div className="space-y-5">
      {/* Summary */}
      <section
        className="rounded-2xl border p-5 transition-all"
        style={{
          backgroundColor: "var(--color-surface)",
          borderColor: "var(--color-border)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.02)",
        }}
      >
        <h3 className="text-sm font-semibold flex items-center gap-2 mb-3" style={{ color: "var(--color-ink)" }}>
          <ClipboardList className="w-4 h-4" style={{ color: "var(--color-accent)" }} />
          Executive Summary
        </h3>
        <p className="text-sm leading-relaxed" style={{ color: "var(--color-ink-muted)" }}>
          {data.summary}
        </p>
      </section>

      {/* Risk Heatmap */}
      <section
        className="rounded-2xl border p-5 transition-all"
        style={{
          backgroundColor: "var(--color-surface)",
          borderColor: "var(--color-border)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.02)",
        }}
      >
        <h3 className="text-sm font-semibold flex items-center gap-2 mb-5" style={{ color: "var(--color-ink)" }}>
          <BarChart3 className="w-4 h-4" style={{ color: "var(--color-accent)" }} />
          Risk Heatmap
        </h3>

        <div className="space-y-3">
          {heatmap.map((h, i) => (
            <div key={i} className="animate-slide-up" style={{ animationDelay: `${i * 0.06}s` }}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium" style={{ color: "var(--color-ink)" }}>{h.owner}</span>
              </div>
              <div className="flex gap-1 h-6">
                <div
                  className="rounded-md transition-all duration-500"
                  style={{
                    width: `${(h.High / maxRisk) * 100}%`,
                    minWidth: h.High > 0 ? "16px" : "0",
                    backgroundColor: "var(--color-danger)",
                    opacity: h.High > 0 ? 0.8 : 0,
                  }}
                />
                <div
                  className="rounded-md transition-all duration-500"
                  style={{
                    width: `${(h.Medium / maxRisk) * 100}%`,
                    minWidth: h.Medium > 0 ? "16px" : "0",
                    backgroundColor: "var(--color-warning)",
                    opacity: h.Medium > 0 ? 0.8 : 0,
                  }}
                />
                <div
                  className="rounded-md transition-all duration-500"
                  style={{
                    width: `${(h.Low / maxRisk) * 100}%`,
                    minWidth: h.Low > 0 ? "16px" : "0",
                    backgroundColor: "var(--color-success)",
                    opacity: h.Low > 0 ? 0.8 : 0,
                  }}
                />
              </div>
              <div className="flex gap-4 mt-1">
                <span className="text-2xs font-medium" style={{ color: "var(--color-danger)" }}>
                  {h.High > 0 ? `${h.High} High` : ""}
                </span>
                <span className="text-2xs font-medium" style={{ color: "var(--color-warning)" }}>
                  {h.Medium > 0 ? `${h.Medium} Med` : ""}
                </span>
                <span className="text-2xs font-medium" style={{ color: "var(--color-success)" }}>
                  {h.Low > 0 ? `${h.Low} Low` : ""}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-4 mt-4 pt-3 border-t text-xs" style={{ borderColor: "var(--color-border)" }}>
          <span className="flex items-center gap-1.5 font-medium" style={{ color: "var(--color-ink-muted)" }}>
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "var(--color-danger)" }} />
            High: {riskCounts.High}
          </span>
          <span className="flex items-center gap-1.5 font-medium" style={{ color: "var(--color-ink-muted)" }}>
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "var(--color-warning)" }} />
            Med: {riskCounts.Medium}
          </span>
          <span className="flex items-center gap-1.5 font-medium" style={{ color: "var(--color-ink-muted)" }}>
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "var(--color-success)" }} />
            Low: {riskCounts.Low}
          </span>
        </div>
      </section>

      {/* Timeline */}
      <section
        className="rounded-2xl border p-5 transition-all"
        style={{
          backgroundColor: "var(--color-surface)",
          borderColor: "var(--color-border)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.02)",
        }}
      >
        <h3 className="text-sm font-semibold flex items-center gap-2 mb-5" style={{ color: "var(--color-ink)" }}>
          <CalendarClock className="w-4 h-4" style={{ color: "var(--color-accent)" }} />
          Timeline
        </h3>
        {data.timeline.length > 0 ? (
          <div className="space-y-0">
            {data.timeline.map((item, i) => (
              <div
                key={i}
                className="relative flex gap-4 pb-5 last:pb-0 animate-slide-up"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div className="flex flex-col items-center">
                  <div
                    className="w-2.5 h-2.5 rounded-full mt-1"
                    style={{
                      backgroundColor: riskColor(item.risk),
                      boxShadow: "0 0 0 2px var(--color-surface)",
                    }}
                  />
                  {i < data.timeline.length - 1 && (
                    <div className="w-px flex-1 mt-1.5" style={{ backgroundColor: "var(--color-border)" }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: "var(--color-ink)" }}>
                    {item.task}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--color-ink-muted)" }}>
                    {item.owner}
                    {item.deadline ? ` · ${item.deadline}` : ""}
                    <span
                      className="ml-2 px-1.5 py-0.5 rounded-full text-2xs font-medium"
                      style={{
                        backgroundColor: riskBg(item.risk),
                        color: riskColor(item.risk),
                      }}
                    >
                      {item.risk}
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs" style={{ color: "var(--color-ink-muted)" }}>
            No timeline data available.
          </p>
        )}
      </section>

      {/* Task Table */}
      <section
        className="rounded-2xl border p-5 transition-all overflow-x-auto"
        style={{
          backgroundColor: "var(--color-surface)",
          borderColor: "var(--color-border)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.02)",
        }}
      >
        <h3 className="text-sm font-semibold flex items-center gap-2 mb-4" style={{ color: "var(--color-ink)" }}>
          <ClipboardList className="w-4 h-4" style={{ color: "var(--color-accent)" }} />
          Tasks
        </h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-2xs font-semibold" style={{ color: "var(--color-ink-muted)" }}>
              <th className="pb-3 pr-4 font-medium">Task</th>
              <th className="pb-3 pr-4 font-medium">Owner</th>
              <th className="pb-3 pr-4 font-medium">Deadline</th>
              <th className="pb-3 pr-4 font-medium">Risk</th>
              <th className="pb-3 font-medium">Dependencies</th>
            </tr>
          </thead>
          <tbody>
            {data.tasks.map((task, i) => (
              <tr
                key={i}
                className="animate-slide-up"
                style={{ animationDelay: `${i * 0.04}s` }}
              >
                <td
                  className="py-2.5 pr-4 text-sm border-t"
                  style={{ color: "var(--color-ink)", borderColor: "var(--color-border)" }}
                >
                  {task.task}
                </td>
                <td
                  className="py-2.5 pr-4 text-sm border-t"
                  style={{ color: "var(--color-ink-muted)", borderColor: "var(--color-border)" }}
                >
                  {task.owner || "Unassigned"}
                </td>
                <td
                  className="py-2.5 pr-4 text-sm border-t"
                  style={{ color: "var(--color-ink-muted)", borderColor: "var(--color-border)" }}
                >
                  {task.deadline || "—"}
                </td>
                <td className="py-2.5 pr-4 border-t" style={{ borderColor: "var(--color-border)" }}>
                  <span
                    className="px-2 py-0.5 rounded-full text-2xs font-medium"
                    style={{
                      backgroundColor: riskBg(task.risk),
                      color: riskColor(task.risk),
                    }}
                  >
                    {task.risk}
                  </span>
                </td>
                <td
                  className="py-2.5 text-sm border-t"
                  style={{ color: "var(--color-ink-muted)", borderColor: "var(--color-border)" }}
                >
                  {task.dependencies.length > 0 ? task.dependencies.join(", ") : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Validation Issues */}
      {data.validation_issues && data.validation_issues.length > 0 && (
        <section
          className="rounded-2xl border p-5 transition-all"
          style={{
            backgroundColor: "var(--color-surface)",
            borderColor: "rgba(245, 158, 11, 0.3)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.02)",
          }}
        >
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-3" style={{ color: "var(--color-ink)" }}>
            <AlertTriangle className="w-4 h-4" style={{ color: "var(--color-warning)" }} />
            Validator Findings
          </h3>
          <ul className="space-y-2">
            {data.validation_issues.map((issue, i) => (
              <li key={i} className="text-sm flex items-start gap-2.5" style={{ color: "var(--color-ink-muted)" }}>
                <span
                  className="px-2 py-0.5 rounded-full text-2xs font-medium whitespace-nowrap"
                  style={{
                    backgroundColor: "rgba(245, 158, 11, 0.1)",
                    color: "var(--color-warning)",
                  }}
                >
                  {issue.issue_type.replace(/_/g, " ")}
                </span>
                {issue.detail}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Export Buttons */}
      <div className="flex flex-wrap gap-2.5">
        <button
          onClick={handleExportPlanner}
          disabled={exporting !== null}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all duration-200 disabled:cursor-not-allowed"
          style={{
            backgroundColor: "var(--color-accent)",
            color: "white",
            opacity: exporting !== null ? 0.5 : 1,
          }}
          onMouseEnter={(e) => { if (!exporting) e.currentTarget.style.opacity = "0.9" }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = "1" }}
        >
          <Send className="w-3.5 h-3.5" />
          {exporting === "planner" ? "Pushing…" : "Push to Planner"}
        </button>
        <button
          onClick={handleExportTeams}
          disabled={exporting !== null}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all duration-200 disabled:cursor-not-allowed"
          style={{
            backgroundColor: "rgba(99, 102, 241, 0.1)",
            color: "var(--color-accent)",
            opacity: exporting !== null ? 0.5 : 1,
          }}
          onMouseEnter={(e) => { if (!exporting) e.currentTarget.style.opacity = "0.7" }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = "1" }}
        >
          <Send className="w-3.5 h-3.5" />
          {exporting === "teams" ? "Sending…" : "Share to Teams"}
        </button>
        <button
          onClick={handleCopyMarkdown}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all duration-200"
          style={{
            backgroundColor: "var(--color-panel)",
            color: "var(--color-ink)",
            border: "1px solid var(--color-border)",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--color-border)" }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "var(--color-panel)" }}
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied!" : "Copy Markdown"}
        </button>
      </div>
    </div>
  )
}
