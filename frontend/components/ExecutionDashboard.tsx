"use client"

import { ClipboardList, CalendarClock, AlertTriangle, Send, Copy, Check } from "lucide-react"
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

function riskClasses(risk: string): string {
  switch (risk) {
    case "High": return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
    case "Medium": return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
    case "Low": return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
    default: return "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
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

  const owners = [...new Set(data.tasks.map(t => t.owner || "Unassigned"))]
  const heatmap = owners.map(owner => ({
    owner,
    High: data.tasks.filter(t => (t.owner || "Unassigned") === owner && t.risk === "High").length,
    Medium: data.tasks.filter(t => (t.owner || "Unassigned") === owner && t.risk === "Medium").length,
    Low: data.tasks.filter(t => (t.owner || "Unassigned") === owner && t.risk === "Low").length,
  }))

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
          <ClipboardList className="w-5 h-5 text-blue-500" /> Executive Summary
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-300">{data.summary}</p>
      </div>

      {/* Risk Heatmap */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-blue-500" /> Risk Heatmap
        </h2>
        <div className="grid grid-cols-4 gap-2 text-xs font-medium mb-4">
          <div className="text-gray-500">Owner</div>
          <div className="text-center text-red-600">High</div>
          <div className="text-center text-yellow-600">Medium</div>
          <div className="text-center text-green-600">Low</div>
          {heatmap.map(h => (
            <>
              <div className="text-gray-700 dark:text-gray-300">{h.owner}</div>
              <div className="text-center">{h.High > 0 ? <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 rounded-full">{h.High}</span> : "—"}</div>
              <div className="text-center">{h.Medium > 0 ? <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 rounded-full">{h.Medium}</span> : "—"}</div>
              <div className="text-center">{h.Low > 0 ? <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 rounded-full">{h.Low}</span> : "—"}</div>
            </>
          ))}
        </div>
        <div className="flex gap-4 text-sm">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500"></span> High: {riskCounts.High}</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-500"></span> Medium: {riskCounts.Medium}</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500"></span> Low: {riskCounts.Low}</span>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
          <CalendarClock className="w-5 h-5 text-blue-500" /> Timeline
        </h2>
        {data.timeline.length > 0 ? (
          <div className="relative pl-6 border-l-2 border-blue-200 dark:border-blue-800 space-y-4">
            {data.timeline.map((item, i) => (
              <div key={i} className="relative">
                <div className="absolute -left-8 top-1 w-4 h-4 rounded-full bg-blue-500 border-2 border-white dark:border-gray-800"></div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{item.task}</p>
                <p className="text-xs text-gray-500">
                  {item.owner} · {item.deadline || "No deadline"} · <span className={riskClasses(item.risk).split(" ")[0]}>{item.risk}</span>
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No timeline data available.</p>
        )}
      </div>

      {/* Task Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm overflow-x-auto">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
          <ClipboardList className="w-5 h-5 text-blue-500" /> Tasks
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
              <th className="pb-2 pr-4">Task</th><th className="pb-2 pr-4">Owner</th>
              <th className="pb-2 pr-4">Deadline</th><th className="pb-2 pr-4">Risk</th>
              <th className="pb-2">Dependencies</th>
            </tr>
          </thead>
          <tbody>
            {data.tasks.map((task, i) => (
              <tr key={i} className="border-b border-gray-100 dark:border-gray-700/50 last:border-0">
                <td className="py-3 pr-4 text-gray-900 dark:text-white">{task.task}</td>
                <td className="py-3 pr-4 text-gray-600 dark:text-gray-300">{task.owner || "Unassigned"}</td>
                <td className="py-3 pr-4 text-gray-600 dark:text-gray-300">{task.deadline || "—"}</td>
                <td className="py-3 pr-4">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${riskClasses(task.risk)}`}>{task.risk}</span>
                </td>
                <td className="py-3 text-xs text-gray-500">{task.dependencies.length > 0 ? task.dependencies.join(", ") : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Validation Issues */}
      {data.validation_issues && data.validation_issues.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-yellow-300 dark:border-yellow-700 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500" /> Validator Findings
          </h2>
          <ul className="space-y-2">
            {data.validation_issues.map((issue, i) => (
              <li key={i} className="text-sm text-gray-600 dark:text-gray-300 flex items-start gap-2">
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 whitespace-nowrap">{issue.issue_type.replace(/_/g, " ")}</span>
                {issue.detail}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Export Buttons */}
      <div className="flex flex-wrap gap-3">
        <button onClick={handleExportPlanner} disabled={exporting !== null}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg text-sm font-medium transition-colors">
          <Send className="w-4 h-4" /> {exporting === "planner" ? "Pushing..." : "Push to Planner"}
        </button>
        <button onClick={handleExportTeams} disabled={exporting !== null}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white rounded-lg text-sm font-medium transition-colors">
          <Send className="w-4 h-4" /> {exporting === "teams" ? "Sending..." : "Share to Teams"}
        </button>
        <button onClick={handleCopyMarkdown}
          className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors">
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? "Copied!" : "Copy as Markdown"}
        </button>
      </div>
    </div>
  )
}
