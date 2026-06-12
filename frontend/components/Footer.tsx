"use client"

export function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-900/50 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-sm text-gray-600 dark:text-gray-400">WorkflowOS — Microsoft Build AI Hackathon 2026</span>
          <span className="text-sm text-gray-500 dark:text-gray-400">Built with Azure AI Foundry, Next.js, FastAPI</span>
        </div>
      </div>
    </footer>
  )
}
