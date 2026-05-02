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
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center space-y-5">
      <div className="space-y-2">
        <p className="font-display text-xl text-text">Something went wrong</p>
        <p className="text-sm text-text-muted max-w-xs">
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
  )
}
