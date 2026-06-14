"use client"

import { useEffect, useState } from "react"
import { Bell, Moon, Sun } from "lucide-react"

interface HeaderProps {
  activeTab: 'dashboard' | 'execution' | 'agents' | 'history'
  setActiveTab: (tab: 'dashboard' | 'execution' | 'agents' | 'history') => void
  hasPlan: boolean
  historyCount: number
  isProcessing: boolean
  apiChecking: boolean
  hasApiKey: boolean
  notifications: Array<{ id: string; text: string; time: string }>
  showNotifications: boolean
  setShowNotifications: (v: boolean) => void
  clearNotifications: () => void
}

export function Header({
  activeTab, setActiveTab, hasPlan, historyCount, isProcessing,
  apiChecking, hasApiKey, notifications, showNotifications, setShowNotifications, clearNotifications
}: HeaderProps) {
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    setIsDarkMode(document.documentElement.classList.contains('dark'))
  }, [])

  const toggleDarkTheme = () => {
    const nextDark = !isDarkMode
    setIsDarkMode(nextDark)
    if (nextDark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  const navItems = [
    { key: 'dashboard' as const, label: 'Dashboard' },
    { key: 'execution' as const, label: `Execution${isProcessing ? ' ⏳' : ''}` },
    { key: 'agents' as const, label: 'Agents' },
    { key: 'history' as const, label: `History (${historyCount})` },
  ]

  return (
    <header className="bg-[#F4F1ED]/95 dark:bg-[#121110]/95 backdrop-blur-md border-b border-[#1A1A1A]/10 dark:border-[#EAE6DF]/10 fixed top-0 w-full z-50 transition-all duration-300">
      <nav className="flex justify-between items-center h-20 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="flex flex-col text-left cursor-pointer" onClick={() => setActiveTab('execution')}>
          <span className="text-[9px] tracking-[0.25em] font-bold uppercase text-stone-500 dark:text-stone-400 leading-none mb-1">Vol. 12 // Sync OS</span>
          <span className="text-2xl font-serif italic tracking-tight font-light text-[#1A1A1A] dark:text-[#EAE6DF]">WorkflowOS</span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => {
                if (item.key === 'dashboard' && !hasPlan) {
                  alert('Please process a meeting transcript first to see the live dashboard.')
                  return
                }
                setActiveTab(item.key)
              }}
              className={`text-[10px] uppercase tracking-widest font-semibold pb-1.5 border-b transition-all duration-300 ${
                activeTab === item.key
                  ? 'text-[#1A1A1A] dark:text-[#EAE6DF] border-[#1A1A1A] dark:border-[#EAE6DF]'
                  : 'text-[#1A1A1A]/50 dark:text-[#EAE6DF]/40 border-transparent hover:text-stone-600 dark:hover:text-stone-300'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-2">
            {apiChecking ? (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
            ) : hasApiKey ? (
              <span className="w-1.5 h-1.5 rounded-full bg-[#1A1A1A] dark:bg-[#EAE6DF]"></span>
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            )}
            <span className="text-[9px] uppercase tracking-wider text-stone-500 dark:text-stone-400 font-semibold font-mono">
              {apiChecking ? 'Checking...' : hasApiKey ? 'GPT-4o' : 'Offline Engine'}
            </span>
          </div>

          <button
            onClick={toggleDarkTheme}
            className="p-2 text-stone-600 dark:text-[#EAE6DF]/70 hover:bg-[#E5E2DD] dark:hover:bg-[#211F1D] border border-transparent hover:border-stone-300 dark:hover:border-stone-800 transition-all active:scale-95"
            aria-label="Toggle UI Theme Mode"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-stone-700" />}
          </button>

          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 text-stone-600 dark:text-[#EAE6DF]/70 hover:bg-[#E5E2DD] dark:hover:bg-[#211F1D] border border-transparent hover:border-stone-300 dark:hover:border-stone-800 transition-all relative"
              aria-label="Open notifications overlay"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-1 h-1 bg-[#ba1a1a] rounded-full"></span>
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 bg-[#E5E2DD] dark:bg-[#1C1A19] border border-[#1A1A1A]/10 dark:border-[#EAE6DF]/10 shadow-lg p-4 z-50 text-[13px]">
                <div className="flex justify-between items-center mb-2 pb-2 border-b border-stone-300/30 dark:border-stone-800">
                  <span className="font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider text-[11px]">System Alerts</span>
                  <button className="text-xs text-[#1A1A1A] dark:text-[#EAE6DF] hover:underline uppercase tracking-wider text-[9px] font-bold" onClick={clearNotifications}>Clear</button>
                </div>
                {notifications.length === 0 ? (
                  <p className="text-[#5f5e62] dark:text-stone-400 italic py-2 text-center text-xs">No active alerts</p>
                ) : (
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {notifications.map((n) => (
                      <div key={n.id} className="text-left py-1 text-[11px] text-stone-700 dark:text-stone-300 border-b border-dotted border-stone-300/30 dark:border-[#EAE6DF]/10 pb-2">
                        <p>{n.text}</p>
                        <span className="text-[9px] text-stone-400 block mt-1 uppercase tracking-widest">{n.time}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="w-8 h-8 bg-[#e4e1e7] overflow-hidden border border-[#1A1A1A]/10 dark:border-[#EAE6DF]/10 flex items-center justify-center">
            <span className="text-xs font-bold text-stone-700">U</span>
          </div>
        </div>
      </nav>
    </header>
  )
}
