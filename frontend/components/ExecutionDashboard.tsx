"use client"

import { ClipboardList, CalendarClock, AlertTriangle } from "lucide-react"

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
  timeline: Array<{
    task: string
    deadline: string
    owner: string
    risk: string
  }>
  validation_issues?: Array<{
    task_id: string
    issue_type: string
    detail: string
  }>
}

function riskClasses(risk: string): string {
  switch (risk) {
    case "High":
      return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
    case "Medium":
      return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
    case "Low":
      return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
    default:
      return "bg-dark-100 dark:bg-dark-700 text-dark-600 dark:text-dark-300"
  }
}

export function ExecutionDashboard({ data }: { data: DashboardData }) {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-dark-800 rounded-2xl border border-dark-200 dark:border-dark-700 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-dark-900 dark:text-white flex items-center gap-2 mb-3">
          <ClipboardList className="w-5 h-5 text-primary-500" />
          Executive Summary
        </h2>
        <p className="text-sm text-dark-600 dark:text-dark-300">{data.summary}</p>
      </div>

      <div className="bg-white dark:bg-dark-800 rounded-2xl border border-dark-200 dark:border-dark-700 p-6 shadow-sm overflow-x-auto">
        <h2 className="text-lg font-semibold text-dark-900 dark:text-white flex items-center gap-2 mb-4">
          <CalendarClock className="w-5 h-5 text-primary-500" />
          Tasks
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-dark-500 dark:text-dark-400 border-b border-dark-200 dark:border-dark-700">
              <th className="pb-2 pr-4">Task</th>
              <th className="pb-2 pr-4">Owner</th>
              <th className="pb-2 pr-4">Deadline</th>
              <th className="pb-2 pr-4">Risk</th>
              <th className="pb-2">Dependencies</th>
            </tr>
          </thead>
          <tbody>
            {data.tasks.map((task, index) => (
              <tr key={index} className="border-b border-dark-100 dark:border-dark-700/50 last:border-0">
                <td className="py-3 pr-4 text-dark-900 dark:text-white">{task.task}</td>
                <td className="py-3 pr-4 text-dark-600 dark:text-dark-300">{task.owner || "Unassigned"}</td>
                <td className="py-3 pr-4 text-dark-600 dark:text-dark-300">{task.deadline || "—"}</td>
                <td className="py-3 pr-4">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${riskClasses(task.risk)}`}>
                    {task.risk}
                  </span>
                </td>
                <td className="py-3 text-xs text-dark-500 dark:text-dark-400">
                  {task.dependencies.length > 0 ? task.dependencies.join(", ") : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.validation_issues && data.validation_issues.length > 0 && (
        <div className="bg-white dark:bg-dark-800 rounded-2xl border border-yellow-300 dark:border-yellow-700 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-dark-900 dark:text-white flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            Validator Findings
          </h2>
          <ul className="space-y-2">
            {data.validation_issues.map((issue, index) => (
              <li key={index} className="text-sm text-dark-600 dark:text-dark-300 flex items-start gap-2">
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 whitespace-nowrap">
                  {issue.issue_type.replace(/_/g, " ")}
                </span>
                {issue.detail}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
