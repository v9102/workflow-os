"use client"

import { useEffect, useState, useCallback } from "react"
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react"

export type ToastType = "success" | "error" | "warning" | "info"

export interface ToastMessage {
  id: string
  type: ToastType
  title: string
  message?: string
}

let _addToast: ((t: Omit<ToastMessage, "id">) => void) | null = null

export function toast(type: ToastType, title: string, message?: string) {
  _addToast?.({ type, title, message })
}

const ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
}

const COLORS = {
  success: { bg: "rgba(16, 185, 129, 0.1)", border: "rgba(16, 185, 129, 0.3)", icon: "var(--color-success)" },
  error: { bg: "rgba(244, 63, 94, 0.1)", border: "rgba(244, 63, 94, 0.3)", icon: "var(--color-danger)" },
  warning: { bg: "rgba(245, 158, 11, 0.1)", border: "rgba(245, 158, 11, 0.3)", icon: "var(--color-warning)" },
  info: { bg: "rgba(99, 102, 241, 0.1)", border: "rgba(99, 102, 241, 0.3)", icon: "var(--color-accent)" },
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const addToast = useCallback((t: Omit<ToastMessage, "id">) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { ...t, id }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id))
    }, 4000)
  }, [])

  useEffect(() => {
    _addToast = addToast
    return () => { _addToast = null }
  }, [addToast])

  const remove = (id: string) => setToasts((prev) => prev.filter((x) => x.id !== id))

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm" role="status" aria-live="polite">
      {toasts.map((t) => {
        const Icon = ICONS[t.type]
        const c = COLORS[t.type]
        return (
          <div
            key={t.id}
            className="rounded-xl border p-3 pr-10 shadow-soft-lg animate-slide-up flex items-start gap-2.5 relative"
            style={{ backgroundColor: c.bg, borderColor: c.border }}
          >
            <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: c.icon }} />
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--color-ink)" }}>{t.title}</p>
              {t.message && <p className="text-xs mt-0.5" style={{ color: "var(--color-ink-muted)" }}>{t.message}</p>}
            </div>
            <button onClick={() => remove(t.id)} className="absolute top-2.5 right-2.5" aria-label="Dismiss">
              <X className="w-3.5 h-3.5" style={{ color: "var(--color-ink-muted)" }} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
