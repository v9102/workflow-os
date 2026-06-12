"use client"

export function Footer() {
  return (
    <footer className="border-t" style={{ borderColor: "var(--color-border)" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs" style={{ color: "var(--color-ink-muted)" }}>
            WorkflowOS — Microsoft Build AI Hackathon 2026
          </span>
          <span className="text-xs" style={{ color: "var(--color-ink-muted)" }}>
            Built with Azure AI Foundry, Next.js, FastAPI
          </span>
        </div>
      </div>
    </footer>
  )
}
