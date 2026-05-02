"use client"

import { useEffect, useState } from "react"

const EVENT_DATE = new Date("2026-05-08T18:00:00Z") // Playins start

function pad(n: number) { return String(n).padStart(2, "0") }

export function CountdownHero() {
  const [diff, setDiff] = useState(() => EVENT_DATE.getTime() - Date.now())

  useEffect(() => {
    const id = setInterval(() => setDiff(EVENT_DATE.getTime() - Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  if (diff <= 0) {
    return (
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-live opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-live" />
        </span>
        <span className="font-display text-sm text-live uppercase tracking-widest">Event is live</span>
      </div>
    )
  }

  const days  = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const mins  = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const secs  = Math.floor((diff % (1000 * 60)) / 1000)

  const units = [
    { v: days,  l: "days" },
    { v: hours, l: "hrs"  },
    { v: mins,  l: "min"  },
    { v: secs,  l: "sec"  },
  ]

  return (
    <div
      className="inline-flex items-center gap-1 rounded-2xl px-5 py-3.5"
      style={{
        background: "rgba(255,255,255,0.04)",
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.06)",
      }}
    >
      {units.map(({ v, l }, i) => (
        <div key={l} className="flex items-center gap-1">
          {i > 0 && (
            <span className="font-stats text-text-dim/40 text-xl mx-0.5 tabular-nums">:</span>
          )}
          <div className="text-center min-w-[2.5rem]">
            <p className="font-stats text-3xl font-bold text-text tabular-nums leading-none tracking-tight">
              {pad(v)}
            </p>
            <p className="text-[9px] text-text-dim uppercase tracking-[0.2em] mt-1 font-display">{l}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
