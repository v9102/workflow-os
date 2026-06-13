"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { Cpu, Activity, Users, Database, CheckCircle2 } from "lucide-react"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { TranscriptInput } from "@/components/TranscriptInput"
import { AgentFeed, AgentLogFeed } from "@/components/AgentFeed"
import { ExecutionDashboard } from "@/components/ExecutionDashboard"
import { PRESET_MEETINGS } from "@/lib/data"
import { useSSE } from "@/hooks/useSSE"
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts"
import type { SwarmAgent, ParsedPlan } from "@/lib/types"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

interface BackendTask {
  id?: string
  task: string
  deadline?: string | null
  dependencies?: string[]
  owner?: string | null
  risk?: string
  decision?: string | null
}

interface BackendDashboard {
  tasks: BackendTask[]
  summary: string
  timeline: Array<{ task: string; deadline: string; owner: string; risk: string }>
  validation_issues?: Array<{ task_id: string; issue_type: string; detail: string }>
}

function convertBackendDashboard(data: BackendDashboard): ParsedPlan {
  const tasks = data.tasks.map((t, i) => ({
    id: t.id || String(i + 1).padStart(2, "0"),
    title: t.task,
    owner: t.owner || "Unassigned",
    initials: (t.owner || "Unassigned").split(" ").map(n => n[0] || "").join("").toUpperCase().substring(0, 3) || "?",
    deadline: t.deadline || "TBD",
    risk: (t.risk === "High" ? "HIGH" : t.risk === "Medium" ? "MEDIUM" : t.risk === "Low" ? "LOW" : "LOW") as "LOW" | "MEDIUM" | "HIGH",
  }))

  const owners = Array.from(new Set(tasks.map(t => t.owner).filter(Boolean)))
  const risks = owners.map((owner, i) => {
    const ownerTasks = tasks.filter(t => t.owner === owner)
    const maxRisk = Math.max(...ownerTasks.map(t => t.risk === "HIGH" ? 3 : t.risk === "MEDIUM" ? 2 : 1))
    const riskLevel = maxRisk >= 3 ? "High" : maxRisk >= 2 ? "Medium" : "Low"
    return {
      id: `risk${i + 1}`,
      name: owner,
      riskLevel: riskLevel as "Low" | "Medium" | "High" | "Neutral",
      percentage: maxRisk * 30,
    }
  })

  const deps = data.tasks
    .filter(t => t.dependencies && t.dependencies.length > 0)
    .slice(0, 3)
    .map((t, i) => ({
      nodes: [`L${i + 1}: ${t.dependencies?.[0] || "Core"}`, `L${i + 2}: ${t.task.slice(0, 20)}`],
    }))

  if (deps.length === 0) {
    deps.push({ nodes: ["L1: Core Infra", "L2: DB Sync", "L3: API Edge"] })
  }

  const timeline = (data.timeline || []).map((item, i) => ({
    id: `t${i + 1}`,
    time: item.deadline || "TBD",
    status: (item.risk === "High" ? "IN PROGRESS" : "COMPLETE") as "COMPLETE" | "IN PROGRESS" | "QUEUED" | "PENDING",
    title: item.task,
  }))

  return {
    executiveSummary: data.summary || "Analysis complete.",
    dependencyChains: deps,
    risks: risks.length > 0 ? risks : [
      { id: "risk1", name: "Operations", riskLevel: "Low", percentage: 25 },
    ],
    timeline: timeline.length > 0 ? timeline : [
      { id: "t1", time: "08:00 AM", status: "COMPLETE", title: "Environment Provisioning" },
    ],
    tasks,
  }
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'execution' | 'agents' | 'history'>('execution')
  const [transcript, setTranscript] = useState("")
  const [meetingId, setMeetingId] = useState("Meeting_ID_4920")
  const [processState, setProcessState] = useState<'idle' | 'processing' | 'completed'>('idle')
  const [analyzedPlan, setAnalyzedPlan] = useState<ParsedPlan | null>(null)
  const [historyList, setHistoryList] = useState<Array<{ id: string; name: string; transcript: string; plan: ParsedPlan; date: string }>>([])
  const [historySearch, setHistorySearch] = useState("")
  const [swarmDuration, setSwarmDuration] = useState(0)
  const [loadingTextIndex, setLoadingTextIndex] = useState(0)
  const [apiChecking, setApiChecking] = useState(true)
  const [hasApiKey, setHasApiKey] = useState(false)
  const [notifications, setNotifications] = useState<Array<{ id: string; text: string; time: string }>>([
    { id: '1', text: 'Swarm agent cluster rebooted successfully', time: 'Just now' },
    { id: '2', text: 'New analysis model 3.5 Flash online', time: '5m ago' }
  ])
  const [showNotifications, setShowNotifications] = useState(false)
  const [copiedText, setCopiedText] = useState<string | null>(null)

  const [sessionId, setSessionId] = useState<string | null>(null)
  const [agentActivities, setAgentActivities] = useState<Array<{ agent_name: string; status: string; message: string; timestamp: string }>>([])
  const [sseEnabled, setSseEnabled] = useState(false)

  const loadingTexts = [
    'Syncing intelligence modules...',
    'Validating agent consensus...',
    'Structuring latent data...',
    'Refining risk heuristics...',
    'Reviewing operational load...',
    'Mapping regional downtime windows...'
  ]

  const [swarmAgents, setSwarmAgents] = useState<SwarmAgent[]>([
    { id: 'extract', name: 'Extraction Agent', subtext: 'Structured 1,240 tokens', icon: 'Cpu', status: 'idle', order: 1 },
    { id: 'risk', name: 'Risk Intelligence', subtext: 'Analyzing liability clauses...', icon: 'Activity', status: 'idle', order: 2 },
    { id: 'assign', name: 'Task Assignment', subtext: 'Waiting for risk profile', icon: 'Users', status: 'idle', order: 3 },
    { id: 'report', name: 'Auto-Reporting', subtext: 'Queued', icon: 'Database', status: 'idle', order: 4 },
    { id: 'validate', name: 'Final Validator', subtext: 'Awaiting manual oversight', icon: 'CheckCircle2', status: 'idle', order: 5 }
  ])

  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('workflow_os_history')
      if (stored) setHistoryList(JSON.parse(stored))
    } catch (e) {
      console.warn('Failed to load history:', e)
    }

    const checkApi = async () => {
      try {
        const res = await fetch(`${API_URL}/api/health`)
        const data = await res.json()
        setHasApiKey(data.env_ok)
      } catch {
        setHasApiKey(false)
      } finally {
        setApiChecking(false)
      }
    }
    checkApi()
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (processState === 'processing') {
      interval = setInterval(() => {
        setLoadingTextIndex((prev) => (prev + 1) % loadingTexts.length)
      }, 2200)
    }
    return () => clearInterval(interval)
  }, [processState, loadingTexts.length])

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopiedText(label)
    setTimeout(() => setCopiedText(null), 2000)
  }

  const fetchDashboard = useCallback(async (sid: string) => {
    try {
      const res = await fetch(`${API_URL}/api/dashboard/${sid}`)
      if (!res.ok) return null
      const data = await res.json()
      return data.dashboard
    } catch {
      return null
    }
  }, [])

  const handleSSEActivity = useCallback((data: any) => {
    setAgentActivities((prev) => {
      if (prev.some((a) => a.timestamp === data.timestamp)) return prev
      return [...prev, data]
    })

    const agentMap: Record<string, string> = {
      ExtractionAgent: 'extract',
      RiskAgent: 'risk',
      AssignmentAgent: 'assign',
      ReportingAgent: 'report',
      ValidatorAgent: 'validate',
    }

    if (data.agent_name && data.status) {
      setSwarmAgents((prev) => {
        const id = agentMap[data.agent_name]
        if (!id) return prev
        return prev.map((a) => {
          if (a.id !== id) return a
          const status = data.status === 'failed' ? 'completed' : data.status as 'idle' | 'running' | 'completed'
          return { ...a, status, subtext: data.message || a.subtext }
        })
      })
    }
  }, [])

  const handleSSEDone = useCallback(async (status: string) => {
    setProcessState('completed')
    setSseEnabled(false)
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
    }
    setSwarmAgents(prev => prev.map(a => ({ ...a, status: 'completed' as const })))

    if (sessionId && status === 'completed') {
      const dashboardData = await fetchDashboard(sessionId)
      if (dashboardData) {
        const plan = convertBackendDashboard(dashboardData)
        setAnalyzedPlan(plan)
        setActiveTab('dashboard')

        const formattedDate = new Date().toLocaleString('en-US', {
          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        })

        const matchingPreset = PRESET_MEETINGS.find(m => m.transcript === transcript)
        const freshItem = {
          id: meetingId || `ID_${Math.floor(1000 + Math.random() * 9000)}`,
          name: matchingPreset?.name || 'Custom Audio Transcript File',
          transcript,
          plan,
          date: formattedDate,
        }

        setHistoryList((prev) => {
          const updated = [freshItem, ...prev.filter(h => h.transcript !== transcript)]
          localStorage.setItem('workflow_os_history', JSON.stringify(updated))
          return updated
        })

        setNotifications((prev) => [
          { id: String(Date.now()), text: `Analysis complete: ${freshItem.name} generated`, time: 'Just now' },
          ...prev
        ])
      }
    }
  }, [sessionId, transcript, meetingId, fetchDashboard])

  const applyFallback = useCallback(() => {
    const matchingPreset = PRESET_MEETINGS.find(p => p.transcript === transcript)
    const fallbackPlan = matchingPreset ? matchingPreset.plan : PRESET_MEETINGS[0].plan
    setAnalyzedPlan(fallbackPlan)
    setActiveTab('dashboard')

    const fallbackItem = {
      id: meetingId || 'Meeting_ID_4920',
      name: matchingPreset?.name || 'DevOps Fallback Sync Plan',
      transcript,
      plan: fallbackPlan,
      date: 'Just now',
    }

    setHistoryList((prev) => {
      const updated = [fallbackItem, ...prev.filter(h => h.id !== fallbackItem.id)]
      localStorage.setItem('workflow_os_history', JSON.stringify(updated))
      return updated
    })
  }, [transcript, meetingId])

  const handleSSETimeout = useCallback(() => {
    setProcessState('completed')
    setSseEnabled(false)
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
    }
    setSwarmAgents(prev => prev.map(a => ({ ...a, status: 'completed' as const })))
    applyFallback()
  }, [applyFallback])

  const handleSSEError = useCallback((err: string) => {
    console.warn('SSE error:', err)
  }, [])

  useSSE(sessionId, {
    onActivity: handleSSEActivity,
    onDone: handleSSEDone,
    onTimeout: handleSSETimeout,
    onError: handleSSEError,
    enabled: sseEnabled,
  })

  const processTranscript = useCallback(async () => {
    if (!transcript.trim()) return
    setProcessState('processing')
    setSwarmDuration(0)
    setSwarmAgents([
      { id: 'extract', name: 'Extraction Agent', subtext: 'Starting token analysis...', icon: 'Cpu', status: 'running', order: 1 },
      { id: 'risk', name: 'Risk Intelligence', subtext: 'Queued', icon: 'Activity', status: 'idle', order: 2 },
      { id: 'assign', name: 'Task Assignment', subtext: 'Queued', icon: 'Users', status: 'idle', order: 3 },
      { id: 'report', name: 'Auto-Reporting', subtext: 'Queued', icon: 'Database', status: 'idle', order: 4 },
      { id: 'validate', name: 'Final Validator', subtext: 'Awaiting activation', icon: 'CheckCircle2', status: 'idle', order: 5 }
    ])
    setActiveTab('execution')
    setSessionId(null)
    setAgentActivities([])

    // Start visual progress animation
    let elapsed = 0
    progressIntervalRef.current = setInterval(() => {
      elapsed += 0.5
      setSwarmDuration(Math.min(elapsed, 12))
    }, 500)

    try {
      const res = await fetch(`${API_URL}/api/transcript/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, meeting_id: meetingId }),
      })
      if (!res.ok) throw new Error('Failed to process')
      const data = await res.json()
      setSessionId(data.transcript_id)
      setSseEnabled(true)
    } catch (err) {
      console.warn('Backend unavailable, using fallback:', err)
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
        progressIntervalRef.current = null
      }
      // Simulate processing with timeout
      setTimeout(() => {
        setSwarmAgents(prev => prev.map(a => ({ ...a, status: 'completed' as const })))
        setProcessState('completed')
        applyFallback()
      }, 3000)
    }
  }, [transcript, meetingId, applyFallback])

  useEffect(() => {
    if (!transcript.trim()) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
        progressIntervalRef.current = null
      }
    }
  }, [transcript])

  const shortcuts = useMemo(() => ({
    "Ctrl+Enter": () => {
      if (processState !== 'processing' && transcript.trim().length >= 10) processTranscript()
    },
  }), [processState, transcript, processTranscript])

  useKeyboardShortcuts(shortcuts, processState !== 'processing')

  const deleteHistoryItem = (id: string) => {
    const filtered = historyList.filter(h => h.id !== id)
    setHistoryList(filtered)
    localStorage.setItem('workflow_os_history', JSON.stringify(filtered))
  }

  const updatePlan = (newPlan: ParsedPlan) => {
    setAnalyzedPlan(newPlan)
    setHistoryList(prev => {
      const up = prev.map(item => {
        if (item.plan.executiveSummary === analyzedPlan?.executiveSummary) {
          return { ...item, plan: newPlan }
        }
        return item
      })
      localStorage.setItem('workflow_os_history', JSON.stringify(up))
      return up
    })
  }

  const resetToIdle = () => {
    setProcessState('idle')
    setActiveTab('execution')
    setSessionId(null)
    setSseEnabled(false)
    setAgentActivities([])
  }

  return (
    <div className="bg-[#F4F1ED] dark:bg-[#121110] text-[#1A1A1A] dark:text-[#EAE6DF] font-sans min-h-screen flex flex-col transition-colors duration-300">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hasPlan={!!analyzedPlan}
        historyCount={historyList.length}
        isProcessing={processState === 'processing'}
        apiChecking={apiChecking}
        hasApiKey={hasApiKey}
        notifications={notifications}
        showNotifications={showNotifications}
        setShowNotifications={setShowNotifications}
        clearNotifications={() => setNotifications([])}
      />

      <main className="flex-grow pt-28 pb-12 px-6 md:px-12 max-w-7xl mx-auto w-full">
        {activeTab === 'execution' && (
          <div className="w-full">
            {processState === 'idle' && (
              <TranscriptInput
                transcript={transcript}
                setTranscript={setTranscript}
                meetingId={meetingId}
                setMeetingId={setMeetingId}
                isProcessing={false}
                onProcess={processTranscript}
              />
            )}

            {processState === 'processing' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                <aside className="md:col-span-4 lg:col-span-3 space-y-4">
                  <AgentFeed
                    swarmAgents={swarmAgents}
                    swarmDuration={swarmDuration}
                    loadingText={loadingTexts[loadingTextIndex]}
                    isProcessing={true}
                    onReset={resetToIdle}
                  />
                </aside>

                <section className="md:col-span-8 lg:col-span-9 space-y-6">
                  <div className="bg-[#E5E2DD] dark:bg-[#1C1A19] border border-[#1A1A1A]/10 dark:border-[#EAE6DF]/10 p-5 text-left relative overflow-hidden">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-serif italic text-lg text-[#1A1A1A] dark:text-[#EAE6DF]">Swarm Consensus Transcript Pipeline</h3>
                      <span className="text-[9px] font-mono bg-[#F4F1ED] dark:bg-[#121110] border border-[#1A1A1A]/10 dark:border-[#EAE6DF]/10 px-2.5 py-0.5 font-bold">
                        {meetingId}
                      </span>
                    </div>
                    <div className="bg-[#F4F1ED] dark:bg-[#121110] border border-[#1A1A1A]/5 dark:border-[#EAE6DF]/5 p-5 max-h-40 overflow-y-auto mb-4">
                      <p className="text-[13.5px] italic text-stone-800 dark:text-stone-300 leading-relaxed font-serif">
                        &ldquo;{transcript}&rdquo;
                      </p>
                    </div>
                    <div className="flex justify-end">
                      <button className="bg-[#1A1A1A] dark:bg-[#EAE6DF] text-white dark:text-[#1A1A1A] px-5 py-2.5 text-[10px] uppercase tracking-widest font-bold flex items-center gap-2.5 animate-pulse cursor-wait">
                        <span className="w-3 h-3 border border-white dark:border-[#1A1A1A] border-t-transparent dark:border-t-transparent rounded-full animate-spin"></span>
                        <span>{loadingTexts[loadingTextIndex]}</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-[#E5E2DD] dark:bg-[#1C1A19] border border-[#1A1A1A]/10 dark:border-[#EAE6DF]/10 p-5 h-60 flex flex-col justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#F4F1ED] dark:bg-[#121110] animate-pulse"></div>
                        <div className="h-4 w-32 bg-[#F4F1ED] dark:bg-[#121110] animate-pulse"></div>
                      </div>
                      <div className="space-y-3 flex-grow mt-4">
                        <div className="h-3 w-full bg-[#F4F1ED]/65 dark:bg-[#121110]/65 animate-pulse"></div>
                        <div className="h-3 w-5/6 bg-[#F4F1ED]/65 dark:bg-[#121110]/65 animate-pulse"></div>
                        <div className="h-3 w-2/3 bg-[#F4F1ED]/65 dark:bg-[#121110]/65 animate-pulse"></div>
                      </div>
                      <div className="h-8 w-full bg-[#F4F1ED]/40 dark:bg-[#121110]/40 animate-pulse"></div>
                    </div>
                    <div className="bg-[#E5E2DD] dark:bg-[#1C1A19] border border-[#1A1A1A]/10 dark:border-[#EAE6DF]/10 p-5 h-60 flex flex-col justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#F4F1ED] dark:bg-[#121110] animate-pulse"></div>
                        <div className="h-4 w-28 bg-[#F4F1ED] dark:bg-[#121110] animate-pulse"></div>
                      </div>
                      <div className="flex-grow flex items-end justify-center gap-4 h-32 px-4 mt-2">
                        <div className="h-10 w-full bg-[#F4F1ED] dark:bg-[#121110] animate-pulse"></div>
                        <div className="h-20 w-full bg-[#F4F1ED] dark:bg-[#121110] animate-pulse"></div>
                        <div className="h-14 w-full bg-[#F4F1ED] dark:bg-[#121110] animate-pulse"></div>
                        <div className="h-28 w-full bg-[#F4F1ED] dark:bg-[#121110] animate-pulse"></div>
                        <div className="h-16 w-full bg-[#F4F1ED] dark:bg-[#121110] animate-pulse"></div>
                      </div>
                    </div>
                    <div className="md:col-span-2 bg-[#E5E2DD] dark:bg-[#1C1A19] border border-[#1A1A1A]/10 dark:border-[#EAE6DF]/10 p-5 h-40">
                      <div className="h-4 w-36 bg-[#F4F1ED] dark:bg-[#121110] animate-pulse mb-4"></div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="h-16 bg-[#F4F1ED]/60 dark:bg-[#121110]/60 animate-pulse"></div>
                        <div className="h-16 bg-[#F4F1ED]/60 dark:bg-[#121110]/60 animate-pulse"></div>
                        <div className="h-16 bg-[#F4F1ED]/60 dark:bg-[#121110]/60 animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            )}
          </div>
        )}

        {activeTab === 'dashboard' && analyzedPlan && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full items-start">
            <AgentLogFeed hasPlan={true} onReset={resetToIdle} />
            <ExecutionDashboard
              plan={analyzedPlan}
              onUpdatePlan={updatePlan}
              copiedText={copiedText}
              onCopy={copyToClipboard}
            />
          </div>
        )}

        {activeTab === 'agents' && (
          <div className="max-w-4xl mx-auto text-left space-y-6 mt-4">
            <div className="text-center md:text-left">
              <h2 className="font-serif italic text-3xl mb-1 text-[#1A1A1A] dark:text-[#EAE6DF]">WorkflowOS Intelligent Swarm</h2>
              <p className="text-stone-550 dark:text-stone-400 text-sm font-light leading-relaxed">Meet the autonomous agents handling transcript structured intelligence.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { icon: Cpu, name: '1. Extraction Agent', desc: 'Leverages the high scalability parameters of Gemini 2.5 Flash to automatically clean up speech-to-text transcripts, discard vocal delays, isolate individual speakers, and extract the relevant key discussion context maps.' },
                { icon: Activity, name: '2. Risk Intelligence', desc: 'Scours through the compiled discussions to check for deadlines, security conflicts, platform bottlenecks, geographical latency rules, or conflicting developer mandates, ranking risks intelligently.' },
                { icon: Users, name: '3. Task Assignment', desc: 'Assigns individual owners to extracted sprint goals based on historical tags and team names. Auto generates developer profile initials, dates of completion, and priority level weight targets easily.' },
                { icon: Database, name: '4. Auto-Reporting', desc: 'Translates complete structural plans into styled linear timeline checkpoints, multi-tiered dependency chain layouts, executive summary paragraphs, and interactive spreadsheet tables instantly.' },
              ].map((agent, i) => (
                <div key={i} className="bg-[#E5E2DD] dark:bg-[#1C1A19] p-5 border border-[#1A1A1A]/10 dark:border-[#EAE6DF]/10 space-y-2">
                  <div className="flex items-center gap-2.5 text-stone-850 dark:text-stone-300">
                    <div className="p-1.5 bg-[#F4F1ED] dark:bg-[#121110] border border-[#1A1A1A]/10 dark:border-[#EAE6DF]/10"><agent.icon className="w-4 h-4" /></div>
                    <h3 className="font-bold text-xs uppercase tracking-wider text-[#1A1A1A] dark:text-[#EAE6DF]">{agent.name}</h3>
                  </div>
                  <p className="text-xs text-stone-6050 dark:text-stone-400 leading-relaxed font-serif italic">{agent.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="max-w-4xl mx-auto text-left space-y-6 mt-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="font-serif italic text-3xl text-[#1A1A1A] dark:text-[#EAE6DF]">Sprint Executions History</h2>
                <p className="text-stone-550 dark:text-stone-400 text-sm font-light">Review previously synchronized meeting analyses stored locally in this device browser.</p>
              </div>
              {historyList.length > 0 && (
                <button
                  onClick={() => { if (confirm('Clear entire history?')) { setHistoryList([]); localStorage.removeItem('workflow_os_history') } }}
                  className="px-4 py-1.5 border border-red-800 dark:border-red-400/50 bg-transparent hover:bg-red-50 dark:hover:bg-red-950/20 text-red-800 dark:text-red-400 text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer"
                >
                  Clear History
                </button>
              )}
            </div>

            <div className="relative">
              <svg className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Search past plans..."
                className="w-full pl-9 pr-4 py-2.5 bg-[#E5E2DD] dark:bg-[#1C1A19] border border-[#1A1A1A]/10 dark:border-[#EAE6DF]/10 text-xs text-[#1A1A1A] dark:text-[#EAE6DF] focus:outline-none focus:ring-0 placeholder:text-stone-400 font-serif italic"
              />
            </div>

            {historyList.length === 0 ? (
              <div className="bg-[#E5E2DD] dark:bg-[#1C1A19] p-10 border border-[#1A1A1A]/10 dark:border-[#EAE6DF]/10 text-center text-stone-500 space-y-3">
                <svg className="w-12 h-12 mx-auto text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                <p>You have not executed any meeting transcripts yet.</p>
                <button onClick={() => setActiveTab('execution')} className="px-4 py-2 bg-[#1A1A1A] dark:bg-[#EAE6DF] text-white dark:text-[#1A1A1A] text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer">
                  Analyze First Transcript Now
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {historyList
                  .filter((h) => h.name.toLowerCase().includes(historySearch.toLowerCase()) || h.transcript.toLowerCase().includes(historySearch.toLowerCase()))
                  .map((historyItem) => (
                    <div key={historyItem.id} className="bg-[#E5E2DD] dark:bg-[#1C1A19] p-5 border border-[#1A1A1A]/10 dark:border-[#EAE6DF]/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-stone-200 dark:hover:bg-stone-800 transition-all text-left">
                      <div className="space-y-1 flex-grow">
                        <div className="flex items-center gap-2">
                          <span className="font-serif italic text-base text-[#1A1A1A] dark:text-[#EAE6DF]">{historyItem.name}</span>
                          <span className="text-[9px] bg-[#F4F1ED] dark:bg-[#121110] text-[#1A1A1A] dark:text-[#EAE6DF] px-1.5 py-0.5 font-mono font-bold border border-[#1A1A1A]/5 dark:border-[#EAE6DF]/5">{historyItem.id}</span>
                        </div>
                        <p className="text-stone-500 font-mono text-[9px] uppercase tracking-wider">{historyItem.date}</p>
                        <p className="text-xs text-stone-600 dark:text-stone-400 italic line-clamp-1 mt-1 font-serif">&ldquo;{historyItem.transcript}&rdquo;</p>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <button
                          onClick={() => { setAnalyzedPlan(historyItem.plan); setTranscript(historyItem.transcript); setMeetingId(historyItem.id); setProcessState('completed'); setActiveTab('dashboard') }}
                          className="px-4 py-1.5 bg-[#1A1A1A] dark:bg-[#EAE6DF] text-white dark:text-[#1A1A1A] hover:opacity-90 text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>Open Board</span>
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                        </button>
                        <button
                          onClick={() => deleteHistoryItem(historyItem.id)}
                          className="p-1 px-2 border border-red-800/10 hover:border-red-800 dark:border-red-400/10 dark:hover:border-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-800 dark:text-red-400 transition-colors cursor-pointer"
                          title="Delete plan"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
