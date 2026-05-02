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
        <div className="text-center space-y-5">
          <div className="space-y-2">
            <p className="font-display text-2xl text-text">Something went wrong</p>
            <p className="text-sm text-text-muted max-w-xs mx-auto">
              {error.message ?? "An unexpected error occurred."}
            </p>
          </div>
          <div className="flex gap-3 justify-center">
            <button onClick={reset} className="btn-primary">
              Try again
            </button>
            <Link href="/" className="btn-ghost">
              Go home
            </Link>
          </div>
        </div>
      </body>
    </html>
  )
}
