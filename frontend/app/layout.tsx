import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

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
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#FAFAF8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={`${inter.variable} font-sans`}>{children}</body>
    </html>
  )
}
