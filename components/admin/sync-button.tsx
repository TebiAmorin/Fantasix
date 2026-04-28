"use client"

import { useState, useTransition } from "react"
import { triggerSync } from "@/lib/actions/admin"
import { useRouter } from "next/navigation"

export function SyncButton() {
  const [isPending, start] = useTransition()
  const [result, setResult] = useState<{
    ok: boolean
    matches_created?: number
    matches_updated?: number
    warning?: string
    error?: string
    duration_ms?: number
  } | null>(null)
  const router = useRouter()

  const handleSync = () => {
    setResult(null)
    start(async () => {
      const res = await triggerSync()
      setResult(res)
      router.refresh()
    })
  }

  return (
    <div className="space-y-3">
      <button
        onClick={handleSync}
        disabled={isPending}
        className={`flex items-center gap-2.5 px-5 py-2.5 rounded-full text-sm font-display font-bold uppercase tracking-wider transition-all duration-500 ${
          isPending
            ? "bg-white/5 text-text-muted border border-white/10 cursor-wait"
            : "btn-primary cursor-pointer"
        }`}
      >
        {isPending ? (
          <>
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Syncing…
          </>
        ) : (
          <>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            Sync Now
          </>
        )}
      </button>

      {result && (
        <div className={`rounded-lg px-4 py-3 text-sm border ${
          result.ok
            ? result.warning
              ? "bg-gold/6 border-gold/20 text-gold"
              : "bg-success/8 border-success/20 text-success"
            : "bg-danger/8 border-danger/20 text-danger"
        }`}>
          {result.error && (
            <p className="font-medium">Error: {result.error}</p>
          )}
          {result.warning && (
            <p>{result.warning}</p>
          )}
          {result.ok && !result.warning && (
            <div className="flex items-center gap-4">
              <span>
                <span className="font-stats font-bold">+{result.matches_created}</span>
                <span className="text-success/70 ml-1 text-xs">created</span>
              </span>
              <span>
                <span className="font-stats font-bold">{result.matches_updated}</span>
                <span className="text-success/70 ml-1 text-xs">updated</span>
              </span>
              {result.duration_ms && (
                <span className="text-success/60 text-xs font-stats ml-auto">
                  {result.duration_ms}ms
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
