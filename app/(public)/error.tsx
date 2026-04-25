"use client"

import { useEffect } from "react"
import Link from "next/link"

export default function PublicError({
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
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center space-y-4">
      <p className="font-display text-xl text-text">Something went wrong</p>
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
  )
}
