"use client"

import { useEffect } from "react"
import Link from "next/link"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html>
      <body className="min-h-screen bg-void flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <p className="font-display text-2xl text-text">Something went wrong</p>
          <p className="text-sm text-text-muted max-w-xs">{error.message ?? "An unexpected error occurred."}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={reset}
              className="px-4 py-2 rounded-lg bg-purple text-white text-sm hover:bg-purple/80 transition-colors"
            >
              Try again
            </button>
            <Link href="/" className="px-4 py-2 rounded-lg border border-white/10 text-text-muted text-sm hover:text-text transition-colors">
              Go home
            </Link>
          </div>
        </div>
      </body>
    </html>
  )
}
