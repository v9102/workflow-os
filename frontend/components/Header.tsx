"use client"

import { Brain, Zap, Shield } from "lucide-react"

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
        </div>
      </div>
    </header>
  )
}