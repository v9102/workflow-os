"use client"

import { Loader2, CheckCircle, XCircle, Clock, Activity, LayoutDashboard } from "lucide-react"

interface AgentActivity {
  agent_name: string
  status: string
  message: string
  timestamp: string
}

interface AgentFeedProps {
  activities: AgentActivity[]
  isProcessing: boolean
  activeTab: "feed" | "dashboard"
  setActiveTab: (tab: "feed" | "dashboard") => void
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "running":
      return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
    case "completed":
      return <CheckCircle className="w-4 h-4 text-green-500" />
    case "failed":
      return <XCircle className="w-4 h-4 text-red-500" />
    default:
      return <Clock className="w-4 h-4 text-gray-400" />
  }
}

export function AgentFeed({ activities, isProcessing, activeTab, setActiveTab }: AgentFeedProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button onClick={() => setActiveTab("feed")}
          className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 ${
            activeTab === "feed" ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-500" : "text-gray-500 dark:text-gray-400"
          }`}>
          <Activity className="w-4 h-4" /> Agent Feed
        </button>
        <button onClick={() => setActiveTab("dashboard")}
          className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 ${
            activeTab === "dashboard" ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-500" : "text-gray-500 dark:text-gray-400"
          }`}>
          <LayoutDashboard className="w-4 h-4" /> Dashboard
        </button>
      </div>
      <div className="p-4 max-h-96 overflow-y-auto space-y-3">
        {activities.length === 0 && isProcessing && (
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" /> Waiting for agents...
          </div>
        )}
        {activities.map((activity, index) => (
          <div key={index} className="flex items-start gap-3">
            <div className="mt-0.5"><StatusIcon status={activity.status} /></div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.agent_name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{activity.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
