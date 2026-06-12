"use client"

import { useEffect, useState, useCallback } from "react"
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from "lucide-react"

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

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle size={18} strokeWidth={1.5} />,
  error: <AlertCircle size={18} strokeWidth={1.5} />,
  warning: <AlertTriangle size={18} strokeWidth={1.5} />,
  info: <Info size={18} strokeWidth={1.5} />,
}

const COLORS: Record<ToastType, { bg: string; border: string; icon: string }> = {
  success: { bg: "rgba(16, 185, 129, 0.08)", border: "rgba(16, 185, 129, 0.2)", icon: "#10B981" },
  error: { bg: "rgba(186, 26, 26, 0.08)", border: "rgba(186, 26, 26, 0.2)", icon: "#ba1a1a" },
  warning: { bg: "rgba(245, 158, 11, 0.08)", border: "rgba(245, 158, 11, 0.2)", icon: "#F59E0B" },
  info: { bg: "rgba(70, 72, 212, 0.08)", border: "rgba(70, 72, 212, 0.2)", icon: "#4648d4" },
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
        const icon = ICONS[t.type]
        const c = COLORS[t.type]
        return (
          <div
            key={t.id}
            className="rounded-xl border p-3 pr-10 animate-slide-up flex items-start gap-2.5 relative"
            style={{ backgroundColor: c.bg, borderColor: c.border }}
          >
            <span className="mt-0.5 flex-shrink-0" style={{ color: c.icon }}>{icon}</span>
            <div>
              <p className="text-sm font-medium text-on-surface">{t.title}</p>
              {t.message && <p className="text-xs mt-0.5 text-secondary">{t.message}</p>}
            </div>
            <button onClick={() => remove(t.id)} className="absolute top-2.5 right-2.5 text-secondary hover:text-on-surface" aria-label="Dismiss">
              <X size={16} strokeWidth={1.5} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
