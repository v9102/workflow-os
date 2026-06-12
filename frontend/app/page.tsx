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
  timeline: Array<{
    task: string
    deadline: string
    owner: string
    risk: string
  }>
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

interface AgentActivity {
  agent_name: string
  status: string
  message: string
  timestamp: string
}

export default function Home() {
  const [transcript, setTranscript] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [activities, setActivities] = useState<AgentActivity[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"feed" | "dashboard">("feed")
  const eventSourceRef = useRef<EventSource | null>(null)

  const processTranscript = async () => {
    if (!transcript.trim()) return

    setIsProcessing(true)
    setError(null)
    setDashboardData(null)
    setActivities([])

    try {
      const response = await fetch(`${API_URL}/api/transcript/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      })

      if (!response.ok) {
        throw new Error("Failed to process transcript")
      }

      const data = await response.json()
      setSessionId(data.transcript_id)

      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }

      eventSourceRef.current = new EventSource(`${API_URL}/api/activities/${data.transcript_id}/stream`)

      eventSourceRef.current.onmessage = (event) => {
        const payload = JSON.parse(event.data)

        if (payload.event === "done") {
          eventSourceRef.current?.close()
          fetchDashboard(data.transcript_id)
          return
        }

        setActivities(prev => [...prev, payload])

        if (payload.agent_name === "Orchestrator" && payload.status === "completed") {
          eventSourceRef.current?.close()
          fetchDashboard(data.transcript_id)
        }
      }

      eventSourceRef.current.onerror = () => {
        eventSourceRef.current?.close()
        fetchDashboard(data.transcript_id)
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      setIsProcessing(false)
    }
  }

  const fetchDashboard = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/api/dashboard/${id}`)
      if (response.ok) {
        const data = await response.json()
        setDashboardData(data.dashboard)
        setActivities(data.activities)
        setIsProcessing(false)
      } else if (response.status === 409) {
        setTimeout(() => fetchDashboard(id), 2000)
      } else {
        setError("Failed to fetch dashboard")
        setIsProcessing(false)
      }
    } catch (err) {
      console.error("Failed to fetch dashboard:", err)
      setIsProcessing(false)
    }
  }

  useEffect(() => {
    return () => {
      eventSourceRef.current?.close()
    }
  }, [])

  return (
    <div className="min-h-screen bg-dark-50 dark:bg-dark-900">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <TranscriptInput
            transcript={transcript}
            setTranscript={setTranscript}
            isProcessing={isProcessing}
            onProcess={processTranscript}
            error={error}
          />

          {(isProcessing || dashboardData) && (
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <AgentFeed 
                  activities={activities} 
                  isProcessing={isProcessing}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                />
              </div>
              
              <div className="lg:col-span-2">
                {activeTab === "dashboard" && dashboardData && (
                  <ExecutionDashboard data={dashboardData} sessionId={sessionId ?? undefined} />
                )}
              </div>
            </div>
          )}

          {dashboardData && activeTab === "feed" && (
            <div className="mt-6">
              <ExecutionDashboard data={dashboardData} sessionId={sessionId ?? undefined} />
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}