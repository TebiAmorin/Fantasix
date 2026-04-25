"use client"

import { useState, useTransition } from "react"
import Image from "next/image"
import { CheckCircle2, Lock, Loader2, Trophy } from "lucide-react"
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
  // user's existing pick
  userPickId: string | null
  // whether user is logged in
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

  const isCorrect  = pick && winnerId ? pick === winnerId : null
  const dateStr    = scheduledAt
    ? new Date(scheduledAt).toLocaleDateString("en-US", {
        weekday: "short", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : null

  return (
    <div className={`card-tactical rounded-lg p-4 space-y-3 ${
      status === "live" ? "accent-gold-top border-live/20" : ""
    }`}>
      {/* Status + date row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {status === "live" && (
            <span className="flex items-center gap-1 text-[10px] font-medium text-live uppercase tracking-widest">
              <span className="h-1.5 w-1.5 rounded-full bg-live animate-pulse" />
              LIVE
            </span>
          )}
          {status === "completed" && (
            <span className="text-[10px] text-success uppercase tracking-wider font-medium">
              Final
            </span>
          )}
          {status === "scheduled" && dateStr && (
            <span className="text-[10px] text-text-muted">{dateStr}</span>
          )}
        </div>
        <span className="text-[10px] text-text-muted font-stats uppercase">{format}</span>
      </div>

      {/* Teams + pick buttons */}
      <div className="grid grid-cols-2 gap-2">
        {[teamA, teamB].map((team) => {
          const isPicked  = pick === team.id
          const isWinner  = status === "completed" && winnerId === team.id
          const isLoser   = status === "completed" && winnerId !== null && winnerId !== team.id

          let btnClass = "flex flex-col items-center gap-2 p-3 rounded-lg border transition-all text-center "

          if (isWinner && isPicked) {
            btnClass += "border-success/50 bg-success/10" // correct
          } else if (isWinner) {
            btnClass += "border-success/30 bg-success/5"
          } else if (isLoser && isPicked) {
            btnClass += "border-danger/30 bg-danger/5 opacity-60" // wrong pick
          } else if (isLoser) {
            btnClass += "border-white/5 opacity-40"
          } else if (isPicked) {
            btnClass += "border-gold/50 bg-gold/10"
          } else if (locked) {
            btnClass += "border-white/8 opacity-70 cursor-default"
          } else if (!isLoggedIn) {
            btnClass += "border-white/8 cursor-default"
          } else {
            btnClass += "border-white/10 hover:border-white/25 hover:bg-white/3 cursor-pointer"
          }

          return (
            <button
              key={team.id}
              type="button"
              onClick={() => handlePick(team.id)}
              disabled={locked || !isLoggedIn || isPending}
              className={btnClass}
            >
              {team.logo_url && (
                <Image
                  src={team.logo_url} alt={team.name}
                  width={32} height={32}
                  className="object-contain"
                 
                />
              )}
              <span className={`text-sm font-medium ${
                isPicked && !locked ? "text-gold" :
                isWinner ? "text-success" :
                "text-text"
              }`}>
                {team.short_name ?? team.name}
              </span>

              {/* Result badges */}
              {isPicked && !locked && (
                <span className="text-[9px] text-gold uppercase tracking-widest font-medium">Your pick</span>
              )}
              {isWinner && status === "completed" && (
                <Trophy className="h-3.5 w-3.5 text-success" />
              )}
              {isWinner && isPicked && (
                <CheckCircle2 className="h-3.5 w-3.5 text-success" />
              )}
            </button>
          )
        })}
      </div>

      {/* Score (completed) */}
      {status === "completed" && (
        <p className="text-center font-stats text-lg font-bold text-text">
          {mapsA} — {mapsB}
        </p>
      )}

      {/* Lock / login prompt */}
      {locked && status !== "completed" && (
        <p className="flex items-center justify-center gap-1.5 text-xs text-text-muted">
          <Lock className="h-3 w-3" /> Predictions locked
        </p>
      )}
      {!isLoggedIn && !locked && (
        <p className="text-xs text-text-muted text-center">
          <Link href="/login?redirect=/predictions" className="text-gold hover:underline">Sign in</Link>{" "}
          to make predictions
        </p>
      )}
      {isPending && (
        <p className="flex items-center justify-center gap-1.5 text-xs text-text-muted">
          <Loader2 className="h-3 w-3 animate-spin" /> Saving…
        </p>
      )}

      {/* Points earned */}
      {status === "completed" && pick && isCorrect !== null && (
        <div className={`rounded text-center py-1 text-xs font-medium ${
          isCorrect
            ? "bg-success/10 text-success border border-success/20"
            : "bg-white/3 text-text-muted border border-white/8"
        }`}>
          {isCorrect ? "+1 pt ✓" : "0 pts ✗"}
        </div>
      )}
    </div>
  )
}
