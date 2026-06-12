"use client"

import { useState, useEffect, useRef } from "react"
import { TranscriptInput } from "@/components/TranscriptInput"
import { AgentFeed } from "@/components/AgentFeed"
import { ExecutionDashboard } from "@/components/ExecutionDashboard"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"

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

interface AgentActivity {
  agent_name: string
  status: string
  message: string
  timestamp: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export default function Home() {
  const [transcript, setTranscript] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [activities, setActivities] = useState<AgentActivity[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"feed" | "dashboard">("feed")

  const processTranscript = async () => {
    if (!transcript.trim()) return
    setIsProcessing(true)
    setError(null)
    setDashboardData(null)
    setActivities([])

    try {
      const res = await fetch(`${API_URL}/api/transcript/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      })
      if (!res.ok) throw new Error("Failed to process")
      const data = await res.json()
      setSessionId(data.transcript_id)
      setActivities(data.activities || [])
      setDashboardData(data.dashboard || null)
      setIsProcessing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <TranscriptInput transcript={transcript} setTranscript={setTranscript} isProcessing={isProcessing} onProcess={processTranscript} error={error} />

          {(isProcessing || dashboardData) && (
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <AgentFeed activities={activities} isProcessing={isProcessing} activeTab={activeTab} setActiveTab={setActiveTab} />
              </div>
              <div className="lg:col-span-2">
                {dashboardData && <ExecutionDashboard data={dashboardData} sessionId={sessionId || undefined} />}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
