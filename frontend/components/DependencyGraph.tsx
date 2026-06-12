"use client"

import { useMemo, useState } from "react"
import { ArrowRight } from "lucide-react"

interface TaskNode {
  id: string
  label: string
  risk: string
  owner: string | null
  deadline: string | null
  dependencies: string[]
}

interface DependencyGraphProps {
  tasks: Array<{
    id: string
    task: string
    risk: string
    owner: string | null
    deadline: string | null
    dependencies: string[]
  }>
}

function riskColor(risk: string): { bg: string; text: string; border: string } {
  switch (risk) {
    case "High": return { bg: "rgba(186, 26, 26, 0.08)", text: "#ba1a1a", border: "rgba(186, 26, 26, 0.2)" }
    case "Medium": return { bg: "rgba(70, 72, 212, 0.08)", text: "#4648d4", border: "rgba(70, 72, 212, 0.2)" }
    case "Low": return { bg: "rgba(144, 73, 0, 0.08)", text: "#904900", border: "rgba(144, 73, 0, 0.2)" }
    default: return { bg: "#efecf8", text: "#464554", border: "rgba(199, 196, 215, 0.2)" }
  }
}

export function DependencyGraph({ tasks }: DependencyGraphProps) {
  const [expanded, setExpanded] = useState(true)

  const nodes = useMemo(() => {
    return tasks.map((t) => ({
      id: t.id,
      label: t.task.length > 30 ? t.task.slice(0, 30) + "\u2026" : t.task,
      risk: t.risk,
      owner: t.owner,
      deadline: t.deadline,
      dependencies: t.dependencies,
    }))
  }, [tasks])

  if (tasks.length === 0) return null

  const levels = buildLevels(nodes)
  const levelLabels = ["Core Infra", "DB Sync", "API Edge", "Services", "Integration"]

  return (
    <div className="space-y-md">
      {levels.map((level, li) => (
        <div key={li} className="flex flex-wrap items-center gap-xs">
          <span className="font-label-sm text-label-sm px-3 py-1 rounded-full border"
            style={{
              backgroundColor: li === 0 ? "rgba(144, 73, 0, 0.08)" : li === 1 ? "#efecf8" : li === 2 ? "rgba(186, 26, 26, 0.08)" : "#efecf8",
              color: li === 0 ? "#904900" : li === 1 ? "#464554" : li === 2 ? "#ba1a1a" : "#464554",
              borderColor: li === 0 ? "rgba(144, 73, 0, 0.2)" : li === 1 ? "rgba(199, 196, 215, 0.2)" : li === 2 ? "rgba(186, 26, 26, 0.2)" : "rgba(199, 196, 215, 0.2)",
            }}
          >
            L{li + 1}: {levelLabels[li] || `Level ${li + 1}`}
          </span>
          <ArrowRight size={16} className="text-outline-variant" strokeWidth={1.5} />
          {level.map((node) => {
            const c = riskColor(node.risk)
            return (
              <span
                key={node.id}
                className="font-label-sm text-label-sm px-3 py-1 rounded-full border"
                style={{
                  backgroundColor: c.bg,
                  color: c.text,
                  borderColor: c.border,
                }}
                title={`${node.label}\nOwner: ${node.owner || "Unassigned"}\nDeadline: ${node.deadline || "\u2014"}`}
              >
                {node.label}
              </span>
            )
          })}
        </div>
      ))}
    </div>
  )
}

function buildLevels(nodes: TaskNode[]): TaskNode[][] {
  const remaining = new Set(nodes.map((n) => n.id))
  const byId = new Map(nodes.map((n) => [n.id, n]))
  const levels: TaskNode[][] = []

  while (remaining.size > 0) {
    const level: TaskNode[] = []
    for (const id of Array.from(remaining)) {
      const node = byId.get(id)!
      if (node.dependencies.every((d) => !remaining.has(d))) {
        level.push(node)
      }
    }
    if (level.length === 0) break
    levels.push(level)
    level.forEach((n) => remaining.delete(n.id))
  }

  return levels
}
