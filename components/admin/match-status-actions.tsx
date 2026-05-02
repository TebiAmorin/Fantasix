"use client"

import { useTransition } from "react"
import { setMatchLive, setMatchScheduled } from "@/lib/actions/admin"
import { useRouter } from "next/navigation"

interface Props {
  matchId: string
  status: string
}

export function MatchStatusActions({ matchId, status }: Props) {
  const [isPending, start] = useTransition()
  const router = useRouter()

  const goLive = () => {
    start(async () => {
      await setMatchLive(matchId)
      router.refresh()
    })
  }

  const resetScheduled = () => {
    start(async () => {
      await setMatchScheduled(matchId)
      router.refresh()
    })
  }

  if (status === "scheduled") {
    return (
      <button
        type="button"
        onClick={goLive}
        disabled={isPending}
        className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium text-live border border-live/30 bg-live/8 hover:bg-live/15 hover:border-live/50 transition-all duration-200 disabled:opacity-40"
        title="Set match live"
      >
        {isPending ? (
          <svg className="h-2.5 w-2.5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" />
          </svg>
        ) : (
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-live opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-live" />
          </span>
        )}
        → Live
      </button>
    )
  }

  if (status === "live") {
    return (
      <button
        type="button"
        onClick={resetScheduled}
        disabled={isPending}
        className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium text-text-muted border border-white/10 hover:text-text hover:border-white/20 hover:bg-white/5 transition-all duration-200 disabled:opacity-40"
        title="Revert to scheduled"
      >
        {isPending ? (
          <svg className="h-2.5 w-2.5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" />
          </svg>
        ) : "↩"}
        Unset
      </button>
    )
  }

  return null
}
