"use client"

import { useEffect } from "react"

export default function AdminError({
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
      <p className="font-display text-xl text-text">Admin Error</p>
      <p className="text-sm text-danger font-mono bg-danger/10 border border-danger/20 rounded px-3 py-2 max-w-md text-left">
        {error.message ?? "An unexpected error occurred."}
      </p>
      <button
        onClick={reset}
        className="px-4 py-2 rounded-lg bg-purple text-white text-sm hover:bg-purple/80 transition-colors"
      >
        Try again
      </button>
    </div>
  )
}
