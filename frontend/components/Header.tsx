"use client"

import { Brain, Zap, Shield } from "lucide-react"

export function Header() {
  return (
    <header className="border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">WorkflowOS</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">AI Operating System for Teams</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-gray-600 dark:text-gray-300">
            <div className="flex items-center gap-1"><Zap className="w-4 h-4 text-blue-500" /><span>Agent Swarms</span></div>
            <div className="flex items-center gap-1"><Shield className="w-4 h-4 text-blue-500" /><span>Microsoft 365</span></div>
            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">Hackathon MVP</span>
          </div>
        </div>
      </div>
    </header>
  )
}
