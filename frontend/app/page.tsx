"use client"

import { useState } from "react"
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
    } finally {
      setIsProcessing(false)
    }
  }

  const showResults = isProcessing || dashboardData

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="max-w-2xl mx-auto mb-10 sm:mb-14 text-center">
          <h2 className="text-2xl sm:text-3xl font-display font-semibold tracking-tight text-[var(--color-ink)]">
            Transform transcripts into execution plans
          </h2>
          <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
            Paste a meeting transcript and let the agent swarm extract actions, risks, and timelines.
          </p>
        </div>

        <div className="animate-fade-in">
          <TranscriptInput
            transcript={transcript}
            setTranscript={setTranscript}
            isProcessing={isProcessing}
            onProcess={processTranscript}
            error={error}
          />
        </div>

        {showResults && (
          <div className="mt-8 animate-slide-up">
            <AgentFeed activities={activities} isProcessing={isProcessing} />
            {dashboardData && (
              <div className="mt-6 animate-slide-up">
                <ExecutionDashboard data={dashboardData} sessionId={sessionId || undefined} />
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}