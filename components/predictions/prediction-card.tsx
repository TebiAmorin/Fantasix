"use client"

import { useState, useTransition } from "react"
import Image from "next/image"
import { Lock, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { submitPrediction } from "@/lib/actions/user"
import Link from "next/link"

interface Team {
  id: string
  name: string
  short_name: string | null
  logo_url: string | null
}

interface PredictionCardProps {
  matchId: string
  teamA: Team
  teamB: Team
  format: string
  scheduledAt: string | null
  status: "scheduled" | "live" | "completed" | "cancelled"
  winnerId: string | null
  mapsA: number
  mapsB: number
  userPickId: string | null
  isLoggedIn: boolean
}

export function PredictionCard({
  matchId, teamA, teamB, format, scheduledAt,
  status, winnerId, mapsA, mapsB,
  userPickId, isLoggedIn,
}: PredictionCardProps) {
  const [pick, setPick]    = useState<string | null>(userPickId)
  const [isPending, start] = useTransition()
  const locked = status !== "scheduled"

  const handlePick = (teamId: string) => {
    if (locked || !isLoggedIn || isPending) return
    start(async () => {
      const fd = new FormData()
      fd.set("match_id",  matchId)
      fd.set("winner_id", teamId)
      const result = await submitPrediction(fd)
      if (result.error) {
        toast.error(result.error)
      } else {
        setPick(teamId)
        toast.success("Pick saved!")
      }
    })
  }

  const isCorrect = pick && winnerId ? pick === winnerId : null
  const dateStr   = scheduledAt
    ? new Date(scheduledAt).toLocaleDateString("en-US", {
        weekday: "short", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : null

  return (
    <div className={`relative rounded-xl overflow-hidden transition-all duration-500 ${
      status === "live"
        ? "border border-live/25 bg-surface/80"
        : "card-tactical"
    }`}>
      {/* Live accent bar */}
      {status === "live" && (
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-live/60 to-transparent" />
      )}

      <div className="p-4 space-y-3">
        {/* Status + format */}
        <div className="flex items-center justify-between">
          <div>
            {status === "live" && (
              <span className="flex items-center gap-1.5 text-[10px] font-medium text-live uppercase tracking-[0.2em]">
                <span className="h-1.5 w-1.5 rounded-full bg-live animate-pulse" />
                Live
              </span>
            )}
            {status === "completed" && (
              <span className="text-[10px] text-success uppercase tracking-[0.15em] font-medium">Final</span>
            )}
            {status === "scheduled" && dateStr && (
              <span className="text-[10px] text-text-muted tracking-wide">{dateStr}</span>
            )}
          </div>
          <span className="text-[9px] text-text-dim font-stats uppercase tracking-[0.2em] border border-white/8 rounded px-1.5 py-0.5">{format}</span>
        </div>

        {/* Teams */}
        <div className="grid grid-cols-2 gap-2">
          {([teamA, teamB] as const).map((team) => {
            const isPicked = pick === team.id
            const isWinner = status === "completed" && winnerId === team.id
            const isLoser  = status === "completed" && winnerId !== null && winnerId !== team.id

            let ring = ""
            let bg   = ""
            let opacity = ""

            if (isWinner && isPicked) {
              ring = "border-success/50"; bg = "bg-success/8"
            } else if (isWinner) {
              ring = "border-success/25"; bg = "bg-success/5"
            } else if (isLoser && isPicked) {
              ring = "border-danger/25"; bg = "bg-danger/5"; opacity = "opacity-55"
            } else if (isLoser) {
              ring = "border-white/5"; bg = ""; opacity = "opacity-35"
            } else if (isPicked) {
              ring = "border-gold/45"; bg = "bg-gold/8"
            } else if (locked || !isLoggedIn) {
              ring = "border-white/8"; bg = ""
            } else {
              ring = "border-white/10 hover:border-purple/40 hover:bg-purple/5"
              bg   = ""
            }

            const canClick = !locked && isLoggedIn && !isPending

            return (
              <button
                key={team.id}
                type="button"
                onClick={() => handlePick(team.id)}
                disabled={!canClick}
                className={`relative flex flex-col items-center gap-2 p-3 rounded-lg border transition-all duration-500 text-center ${ring} ${bg} ${opacity} ${canClick ? "cursor-pointer active:scale-[0.97]" : "cursor-default"}`}
              >
                {/* Winner glow */}
                {isWinner && (
                  <div className="absolute inset-0 rounded-lg bg-success/4 pointer-events-none" />
                )}

                {/* Logo */}
                <div className="h-9 w-9 flex items-center justify-center">
                  {team.logo_url ? (
                    <Image
                      src={team.logo_url} alt={team.name}
                      width={36} height={36}
                      className={`object-contain transition-all duration-300 ${isLoser && !isPicked ? "grayscale" : ""}`}
                    />
                  ) : (
                    <div className="h-9 w-9 rounded-lg bg-purple/15 border border-purple/20 flex items-center justify-center">
                      <span className="font-display text-purple text-xs font-bold">
                        {(team.short_name ?? team.name).slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Team name */}
                <span className={`text-xs font-display font-bold uppercase tracking-wider leading-none ${
                  isPicked && !locked ? "text-gold" :
                  isWinner ? "text-success" :
                  isLoser && !isPicked ? "text-text-muted" :
                  "text-text"
                }`}>
                  {team.short_name ?? team.name}
                </span>

                {/* Badges */}
                {isPicked && !locked && (
                  <span className="text-[8px] text-gold uppercase tracking-[0.25em] font-medium leading-none">Your pick</span>
                )}
                {isWinner && (
                  <svg className="h-3 w-3 text-success" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                )}
              </button>
            )
          })}
        </div>

        {/* Score */}
        {status === "completed" && (
          <div className="flex items-center justify-center gap-3 pt-0.5">
            <span className="font-stats text-2xl font-bold text-text">{mapsA}</span>
            <span className="text-text-muted text-xs font-stats">—</span>
            <span className="font-stats text-2xl font-bold text-text">{mapsB}</span>
          </div>
        )}

        {/* Footer states */}
        {locked && status !== "completed" && (
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-text-muted pt-0.5">
            <Lock className="h-3 w-3" />
            Predictions locked
          </div>
        )}
        {!isLoggedIn && !locked && (
          <p className="text-[11px] text-text-muted text-center pt-0.5">
            <Link href="/login?redirect=/predictions" className="text-gold hover:underline transition-colors">Sign in</Link>
            {" "}to make picks
          </p>
        )}
        {isPending && (
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-text-muted pt-0.5">
            <Loader2 className="h-3 w-3 animate-spin" />
            Saving…
          </div>
        )}

        {/* Points earned */}
        {status === "completed" && pick && isCorrect !== null && (
          <div className={`rounded-lg text-center py-1.5 text-[11px] font-stats font-bold tracking-wide ${
            isCorrect
              ? "bg-success/8 text-success border border-success/20"
              : "bg-white/3 text-text-muted border border-white/6"
          }`}>
            {isCorrect ? "+1 pt · Correct ✓" : "0 pts · Incorrect ✗"}
          </div>
        )}
      </div>
    </div>
  )
}
