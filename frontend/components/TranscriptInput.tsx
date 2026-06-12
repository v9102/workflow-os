"use client"

import { useState } from "react"
import { FileText, Upload, Link as LinkIcon, Sparkles, Cpu } from "lucide-react"
import { motion } from "motion/react"
import { PRESET_MEETINGS } from "@/lib/data"

interface TranscriptInputProps {
  transcript: string
  setTranscript: (value: string) => void
  meetingId: string
  setMeetingId: (value: string) => void
  isProcessing: boolean
  onProcess: () => void
}

export function TranscriptInput({ transcript, setTranscript, meetingId, setMeetingId, isProcessing, onProcess }: TranscriptInputProps) {
  const [focused, setFocused] = useState(false)

  const applyPreset = (presetObj: typeof PRESET_MEETINGS[0]) => {
    setTranscript(presetObj.transcript)
    setMeetingId(presetObj.id)
  }

  return (
    <div className="flex flex-col items-center">
      <section className="text-center mb-12 max-w-3xl mt-4">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="font-serif italic font-light text-3xl md:text-5xl text-[#1A1A1A] dark:text-[#EAE6DF] mb-4 tracking-tight leading-[1.15]"
        >
          Transform transcripts into execution plans.
        </motion.h1>
        <p className="text-stone-600 dark:text-stone-400 text-sm md:text-base leading-relaxed max-w-2xl mx-auto mb-8 font-sans font-light">
          Our proprietary agent swarm dissects your meeting notes to build prioritized backlogs, task assignments, and roadmap updates automatically.
        </p>
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 bg-[#E5E2DD]/30 dark:bg-[#1C1A19]/40 border border-[#1A1A1A]/10 dark:border-[#EAE6DF]/10">
          <span className="text-stone-500 dark:text-stone-400 font-bold text-[9px] uppercase tracking-widest">Quick Start</span>
          <span className="bg-[#E5E2DD] dark:bg-[#1C1A19] px-2 py-0.5 text-[10px] text-stone-800 dark:text-stone-200 border border-[#1A1A1A]/10 dark:border-[#EAE6DF]/10 font-mono text-[9px]">Ctrl + Enter</span>
        </div>
      </section>

      <section className="w-full max-w-3xl bg-[#E5E2DD] dark:bg-[#1C1A19] border border-[#1A1A1A]/10 dark:border-[#EAE6DF]/10 p-6 md:p-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5 text-[#1A1A1A] dark:text-[#EAE6DF]">
            <FileText className="w-4 h-4 text-stone-700 dark:text-stone-400" />
            <h2 className="font-serif italic text-lg pr-1">Meeting Transcript</h2>
          </div>
          <div className="flex items-center gap-1.5 bg-[#F4F1ED] dark:bg-[#121110] border border-[#1A1A1A]/15 dark:border-[#EAE6DF]/15 px-2.5 py-1 text-xs">
            <span className="text-stone-500 dark:text-stone-400 font-bold uppercase tracking-widest text-[9px]">Meeting ID:</span>
            <input
              value={meetingId}
              onChange={(e) => setMeetingId(e.target.value)}
              className="bg-transparent focus:outline-none focus:ring-0 text-[#1A1A1A] dark:text-[#EAE6DF] max-w-24 font-mono font-bold"
              placeholder="ID"
            />
          </div>
        </div>

        <div className="relative group">
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className="w-full min-h-[220px] md:min-h-[260px] p-5 bg-[#F4F1ED] dark:bg-[#121110] border border-[#1A1A1A]/10 dark:border-[#EAE6DF]/10 text-[14px] leading-relaxed text-[#1A1A1A] dark:text-[#EAE6DF] focus:bg-white dark:focus:bg-[#121110]/80 outline-none transition-all resize-none placeholder:text-stone-400/90 font-serif italic"
            placeholder="Paste your meeting transcript here... (Zoom, Teams, or manually transcribed notes)"
            disabled={isProcessing}
          ></textarea>
          {transcript.trim() === '' && !focused && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.03] dark:opacity-[0.05]">
              <Cpu className="w-32 h-32 text-[#1A1A1A] dark:text-[#EAE6DF]" />
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-stone-500 text-[13px]">
            <button className="flex items-center gap-1.5 hover:opacity-50 transition-opacity text-[10px] uppercase tracking-widest font-bold text-stone-700 dark:text-stone-400" onClick={() => alert('Feature mock. Drag & Drop PDF, TXT files or select via explorer to parsed transcripts.')}>
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Audio/Text</span>
            </button>
            <div className="w-px h-3.5 bg-[#1A1A1A]/10 dark:bg-[#EAE6DF]/15"></div>
            <button className="flex items-center gap-1.5 hover:opacity-50 transition-opacity text-[10px] uppercase tracking-widest font-bold text-stone-700 dark:text-stone-400" onClick={() => alert('Connect Slack, Teams, Google Drive or Zoom integrations to auto extract.')}>
              <LinkIcon className="w-3.5 h-3.5" />
              <span>Connect Integration</span>
            </button>
          </div>

          <button
            onClick={onProcess}
            disabled={transcript.trim().length < 10 || isProcessing}
            className="w-full sm:w-auto px-6 py-3 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-300 bg-[#1A1A1A] dark:bg-[#EAE6DF] text-white dark:text-[#1A1A1A] hover:opacity-90 disabled:bg-stone-300 dark:disabled:bg-stone-850 disabled:text-stone-500 dark:disabled:text-stone-600 disabled:cursor-not-allowed"
          >
            <span>Process Transcript</span>
            <Sparkles className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      <section className="w-full max-w-3xl mt-12 text-left">
        <div className="w-full mb-4">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-stone-500 dark:text-stone-400 text-left">Click a Corporate Presets to test instantly:</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PRESET_MEETINGS.map((p) => (
            <button
              key={p.id}
              onClick={() => applyPreset(p)}
              className={`p-5 border text-left bg-[#E5E2DD] dark:bg-[#1C1A19] hover:bg-[#F4F1ED] dark:hover:bg-stone-900/60 transition-all relative ${
                transcript === p.transcript ? 'border-[#1A1A1A] dark:border-[#EAE6DF] ring-1 ring-[#1A1A1A] dark:ring-[#EAE6DF]' : 'border-[#1A1A1A]/10 dark:border-[#EAE6DF]/10'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-[11px] text-[#1A1A1A] dark:text-[#EAE6DF] uppercase tracking-wider">{p.name}</span>
                <span className="text-[9px] font-mono bg-[#F4F1ED] dark:bg-[#121110] px-1.5 py-0.5 border border-[#1A1A1A]/5 dark:border-[#EAE6DF]/5 text-stone-600 dark:text-stone-400 font-bold">{p.id}</span>
              </div>
              <p className="text-[12px] text-stone-600 dark:text-stone-450 line-clamp-2 italic font-serif leading-relaxed mt-2.5">
                &ldquo;{p.transcript}&rdquo;
              </p>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-12 flex flex-wrap gap-8 justify-center opacity-85 border-t border-[#1A1A1A]/10 dark:border-[#EAE6DF]/10 pt-8 w-full max-w-3xl">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-stone-600 dark:text-stone-400">
          <div className="w-4 h-4 bg-[#1A1A1A] dark:bg-[#EAE6DF] text-white dark:text-[#1A1A1A] flex items-center justify-center text-[8px]">✓</div>
          <span>Auto-task Generation</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-stone-600 dark:text-stone-400">
          <div className="w-4 h-4 bg-[#1A1A1A] dark:bg-[#EAE6DF] text-white dark:text-[#1A1A1A] flex items-center justify-center text-[8px]">✓</div>
          <span>Owner identification</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-stone-600 dark:text-stone-400">
          <div className="w-4 h-4 bg-[#1A1A1A] dark:bg-[#EAE6DF] text-white dark:text-[#1A1A1A] flex items-center justify-center text-[8px]">✓</div>
          <span>Project syncing</span>
        </div>
      </section>
    </div>
  )
}
