"use client"

import { FileText, Send, Loader2, AlertCircle, CheckCircle } from "lucide-react"
import { useRef } from "react"

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onProcess()
  }

  return (
    <div className="bg-white dark:bg-dark-800 rounded-2xl border border-dark-200 dark:border-dark-700 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-dark-900 dark:text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary-500" />
          Meeting Transcript
        </label>
        <button
          onClick={handlePasteSample}
          disabled={isProcessing || transcript.length > 0}
          className="text-sm text-primary-600 dark:text-primary-400 hover:underline disabled:opacity-50 flex items-center gap-1"
        >
          + Load sample
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Paste your meeting transcript here..."
            rows={6}
            className="w-full px-4 py-3 border border-dark-300 dark:border-dark-600 rounded-xl bg-dark-50 dark:bg-dark-900 text-dark-900 dark:text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none transition-all"
            disabled={isProcessing}
          />
          {transcript.length > 0 && (
            <div className="absolute bottom-3 right-3 text-xs text-dark-400">
              {transcript.length} characters
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2.5 p-3.5 rounded-xl" style={{ backgroundColor: "var(--color-danger-light)", border: "1px solid rgba(244, 63, 94, 0.2)" }}>
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "var(--color-danger)" }} />
            <p className="text-xs" style={{ color: "var(--color-danger-dark)" }}>{error}</p>
          </div>
        )}

        <button
          type="submit"
          onClick={onProcess}
          disabled={isProcessing || !transcript.trim()}
          className="mt-4 w-full py-3 px-6 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
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