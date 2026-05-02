"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

interface LiveRefreshProps {
  /** Number of live matches. If 0, no polling happens. */
  liveCount: number
  /** Interval in seconds. Default 30. */
  intervalSecs?: number
}

/**
 * Invisible component — mounts a polling interval that calls router.refresh()
 * whenever there are live matches. Stops automatically when all matches settle.
 * Placed once on the predictions page, outside PhaseTabs.
 */
export function LiveRefresh({ liveCount, intervalSecs = 30 }: LiveRefreshProps) {
  const router = useRouter()
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (liveCount === 0) {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      return
    }

    const tick = () => {
      if (!document.hidden) router.refresh()
    }

    timerRef.current = setInterval(tick, intervalSecs * 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [liveCount, intervalSecs, router])

  if (liveCount === 0) return null

  return (
    <div className="flex items-center gap-1.5 text-[10px] text-live/60 font-stats">
      <span className="relative flex h-1.5 w-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-live opacity-60" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-live/80" />
      </span>
      Auto-updating
    </div>
  )
}
