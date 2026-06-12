import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "WorkflowOS — AI Operating System for Teams",
  description: "Transform meeting transcripts into actionable execution plans using AI agent swarms. Extract tasks, assess risks, assign owners, and generate timelines automatically.",
  keywords: ["AI", "workflow", "meeting", "transcript", "task management", "agent swarm", "Azure OpenAI"],
  authors: [{ name: "WorkflowOS Team" }],
  openGraph: {
    title: "WorkflowOS — AI Operating System for Teams",
    description: "Transform meeting transcripts into actionable execution plans using AI agent swarms.",
    type: "website",
  },
  manifest: "/manifest.json",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme')
                if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark')
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="bg-[#F4F1ED] dark:bg-[#121110] text-[#1A1A1A] dark:text-[#EAE6DF] font-sans min-h-screen flex flex-col transition-colors duration-300">
        {children}
      </body>
    </html>
  )
}
