"use client"

import { CheckCircle2, RefreshCw } from "lucide-react"
import type { SwarmAgent } from "@/lib/types"

interface AgentFeedProps {
  swarmAgents: SwarmAgent[]
  swarmDuration: number
  loadingText: string
  isProcessing: boolean
  onReset: () => void
}

export function AgentFeed({ swarmAgents, swarmDuration, loadingText, isProcessing, onReset }: AgentFeedProps) {
  return (
    <aside className="space-y-4">
      <div className="bg-[#E5E2DD] dark:bg-[#1C1A19] border border-[#1A1A1A]/10 dark:border-[#EAE6DF]/10 p-5">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#1A1A1A]/5 dark:border-[#EAE6DF]/5">
          <h2 className="font-serif italic text-md text-[#1A1A1A] dark:text-[#EAE6DF]">Swarm Activity</h2>
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full bg-stone-550 dark:bg-stone-300 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 bg-stone-850 dark:bg-[#EAE6DF]"></span>
            </span>
            <span className="text-[9px] font-bold text-stone-700 dark:text-stone-300 uppercase tracking-[0.2em]">Active</span>
          </div>
        </div>

        <div className="space-y-2.5">
          {swarmAgents.map((agent) => (
            <div
              key={agent.id}
              className={`flex gap-3 items-start p-2.5 border transition-all ${
                agent.status === 'completed'
                  ? 'bg-[#F4F1ED]/40 dark:bg-[#121110]/40 border-stone-300/35 dark:border-stone-750/30'
                  : agent.status === 'running'
                  ? 'bg-[#F4F1ED] dark:bg-[#121110] border-stone-800 dark:border-stone-200 border-l-2 border-l-stone-800 dark:border-l-[#EAE6DF] animate-pulse'
                  : 'border-transparent opacity-30'
              }`}
            >
              <div className={`mt-0.5 flex items-center justify-center h-5 w-5 text-[10px] font-mono border ${
                agent.status === 'completed'
                  ? 'bg-[#1A1A1A] dark:bg-[#EAE6DF] text-white dark:text-[#1A1A1A] border-transparent'
                  : agent.status === 'running'
                  ? 'bg-transparent text-stone-800 dark:text-stone-200 border-stone-800 dark:border-stone-200 animate-spin'
                  : 'bg-transparent text-stone-400 border-stone-300 dark:border-stone-800'
              }`}>
                {agent.status === 'completed' ? '✓' : agent.status === 'running' ? '⟳' : '•'}
              </div>
              <div className="text-left">
                <div className={`font-bold text-[11px] uppercase tracking-wider ${agent.status === 'running' ? 'text-stone-900 dark:text-stone-100' : 'text-stone-800 dark:text-stone-200'}`}>
                  {agent.name}
                </div>
                <div className="text-[10px] font-serif italic text-stone-500 dark:text-stone-400 mt-0.5">
                  {agent.subtext}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#E5E2DD] dark:bg-[#1C1A19] border border-[#1A1A1A]/10 dark:border-[#EAE6DF]/10 p-5 text-left">
        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-stone-550 dark:text-stone-400 block mb-3">Processing Swarm Load</span>
        <div className="h-1.5 w-full bg-[#F4F1ED]/90 dark:bg-[#121110]/90 overflow-hidden mb-2">
          <div
            className="h-full bg-stone-850 dark:bg-[#EAE6DF] transition-all duration-300"
            style={{ width: `${(swarmDuration / 12) * 100}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-[10px] font-mono text-stone-500 dark:text-stone-400 uppercase tracking-widest mt-1">
          <span>{swarmDuration.toFixed(1)}s Elapsed</span>
          <span>Target ~12.0s</span>
        </div>
      </div>

      {!isProcessing && (
        <button
          onClick={onReset}
          className="w-full py-2.5 px-4 bg-transparent border border-[#1A1A1A]/20 dark:border-[#EAE6DF]/15 hover:bg-[#EAE6DF]/30 dark:hover:bg-stone-850/20 text-[#1A1A1A] dark:text-[#EAE6DF] text-[10px] font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Process New Transcript</span>
          <RefreshCw className="w-3 h-3" />
        </button>
      )}
    </aside>
  )
}

export function AgentLogFeed({ hasPlan, onReset }: { hasPlan: boolean; onReset: () => void }) {
  if (!hasPlan) return null

  const logs = [
    { icon: CheckCircle2, agent: 'Data Analyst v2', msg: 'Dataset cleaning completed safely. Outliers analyzed in 12s. Everything indexed code-complete.' },
    { icon: CheckCircle2, agent: 'Strategist Pro', msg: 'Market constraints updated. Generated safe path for regional compliance. High quality confidence.' },
    { icon: CheckCircle2, agent: 'Security Audit', msg: 'Firewall configurations, credentials checked. Handled key proxies inside server-framework.' },
    { icon: CheckCircle2, agent: 'Copywriter AI', msg: 'Serialized document output schema complete. Standard templates saved to execution cache.' },
  ]

  return (
    <aside className="lg:col-span-3 space-y-4">
      <div className="flex items-center justify-between px-1">
        <h3 className="font-bold text-[10px] uppercase tracking-widest text-[#1A1A1A] dark:text-[#EAE6DF]">Swarm Agent Logs</h3>
        <span className="font-bold text-[8px] tracking-[0.15em] text-stone-100 bg-[#1A1A1A] dark:bg-[#EAE6DF] dark:text-[#1A1A1A] px-2 py-0.5 uppercase">ONLINE</span>
      </div>
      <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-220px)] pr-1">
        {logs.map((log, i) => (
          <div key={i} className="bg-[#E5E2DD] dark:bg-[#1C1A19] p-4 border border-[#1A1A1A]/10 dark:border-[#EAE6DF]/10 text-left">
            <div className="flex items-center gap-2 mb-1">
              <log.icon className="w-3.5 h-3.5 text-stone-800 dark:text-stone-300" />
              <span className="font-bold text-[11px] uppercase tracking-wider text-stone-900 dark:text-stone-100">{log.agent}</span>
            </div>
            <p className="text-stone-600 dark:text-stone-450 text-[12px] leading-relaxed italic font-serif mt-1">{log.msg}</p>
            <div className="mt-2.5 h-0.5 w-full bg-[#F4F1ED] dark:bg-[#121110] overflow-hidden">
              <div className="h-full bg-stone-700 dark:bg-stone-300 w-full"></div>
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={onReset}
        className="w-full py-2.5 px-4 bg-transparent border border-[#1A1A1A]/20 dark:border-[#EAE6DF]/15 hover:bg-[#EAE6DF]/30 dark:hover:bg-stone-850/20 text-[#1A1A1A] dark:text-[#EAE6DF] text-[10px] font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
      >
        <span>Process New Transcript</span>
        <RefreshCw className="w-3 h-3" />
      </button>
    </aside>
  )
}
