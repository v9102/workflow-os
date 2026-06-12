"use client"

import { useMemo, useState } from "react"

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

function riskColor(risk: string): string {
  switch (risk) {
    case "High": return "var(--color-danger)"
    case "Medium": return "var(--color-warning)"
    case "Low": return "var(--color-success)"
    default: return "var(--color-ink-muted)"
  }
}

export function DependencyGraph({ tasks }: DependencyGraphProps) {
  const [expanded, setExpanded] = useState(true)

  const nodes = useMemo(() => {
    return tasks.map((t) => ({
      id: t.id,
      label: t.task.length > 30 ? t.task.slice(0, 30) + "…" : t.task,
      risk: t.risk,
      owner: t.owner,
      deadline: t.deadline,
      dependencies: t.dependencies,
    }))
  }, [tasks])

  if (tasks.length === 0) return null

  const levels = buildLevels(nodes)
  const maxLevel = Math.max(...levels.map((l) => l.length), 1)

  return (
    <div className="rounded-xl border p-4" style={{ backgroundColor: "var(--color-panel)", borderColor: "var(--color-border)" }}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full text-left"
        aria-expanded={expanded}
      >
        <span className="text-xs font-semibold" style={{ color: "var(--color-ink)" }}>
          Dependency Graph ({nodes.length} tasks)
        </span>
        <span className="text-xs" style={{ color: "var(--color-ink-muted)" }}>{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div className="mt-3 space-y-3">
          {levels.map((level, li) => (
            <div key={li} className="flex items-center gap-2 flex-wrap">
              <span className="text-2xs font-medium w-12 flex-shrink-0" style={{ color: "var(--color-ink-muted)" }}>
                L{li + 1}
              </span>
              {level.map((node) => (
                <div
                  key={node.id}
                  className="px-2.5 py-1.5 rounded-lg text-xs border text-center min-w-[80px]"
                  style={{
                    backgroundColor: "var(--color-surface)",
                    borderColor: riskColor(node.risk),
                    borderLeft: `3px solid ${riskColor(node.risk)}`,
                  }}
                  title={`${node.label}\nOwner: ${node.owner || "Unassigned"}\nDeadline: ${node.deadline || "—"}`}
                >
                  {node.label}
                </div>
              ))}
            </div>
          ))}
          <div className="flex gap-3 pt-2 border-t text-2xs" style={{ borderColor: "var(--color-border)" }}>
            {["High", "Medium", "Low"].map((r) => (
              <span key={r} className="flex items-center gap-1" style={{ color: "var(--color-ink-muted)" }}>
                <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: riskColor(r) }} />
                {r}
              </span>
            ))}
          </div>
        </div>
      )}
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
