"use client"

import { useEffect, useState } from "react"

interface MatchTimeProps {
  scheduledAt: string | null
  className?: string
  showTz?: boolean
}

export function MatchTime({ scheduledAt, className = "", showTz = false }: MatchTimeProps) {
  const [label, setLabel]   = useState<string | null>(null)
  const [tzLabel, setTzLabel] = useState<string | null>(null)

  useEffect(() => {
    if (!scheduledAt) { setLabel(null); return }
    const d   = new Date(scheduledAt)
    const now = new Date()
    const isToday    = d.toDateString() === now.toDateString()
    const isTomorrow = d.toDateString() === new Date(Date.now() + 86400000).toDateString()

    const timeStr = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    const dateStr = d.toLocaleDateString([], { month: "short", day: "numeric" })

    if (isToday)         setLabel(`Today · ${timeStr}`)
    else if (isTomorrow) setLabel(`Tomorrow · ${timeStr}`)
    else                 setLabel(`${dateStr} · ${timeStr}`)

    // Timezone abbreviation (e.g. "CET", "EST", "JST")
    try {
      const tz = Intl.DateTimeFormat(undefined, { timeZoneName: "short" })
        .formatToParts(d)
        .find(p => p.type === "timeZoneName")?.value ?? null
      setTzLabel(tz)
    } catch {
      setTzLabel(null)
    }
  }, [scheduledAt])

  if (!label) return null

  return (
    <span className={className}>
      {label}
      {showTz && tzLabel && (
        <span className="opacity-40 ml-1">{tzLabel}</span>
      )}
    </span>
  )
}
