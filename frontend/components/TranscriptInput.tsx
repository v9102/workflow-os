"use client"

import { FileText, Send, Loader2, AlertCircle } from "lucide-react"
import { useRef, useState } from "react"

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

  const handlePasteSample = () => {
    setTranscript(SAMPLE_TRANSCRIPT)
    textareaRef.current?.focus()
  }

  return (
    <div
      className="rounded-2xl border transition-all duration-300"
      style={{
        backgroundColor: "var(--color-surface)",
        borderColor: focused ? "var(--color-accent)" : "var(--color-border)",
        boxShadow: focused
          ? "0 0 0 3px rgba(99, 102, 241, 0.08), 0 1px 3px rgba(0,0,0,0.04)"
          : "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.02)",
      }}
    >
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <label className="text-sm font-medium flex items-center gap-2" style={{ color: "var(--color-ink)" }}>
          <FileText className="w-4 h-4" style={{ color: "var(--color-accent)" }} />
          Meeting Transcript
        </label>
        <button
          onClick={handlePasteSample}
          disabled={isProcessing}
          className="text-xs font-medium transition-opacity disabled:opacity-40 hover:opacity-70"
          style={{ color: "var(--color-accent)" }}
        >
          + Load sample
        </button>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); onProcess() }} className="px-5 pb-5">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Paste your meeting transcript here…"
            rows={7}
            disabled={isProcessing}
            className="w-full px-4 py-3.5 rounded-xl border text-sm resize-none transition-all duration-200 placeholder:select-none"
            style={{
              backgroundColor: "var(--color-panel)",
              borderColor: "var(--color-border)",
              color: "var(--color-ink)",
            }}
          />
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2.5 p-3.5 rounded-xl" style={{ backgroundColor: "var(--color-danger-light)", border: "1px solid rgba(244, 63, 94, 0.2)" }}>
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
          onMouseEnter={(e) => {
            if (!isProcessing && transcript.trim()) e.currentTarget.style.opacity = "0.9"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = isProcessing || !transcript.trim() ? "0.5" : "1"
          }}
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
