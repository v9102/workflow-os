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
    <header className="border-b border-dark-200 dark:border-dark-700 bg-white/80 dark:bg-dark-900/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-dark-900 dark:text-white">WorkflowOS</h1>
              <p className="text-xs text-dark-500 dark:text-dark-400">AI Operating System for Teams</p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-6 text-sm text-dark-600 dark:text-dark-300">
            <div className="flex items-center gap-1">
              <Zap className="w-4 h-4 text-primary-500" />
              <span>Agent Swarms</span>
            </div>
            <div className="flex items-center gap-1">
              <Shield className="w-4 h-4 text-primary-500" />
              <span>Microsoft 365</span>
            </div>
            <span className="px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-xs font-medium">
              Hackathon MVP
            </span>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}