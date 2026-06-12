"use client"

import { useState } from "react"
import {
  Check, ChevronDown, Layers, AlertTriangle, ArrowRight, Search, Plus, Copy, FileText, Trash2, ExternalLink
} from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import type { ParsedPlan, TaskItem } from "@/lib/types"

interface ExecutionDashboardProps {
  plan: ParsedPlan
  onUpdatePlan: (plan: ParsedPlan) => void
  copiedText: string | null
  onCopy: (text: string, label: string) => void
}

export function ExecutionDashboard({ plan, onUpdatePlan, copiedText, onCopy }: ExecutionDashboardProps) {
  const [isExecSummaryOpen, setIsExecSummaryOpen] = useState(true)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [taskSearch, setTaskSearch] = useState("")
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [newTaskOwner, setNewTaskOwner] = useState("")
  const [newTaskRisk, setNewTaskRisk] = useState<"LOW" | "MEDIUM" | "HIGH">("LOW")
  const [newTaskDeadline, setNewTaskDeadline] = useState("Oct 26")

  const addCustomTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskTitle.trim() || !newTaskOwner.trim()) return

    const added: TaskItem = {
      id: String(plan.tasks.length + 1).padStart(2, "0"),
      title: newTaskTitle,
      owner: newTaskOwner,
      initials: newTaskOwner.split(" ").map(n => n[0] || "").join("").toUpperCase().substring(0, 3),
      deadline: newTaskDeadline,
      risk: newTaskRisk
    }

    onUpdatePlan({ ...plan, tasks: [...plan.tasks, added] })
    setNewTaskTitle("")
    setNewTaskOwner("")
    setShowTaskForm(false)
  }

  const filteredTasks = plan.tasks.filter(
    (t) => t.title.toLowerCase().includes(taskSearch.toLowerCase()) ||
           t.owner.toLowerCase().includes(taskSearch.toLowerCase())
  )

  return (
    <section className="lg:col-span-9 space-y-6">
      <div className="bg-[#E5E2DD] dark:bg-[#1C1A19] border border-[#1A1A1A]/10 dark:border-[#EAE6DF]/10 overflow-hidden text-left">
        <button
          onClick={() => setIsExecSummaryOpen(!isExecSummaryOpen)}
          className="w-full flex items-center justify-between p-5 hover:bg-[#F4F1ED]/50 dark:hover:bg-[#121110]/50 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Check className="w-4 h-4 text-stone-800 dark:text-stone-305" />
            <h2 className="font-serif italic text-lg text-[#1A1A1A] dark:text-[#EAE6DF]">Executive Summary</h2>
          </div>
          <ChevronDown className={`w-4 h-4 transition-transform duration-250 ${isExecSummaryOpen ? "rotate-180" : ""}`} />
        </button>

        <AnimatePresence initial={false}>
          {isExecSummaryOpen && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              exit={{ height: 0 }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-5 pt-2 border-t border-[#1A1A1A]/10 dark:border-[#EAE6DF]/10">
                <p className="text-[14px] leading-relaxed text-stone-800 dark:text-stone-300 font-serif italic">
                  {plan.executiveSummary}
                </p>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => onCopy(plan.executiveSummary, "exec")}
                    className="text-[10px] uppercase tracking-widest text-[#1A1A1A] dark:text-[#EAE6DF] hover:opacity-50 transition-all flex items-center gap-1.5 font-bold"
                  >
                    {copiedText === "exec" ? "Copied ✓" : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Summary</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
        <div className="bg-[#E5E2DD] dark:bg-[#1C1A19] p-5 border border-[#1A1A1A]/10 dark:border-[#EAE6DF]/10">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#1A1A1A]/5 dark:border-[#EAE6DF]/5">
            <h3 className="font-serif italic text-base text-[#1A1A1A] dark:text-[#EAE6DF]">Dependency Graph</h3>
            <Layers className="w-3.5 h-3.5 text-stone-500" />
          </div>
          <div className="space-y-4">
            {plan.dependencyChains.map((chain, chainIdx) => (
              <div key={chainIdx} className="flex flex-wrap items-center gap-2 bg-[#F4F1ED] dark:bg-[#121110] p-2.5 border border-[#1A1A1A]/5 dark:border-[#EAE6DF]/5">
                {chain.nodes.map((node, nodeIdx) => (
                  <span key={nodeIdx}>
                    <span className={`text-[9px] font-bold px-2 py-0.5 border uppercase tracking-wider ${
                      nodeIdx === 0
                        ? "bg-[#1A1A1A] dark:bg-[#EAE6DF] text-white dark:text-[#1A1A1A] border-transparent"
                        : nodeIdx === chain.nodes.length - 1
                        ? "bg-transparent text-stone-850 dark:text-stone-200 border-[#1A1A1A]/30 dark:border-[#EAE6DF]/30"
                        : "bg-transparent text-stone-500 dark:text-stone-400 border-dashed border-[#1A1A1A]/15 dark:border-[#EAE6DF]/15"
                    }`}>
                      {node}
                    </span>
                    {nodeIdx < chain.nodes.length - 1 && (
                      <ArrowRight className="w-3 h-3 text-stone-400 dark:text-stone-600 inline-flex ml-2" />
                    )}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#E5E2DD] dark:bg-[#1C1A19] p-5 border border-[#1A1A1A]/10 dark:border-[#EAE6DF]/10">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#1A1A1A]/5 dark:border-[#EAE6DF]/5">
            <h3 className="font-serif italic text-base text-[#1A1A1A] dark:text-[#EAE6DF]">Risk Heatmap</h3>
            <AlertTriangle className="w-3.5 h-3.5 text-stone-500" />
          </div>
          <div className="space-y-3">
            {plan.risks.map((risk) => (
              <div key={risk.id} className="space-y-1">
                <div className="flex justify-between text-[11px] uppercase tracking-wider font-bold text-stone-850 dark:text-stone-300">
                  <span>{risk.name}</span>
                  <span className="font-bold tracking-widest font-mono text-[9px] text-[#1A1A1A] dark:text-[#EAE6DF]">{risk.riskLevel}</span>
                </div>
                <div className="h-1 w-full bg-[#F4F1ED]/90 dark:bg-[#121110]/90 overflow-hidden">
                  <div className="h-full bg-stone-850 dark:bg-[#EAE6DF] transition-all duration-300" style={{ width: `${risk.percentage}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-[#E5E2DD] dark:bg-[#1C1A19] p-5 border border-[#1A1A1A]/10 dark:border-[#EAE6DF]/10 text-left">
        <div className="mb-5 pb-2 border-b border-[#1A1A1A]/5 dark:border-[#EAE6DF]/5">
          <h3 className="font-serif italic text-base text-[#1A1A1A] dark:text-[#EAE6DF]">Operational Timeline</h3>
        </div>
        <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-1 before:top-2 before:bottom-2 before:w-[1px] before:bg-stone-300 dark:before:bg-stone-800">
          {plan.timeline.map((item) => (
            <div key={item.id} className="relative">
              <div className={`absolute -left-[24px] top-1.5 w-2 h-2 ${
                item.status === "COMPLETE"
                  ? "bg-stone-850 dark:bg-[#EAE6DF]"
                  : item.status === "IN PROGRESS"
                  ? "bg-stone-500 ring-4 ring-stone-400/10 animate-pulse"
                  : "bg-stone-300 dark:bg-stone-700"
              }`}></div>
              <div className="flex justify-between items-start gap-4">
                <div>
                  <span className="text-[9px] font-mono font-bold uppercase tracking-widest block text-stone-550 dark:text-stone-400">
                    {item.time} — {item.status}
                  </span>
                  <span className="font-serif italic text-sm text-stone-900 dark:text-stone-100 mt-1 block">{item.title}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#E5E2DD] dark:bg-[#1C1A19] border border-[#1A1A1A]/10 dark:border-[#EAE6DF]/10 overflow-hidden text-left">
        <div className="p-4 flex flex-wrap items-center justify-between gap-4 border-b border-[#1A1A1A]/10 dark:border-[#EAE6DF]/10 bg-[#F4F1ED]/50 dark:bg-[#121110]/50">
          <div className="flex items-center gap-2">
            <h3 className="font-serif italic text-base text-[#1A1A1A] dark:text-[#EAE6DF]">Task Execution</h3>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-grow">
              <Search className="w-3.5 h-3.5 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={taskSearch}
                onChange={(e) => setTaskSearch(e.target.value)}
                placeholder="Search tasks..."
                className="w-full pl-9 pr-3 py-1.5 bg-[#F4F1ED] dark:bg-[#121110] border border-[#1A1A1A]/10 dark:border-[#EAE6DF]/10 text-xs focus:ring-0 focus:border-[#1A1A1A] dark:focus:border-[#EAE6DF] focus:bg-white outline-none placeholder:text-stone-400 font-serif italic text-[#1A1A1A] dark:text-[#EAE6DF] transition-all"
              />
            </div>
            <button
              onClick={() => setShowTaskForm(!showTaskForm)}
              className="p-1.5 bg-transparent hover:bg-stone-200 dark:hover:bg-stone-800 border border-[#1A1A1A]/10 dark:border-[#EAE6DF]/10 text-stone-850 dark:text-stone-200 transition-all flex items-center justify-center cursor-pointer"
              title="Add manual custom task inline"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={() => onCopy(JSON.stringify(plan.tasks, null, 2), "tasks")}
              className="p-1.5 border border-[#1A1A1A]/10 dark:border-[#EAE6DF]/10 hover:bg-stone-200 dark:hover:bg-[#121110] transition-colors cursor-pointer"
              title="Copy JSON list"
            >
              <span className="text-[10px] font-mono font-bold text-[#1A1A1A] dark:text-[#EAE6DF] uppercase tracking-wider">
                {copiedText === "tasks" ? "Copied ✓" : "JSON"}
              </span>
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showTaskForm && (
            <motion.form
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              onSubmit={addCustomTask}
              className="bg-[#F4F1ED] dark:bg-[#121110]/50 p-4 border-b border-[#1A1A1A]/10 dark:border-[#EAE6DF]/10 space-y-3"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <input
                  required
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Task title details..."
                  className="md:col-span-2 p-2 bg-white dark:bg-[#11100F] border border-[#1A1A1A]/10 dark:border-[#EAE6DF]/10 text-xs outline-none focus:border-[#1A1A1A] dark:focus:border-[#EAE6DF] text-[#1A1A1A] dark:text-[#EAE6DF] font-sans"
                />
                <input
                  required
                  value={newTaskOwner}
                  onChange={(e) => setNewTaskOwner(e.target.value)}
                  placeholder="Owner Name"
                  className="p-2 bg-white dark:bg-[#11100F] border border-[#1A1A1A]/10 dark:border-[#EAE6DF]/10 text-xs outline-none focus:border-[#1A1A1A] dark:focus:border-[#EAE6DF] text-[#1A1A1A] dark:text-[#EAE6DF] font-sans"
                />
                <div className="flex gap-2">
                  <select
                    value={newTaskRisk}
                    onChange={(e: any) => setNewTaskRisk(e.target.value)}
                    className="p-2 flex-grow bg-white dark:bg-[#11100F] border border-[#1A1A1A]/10 dark:border-[#EAE6DF]/10 text-xs outline-none text-[#1A1A1A] dark:text-[#EAE6DF] font-sans"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                  </select>
                  <button type="submit" className="px-4 py-2 bg-[#1A1A1A] dark:bg-[#EAE6DF] text-white dark:text-[#1A1A1A] text-xs font-bold hover:opacity-90 transition-opacity">Save</button>
                </div>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F4F1ED]/50 dark:bg-[#121110]/30 border-b border-[#1A1A1A]/10 dark:border-[#EAE6DF]/10 text-stone-6050 dark:text-stone-400">
                <th className="px-5 py-3 font-bold text-[10px] uppercase tracking-widest">#</th>
                <th className="px-5 py-3 font-bold text-[10px] uppercase tracking-widest">Task</th>
                <th className="px-5 py-3 font-bold text-[10px] uppercase tracking-widest">Owner</th>
                <th className="px-5 py-3 font-bold text-[10px] uppercase tracking-widest">Deadline</th>
                <th className="px-5 py-3 font-bold text-[10px] uppercase tracking-widest">Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A1A1A]/5 dark:divide-[#EAE6DF]/5">
              {filteredTasks.map((task) => (
                <tr key={task.id} className="hover:bg-[#F4F1ED]/50 dark:hover:bg-[#121110]/30 transition-colors group">
                  <td className="px-5 py-3 text-stone-500 font-mono font-bold text-[10px]">{task.id}</td>
                  <td className="px-5 py-3 font-serif italic text-[13px] text-stone-900 dark:text-stone-100">{task.title}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-[#1A1A1A] dark:bg-[#EAE6DF] text-white dark:text-[#1A1A1A] flex items-center justify-center text-[9px] font-bold font-mono">
                        {task.initials}
                      </div>
                      <span className="font-bold text-[11px] uppercase tracking-wider text-stone-750 dark:text-stone-200">{task.owner}</span>
                    </div>
                  </td>
                  <td className={`px-5 py-3 font-mono text-[10px] uppercase tracking-wider ${task.deadline === 'OVERDUE' ? 'text-[#ba1a1a]' : 'text-stone-6050 dark:text-stone-400'}`}>
                    {task.deadline}
                  </td>
                  <td className="px-5 py-3">
                    <span className="px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest bg-stone-300/30 text-stone-700 dark:bg-stone-850 dark:text-stone-300 border border-transparent">
                      {task.risk}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
