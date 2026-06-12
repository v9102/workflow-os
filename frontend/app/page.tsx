"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { TranscriptInput } from "@/components/TranscriptInput"
import { AgentFeed } from "@/components/AgentFeed"
import { ExecutionDashboard } from "@/components/ExecutionDashboard"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { ToastContainer, toast } from "@/components/Toast"
import { useSSE } from "@/hooks/useSSE"
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts"

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
  elapsed_seconds?: number | null
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export default function Home() {
  const [transcript, setTranscript] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [activities, setActivities] = useState<AgentActivity[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sseEnabled, setSseEnabled] = useState(false)

  const fetchDashboard = useCallback(async (sid: string) => {
    try {
      const res = await fetch(`${API_URL}/api/dashboard/${sid}`)
      if (!res.ok) return null
      const data = await res.json()
      setDashboardData(data.dashboard)
      setActivities(data.activities || [])
      return data
    } catch {
      return null
    }
  }, [])

  const handleSSEActivity = useCallback((data: any) => {
    setActivities((prev) => {
      if (prev.some((a) => a.timestamp === data.timestamp)) return prev
      return [...prev, data]
    })
  }, [])

  const handleSSEDone = useCallback(async (status: string) => {
    setIsProcessing(false)
    setSseEnabled(false)
    if (sessionId) {
      await fetchDashboard(sessionId)
    }
    if (status === "completed") {
      toast("success", "Pipeline complete", "All agents finished successfully")
    } else {
      toast("error", "Pipeline failed", "Check the agent feed for details")
    }
  }, [sessionId, fetchDashboard])

  const handleSSETimeout = useCallback(() => {
    setIsProcessing(false)
    setSseEnabled(false)
    toast("warning", "Pipeline timeout", "The agent pipeline took too long")
  }, [])

  const handleSSEError = useCallback((err: string) => {
    toast("error", "Connection error", err)
  }, [])

  useSSE(sessionId, {
    onActivity: handleSSEActivity,
    onDone: handleSSEDone,
    onTimeout: handleSSETimeout,
    onError: handleSSEError,
    enabled: sseEnabled,
  })

  const shortcuts = useMemo(() => ({
    "Ctrl+Enter": () => {
      if (!isProcessing && transcript.trim()) processTranscript()
    },
    "Ctrl+L": () => document.querySelector<HTMLTextAreaElement>("textarea")?.focus(),
  }), [isProcessing, transcript])

  useKeyboardShortcuts(shortcuts, !isProcessing)

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
      setSseEnabled(true)
      toast("info", "Processing started", "Agent swarm is working on your transcript")
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      toast("error", "Processing failed", err instanceof Error ? err.message : "An error occurred")
    }
  }

  useEffect(() => {
    if (!isProcessing) setSseEnabled(false)
  }, [isProcessing])

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
            <br />
            <kbd className="px-1.5 py-0.5 rounded text-2xs" style={{ backgroundColor: "var(--color-panel)", border: "1px solid var(--color-border)" }}>Ctrl+Enter</kbd> to submit
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
      <ToastContainer />
    </div>
  )
}
