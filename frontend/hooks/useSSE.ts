"use client"

import { useEffect, useRef, useCallback } from "react"

interface SSEOptions {
  onActivity: (data: any) => void
  onDone: (status: string) => void
  onTimeout: () => void
  onError: (err: string) => void
  enabled: boolean
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export function useSSE(sessionId: string | null, options: SSEOptions) {
  const { onActivity, onDone, onTimeout, onError, enabled } = options
  const eventSourceRef = useRef<EventSource | null>(null)

  const connect = useCallback(() => {
    if (!sessionId || !enabled) return
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }
    const es = new EventSource(`${API_URL}/api/activities/${sessionId}/stream`)
    eventSourceRef.current = es

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.event === "done") {
          onDone(data.status || "completed")
          es.close()
        } else if (data.event === "timeout") {
          onTimeout()
          es.close()
        } else {
          onActivity(data)
        }
      } catch {
        onError("Failed to parse SSE data")
      }
    }

    es.onerror = () => {
      onError("SSE connection error")
      es.close()
    }
  }, [sessionId, enabled, onActivity, onDone, onTimeout, onError])

  useEffect(() => {
    connect()
    return () => {
      eventSourceRef.current?.close()
    }
  }, [connect])

  const disconnect = useCallback(() => {
    eventSourceRef.current?.close()
    eventSourceRef.current = null
  }, [])

  return { disconnect }
}
