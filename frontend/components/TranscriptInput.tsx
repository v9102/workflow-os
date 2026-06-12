"use client"

import { FileText, Send, Loader2, AlertCircle, Upload } from "lucide-react"
import { useRef, useState, useCallback } from "react"

interface TranscriptInputProps {
  transcript: string
  setTranscript: (value: string) => void
  isProcessing: boolean
  onProcess: () => void
  error: string | null
}

const SAMPLE_TRANSCRIPT = `Sarah: Good morning everyone. Let's kick off the sprint planning for the authentication module.

Rakshit: Thanks Sarah. I've reviewed the requirements. The main tasks are: implement OAuth2 flow, add JWT token refresh, and write integration tests.

Sarah: Great. What's the timeline?

Rakshit: OAuth2 flow should be done by Friday. Token refresh depends on the OAuth2 completion, so early next week. Tests can start in parallel once OAuth2 is ready.

Priya: I can handle the integration tests. I'll need the API endpoints documented first though.

Rakshit: I'll document the API endpoints by Thursday. That's a blocker for Priya's tests.

Sarah: Any risks?

Rakshit: The third-party OAuth provider has rate limits we need to handle. That's a medium risk.

Priya: Also, we need to decide on the token storage strategy - cookies vs localStorage.

Sarah: Let's make a decision on that today. Rakshit, you own the OAuth2 implementation. Priya owns tests. I'll coordinate with the security team on token storage.

Rakshit: Sounds good. I'll also set up the CI pipeline for the auth module by Wednesday.`

export function TranscriptInput({ transcript, setTranscript, isProcessing, onProcess, error }: TranscriptInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [focused, setFocused] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handlePasteSample = () => {
    setTranscript(SAMPLE_TRANSCRIPT)
    textareaRef.current?.focus()
  }

  const handleFile = useCallback((file: File) => {
    if (!file.type.match(/text\/plain|text\/markdown|application\/json/) && !file.name.endsWith(".txt") && !file.name.endsWith(".md")) {
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      if (text) setTranscript(text)
    }
    reader.readAsText(file)
  }, [setTranscript])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragOver(true) }
  const handleDragLeave = () => setDragOver(false)

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div
      className="rounded-2xl border transition-all duration-300"
      style={{
        backgroundColor: "var(--color-surface)",
        borderColor: dragOver ? "var(--color-accent)" : focused ? "var(--color-accent)" : "var(--color-border)",
        borderStyle: dragOver ? "dashed" : "solid",
        boxShadow: focused || dragOver
          ? "0 0 0 3px rgba(99, 102, 241, 0.08), 0 1px 3px rgba(0,0,0,0.04)"
          : "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.02)",
      }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <label className="text-sm font-medium flex items-center gap-2" style={{ color: "var(--color-ink)" }}>
          <FileText className="w-4 h-4" style={{ color: "var(--color-accent)" }} />
          Meeting Transcript
        </label>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="text-xs font-medium transition-opacity disabled:opacity-40 hover:opacity-70 flex items-center gap-1"
            style={{ color: "var(--color-accent)" }}
            aria-label="Upload transcript file"
          >
            <Upload className="w-3 h-3" /> Upload
          </button>
          <button
            onClick={handlePasteSample}
            disabled={isProcessing}
            className="text-xs font-medium transition-opacity disabled:opacity-40 hover:opacity-70"
            style={{ color: "var(--color-accent)" }}
          >
            + Load sample
          </button>
        </div>
        <input ref={fileInputRef} type="file" accept=".txt,.md,.json,text/plain" className="hidden" onChange={handleFileInput} aria-hidden="true" />
      </div>

      <form onSubmit={(e) => { e.preventDefault(); onProcess() }} className="px-5 pb-5">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={dragOver ? "Drop file here…" : "Paste your meeting transcript here…"}
            rows={7}
            disabled={isProcessing}
            className="w-full px-4 py-3.5 rounded-xl border text-sm resize-none transition-all duration-200 placeholder:select-none"
            style={{
              backgroundColor: "var(--color-panel)",
              borderColor: "var(--color-border)",
              color: "var(--color-ink)",
            }}
            aria-label="Meeting transcript text"
          />
          {transcript.length > 0 && (
            <div className="absolute bottom-3 right-3 text-2xs" style={{ color: "var(--color-ink-muted)" }}>
              {transcript.length} chars
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2.5 p-3.5 rounded-xl" style={{ backgroundColor: "var(--color-danger-light)", border: "1px solid rgba(244, 63, 94, 0.2)" }} role="alert">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "var(--color-danger)" }} />
            <p className="text-xs" style={{ color: "var(--color-danger-dark)" }}>{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isProcessing || !transcript.trim()}
          className="mt-4 w-full py-3 px-6 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:cursor-not-allowed"
          style={{
            backgroundColor: "var(--color-accent)",
            color: "white",
            opacity: isProcessing || !transcript.trim() ? 0.5 : 1,
          }}
          aria-label={isProcessing ? "Processing transcript" : "Process transcript"}
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing with agent swarm…
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Process Transcript
            </>
          )}
        </button>
      </form>
    </div>
  )
}
