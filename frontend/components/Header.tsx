"use client"

import { Brain, Moon, Sun } from "lucide-react"
import { useEffect, useState } from "react"

function ThemeToggle() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"))
  }, [])

  const toggle = () => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle("dark", next)
    localStorage.setItem("theme", next ? "dark" : "light")
  }

  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark mode"
      className="relative w-9 h-9 flex items-center justify-center rounded-xl text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
    >
      <Sun className={`w-4 h-4 absolute transition-all duration-300 ${dark ? "opacity-0 scale-0 rotate-90" : "opacity-100 scale-100 rotate-0"}`} />
      <Moon className={`w-4 h-4 absolute transition-all duration-300 ${dark ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-0 -rotate-90"}`} />
    </button>
  )
}

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-border)]" style={{ backgroundColor: "var(--color-glass)", backdropFilter: "blur(12px)" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl" style={{ backgroundColor: "var(--color-accent)" }}>
              <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <span className="text-base sm:text-lg font-display font-semibold tracking-tight" style={{ color: "var(--color-ink)" }}>
              WorkflowOS
            </span>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
