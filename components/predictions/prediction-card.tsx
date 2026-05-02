"use client"

import { useState, useTransition, useEffect } from "react"
import Image from "next/image"
import { toast } from "sonner"
import { submitPrediction } from "@/lib/actions/user"
import Link from "next/link"
import { LockedIcon } from "@/components/icons/rank-icons"

// ── TimeToPick ─────────────────────────────────────────────────────────────────

function TimeToPick({ scheduledAt }: { scheduledAt: string }) {
  const target = new Date(scheduledAt).getTime()
  const [diff, setDiff] = useState(() => target - Date.now())

  useEffect(() => {
    if (diff <= 0) return
    const id = setInterval(() => {
      const remaining = target - Date.now()
      setDiff(remaining)
      if (remaining <= 0) clearInterval(id)
    }, 1000)
    return () => clearInterval(id)
  }, [target]) // eslint-disable-line react-hooks/exhaustive-deps

  if (diff <= 0) return null

  const totalSecs = Math.floor(diff / 1000)
  const h = Math.floor(totalSecs / 3600)
  const m = Math.floor((totalSecs % 3600) / 60)
  const s = totalSecs % 60

  const isUrgent = diff < 30 * 60 * 1000
  const label = h > 0
    ? `Locks in ${h}h ${m}m`
    : m > 0
    ? `Locks in ${m}m ${s}s`
    : `Locks in ${s}s`

  return (
    <span className={`flex items-center gap-1 text-[9px] font-stats tabular-nums ${
      isUrgent ? "text-live animate-pulse font-bold" : "text-text-muted"
    }`}>
      <svg className="h-2.5 w-2.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
      </svg>
      {label}
    </span>
  )
}

// ── Types ──────────────────────────────────────────────────────────────────────

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
  roundName: string | null
  scheduledAt: string | null
  status: "scheduled" | "live" | "completed" | "cancelled"
  winnerId: string | null
  mapsA: number
  mapsB: number
  userPickId: string | null
  isLoggedIn: boolean
  communityA?: number
  communityB?: number
}

// ── Team logo ──────────────────────────────────────────────────────────────────

function TeamLogo({ team, size = 46 }: { team: Team; size?: number }) {
  if (team.logo_url) {
    return (
      <Image
        src={team.logo_url}
        alt={team.name}
        width={size}
        height={size}
        className="object-contain drop-shadow-md"
      />
    )
  }
  return (
    <div
      className="rounded-xl bg-red/10 border border-red/20 flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <span className="font-display text-red font-bold" style={{ fontSize: size * 0.28 }}>
        {(team.short_name ?? team.name).slice(0, 2).toUpperCase()}
      </span>
    </div>
  )
}

// ── Main card ──────────────────────────────────────────────────────────────────

export function PredictionCard({
  matchId, teamA, teamB, format, roundName, scheduledAt,
  status, winnerId, mapsA, mapsB,
  userPickId, isLoggedIn,
  communityA = 0, communityB = 0,
}: PredictionCardProps) {
  const [pick, setPick]    = useState<string | null>(userPickId)
  const [isPending, start] = useTransition()
  const locked = status !== "scheduled"

  const handlePick = (teamId: string) => {
    if (locked || !isLoggedIn || isPending) return
    if (teamId === pick) return
    const previousPick = pick
    setPick(teamId) // optimistic — show immediately
    start(async () => {
      const fd = new FormData()
      fd.set("match_id",  matchId)
      fd.set("winner_id", teamId)
      const result = await submitPrediction(fd)
      if (result.error) {
        setPick(previousPick) // revert on failure
        toast.error(result.error)
      } else {
        toast.success(previousPick !== null ? "Pick updated!" : "Pick saved!")
      }
    })
  }

  const isLive      = status === "live"
  const isCompleted = status === "completed"
  const pickA = pick === teamA.id
  const pickB = pick === teamB.id
  const winA  = isCompleted && winnerId === teamA.id
  const winB  = isCompleted && winnerId === teamB.id
  const loseA = isCompleted && winnerId !== null && winnerId !== teamA.id
  const loseB = isCompleted && winnerId !== null && winnerId !== teamB.id
  const isCorrect = pick && winnerId ? pick === winnerId : null
  const canClick  = !locked && isLoggedIn && !isPending

  // Gradient background per side
  const sideBg = (isPicked: boolean, isWin: boolean, isLose: boolean) => {
    if (isWin && isPicked) return "linear-gradient(180deg, rgba(52,211,153,0.16) 0%, rgba(52,211,153,0.05) 65%, transparent 100%)"
    if (isWin)             return "linear-gradient(180deg, rgba(52,211,153,0.08) 0%, transparent 75%)"
    if (isLose && isPicked)return "linear-gradient(180deg, rgba(248,113,113,0.08) 0%, transparent 80%)"
    if (isLose)            return "transparent"
    if (isPicked)          return "linear-gradient(180deg, rgba(245,200,66,0.16) 0%, rgba(245,200,66,0.05) 65%, transparent 100%)"
    return "transparent"
  }

  // Border + shadow ring per side
  const sideRing = (isPicked: boolean, isWin: boolean, isLose: boolean) => {
    if (isWin && isPicked)  return "border-success/40 shadow-[0_0_20px_rgba(52,211,153,0.18),inset_0_1px_0_rgba(52,211,153,0.12)]"
    if (isWin)              return "border-success/20"
    if (isLose && isPicked) return "border-danger/20 opacity-55"
    if (isLose)             return "border-white/5 opacity-25"
    if (isPicked)           return "border-gold/50 shadow-[0_0_22px_rgba(245,200,66,0.22),inset_0_1px_0_rgba(245,200,66,0.14)]"
    if (locked || !isLoggedIn) return "border-white/8"
    return "border-white/10"
  }

  const dateStr = scheduledAt
    ? new Date(scheduledAt).toLocaleDateString("en-US", {
        weekday: "short", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : null

  // Community
  const totalCommunity = communityA + communityB
  const showCommunity  = totalCommunity >= 3
  const pctA = totalCommunity > 0 ? Math.round((communityA / totalCommunity) * 100) : 50
  const pctB = 100 - pctA
  const shortA = teamA.short_name ?? teamA.name.slice(0, 3).toUpperCase()
  const shortB = teamB.short_name ?? teamB.name.slice(0, 3).toUpperCase()

  return (
    <div
      className={`relative rounded-2xl overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${
        isLive
          ? "shadow-[0_0_0_1px_rgba(251,146,60,0.22),0_0_40px_rgba(251,146,60,0.08)]"
          : "shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_4px_16px_rgba(0,0,0,0.3)]"
      }`}
      style={{ background: "rgba(11,12,18,0.96)" }}
    >
      {/* Live accent bar */}
      {isLive && (
        <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-live/80 to-transparent" />
      )}
      {/* Completed top accent */}
      {isCompleted && isCorrect && (
        <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-success/50 to-transparent" />
      )}
      {/* Inner highlight */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/7 to-transparent pointer-events-none" />

      <div className="p-4 space-y-3">

        {/* ── Meta bar ── */}
        <div className="flex items-center justify-between gap-2 min-h-[18px]">
          <div className="flex items-center gap-2 flex-wrap">
            {isLive && (
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-live uppercase tracking-[0.2em]">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-live opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-live" />
                </span>
                Live
              </span>
            )}
            {isCompleted && (
              <span className="text-[10px] tracking-[0.18em] font-medium" style={{ color: isCorrect ? "rgba(52,211,153,0.85)" : "rgba(107,114,128,0.9)" }}>
                {isCorrect === true ? "✓ FINAL" : isCorrect === false ? "✗ FINAL" : "FINAL"}
              </span>
            )}
            {status === "scheduled" && dateStr && (
              <span className="text-[10px] text-text-muted tracking-wide">{dateStr}</span>
            )}
            {status === "scheduled" && scheduledAt && (
              <TimeToPick scheduledAt={scheduledAt} />
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {roundName && (
              <span className="text-[9px] text-text-dim/70 font-display uppercase tracking-[0.15em] border border-white/6 rounded-md px-1.5 py-0.5 bg-white/2 hidden sm:inline-flex">
                {roundName}
              </span>
            )}
            <span className="text-[9px] text-text-dim font-stats uppercase tracking-[0.18em] border border-white/8 rounded-md px-1.5 py-0.5 bg-white/2">
              {format}
            </span>
          </div>
        </div>

        {/* ── Match face-off ── */}
        <div className="flex items-stretch gap-2">

          {/* Team A */}
          <button
            type="button"
            onClick={() => handlePick(teamA.id)}
            disabled={!canClick}
            className={`group relative flex-1 flex flex-col items-center gap-2 sm:gap-2.5 px-2 sm:px-3 py-4 sm:py-4 min-h-[96px] rounded-xl border overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] text-center ${sideRing(pickA, winA, loseA)} ${canClick ? "cursor-pointer active:scale-[0.97]" : "cursor-default"}`}
            style={{ background: sideBg(pickA, winA, loseA) }}
          >
            {/* Hover overlay — only when not picked and not locked */}
            {canClick && !pickA && (
              <div className="absolute inset-0 bg-gradient-to-b from-white/6 to-white/2 opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none" />
            )}
            {/* Picked shimmer overlay */}
            {pickA && !locked && (
              <div className="absolute inset-0 pick-shimmer pointer-events-none" />
            )}

            <div className="relative z-10">
              <TeamLogo team={teamA} size={46} />
              {pickA && !locked && (
                <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-gold flex items-center justify-center shadow-[0_0_8px_rgba(245,200,66,0.7)]">
                  <svg className="h-2 w-2 text-void" fill="none" stroke="currentColor" strokeWidth="3.5" viewBox="0 0 24 24">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </div>
              )}
              {winA && (
                <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-success flex items-center justify-center shadow-[0_0_8px_rgba(52,211,153,0.6)]">
                  <svg className="h-2 w-2 text-void" fill="none" stroke="currentColor" strokeWidth="3.5" viewBox="0 0 24 24">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </div>
              )}
            </div>

            <span className={`relative z-10 text-[11px] font-display font-bold uppercase tracking-wider leading-none transition-colors duration-300 ${
              pickA && !locked ? "text-gold"
              : winA            ? "text-success"
              : loseA           ? "text-text-muted"
              : "text-text group-hover:text-text"
            }`}>
              {teamA.short_name ?? teamA.name}
            </span>

            {pickA && !locked && (
              <span className="relative z-10 text-[8px] text-gold/70 uppercase tracking-[0.25em] font-medium leading-none">your pick</span>
            )}
            {pickA && isCompleted && isCorrect !== null && (
              <span className={`relative z-10 text-[8px] uppercase tracking-[0.2em] font-bold ${isCorrect ? "text-success" : "text-danger/70"}`}>
                {isCorrect ? "+1 pt ✓" : "0 pts"}
              </span>
            )}
          </button>

          {/* ── Center: VS / score ── */}
          <div className="shrink-0 flex flex-col items-center justify-center gap-1.5 px-0.5 min-w-[48px]">
            {isCompleted || isLive ? (
              <>
                <span className={`font-stats text-[24px] font-bold leading-none tabular-nums transition-colors ${
                  winA ? "text-success" : loseA ? "text-text-dim" : "text-text"
                }`}>
                  {mapsA}
                </span>
                <span className="text-[9px] text-text-dim/50 font-stats select-none">—</span>
                <span className={`font-stats text-[24px] font-bold leading-none tabular-nums transition-colors ${
                  winB ? "text-success" : loseB ? "text-text-dim" : "text-text"
                }`}>
                  {mapsB}
                </span>
              </>
            ) : (
              <div className="flex flex-col items-center gap-1">
                <div className="h-px w-6 bg-white/8" />
                <span className="text-[9px] text-text-dim/60 font-display uppercase tracking-[0.3em] select-none">vs</span>
                <div className="h-px w-6 bg-white/8" />
              </div>
            )}
          </div>

          {/* Team B */}
          <button
            type="button"
            onClick={() => handlePick(teamB.id)}
            disabled={!canClick}
            className={`group relative flex-1 flex flex-col items-center gap-2 sm:gap-2.5 px-2 sm:px-3 py-4 sm:py-4 min-h-[96px] rounded-xl border overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] text-center ${sideRing(pickB, winB, loseB)} ${canClick ? "cursor-pointer active:scale-[0.97]" : "cursor-default"}`}
            style={{ background: sideBg(pickB, winB, loseB) }}
          >
            {canClick && !pickB && (
              <div className="absolute inset-0 bg-gradient-to-b from-white/6 to-white/2 opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none" />
            )}
            {pickB && !locked && (
              <div className="absolute inset-0 pick-shimmer pointer-events-none" />
            )}

            <div className="relative z-10">
              <TeamLogo team={teamB} size={46} />
              {pickB && !locked && (
                <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-gold flex items-center justify-center shadow-[0_0_8px_rgba(245,200,66,0.7)]">
                  <svg className="h-2 w-2 text-void" fill="none" stroke="currentColor" strokeWidth="3.5" viewBox="0 0 24 24">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </div>
              )}
              {winB && (
                <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-success flex items-center justify-center shadow-[0_0_8px_rgba(52,211,153,0.6)]">
                  <svg className="h-2 w-2 text-void" fill="none" stroke="currentColor" strokeWidth="3.5" viewBox="0 0 24 24">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </div>
              )}
            </div>

            <span className={`relative z-10 text-[11px] font-display font-bold uppercase tracking-wider leading-none transition-colors duration-300 ${
              pickB && !locked ? "text-gold"
              : winB            ? "text-success"
              : loseB           ? "text-text-muted"
              : "text-text"
            }`}>
              {teamB.short_name ?? teamB.name}
            </span>

            {pickB && !locked && (
              <span className="relative z-10 text-[8px] text-gold/70 uppercase tracking-[0.25em] font-medium leading-none">your pick</span>
            )}
            {pickB && isCompleted && isCorrect !== null && (
              <span className={`relative z-10 text-[8px] uppercase tracking-[0.2em] font-bold ${isCorrect ? "text-success" : "text-danger/70"}`}>
                {isCorrect ? "+1 pt ✓" : "0 pts"}
              </span>
            )}
          </button>
        </div>

        {/* ── Footer area ── */}
        {isPending && (
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-text-muted">
            <svg className="h-3 w-3 animate-spin text-gold" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" />
            </svg>
            Saving…
          </div>
        )}

        {locked && !isCompleted && !isPending && (
          <div className="flex items-center justify-center gap-1.5 text-[10px] text-text-muted/60">
            <LockedIcon className="h-3.5 w-3.5 opacity-50" />
            Predictions locked
          </div>
        )}

        {!isLoggedIn && !locked && (
          <p className="text-[11px] text-text-muted text-center">
            <Link href="/login?redirect=/predictions" className="text-gold hover:text-gold/80 transition-colors underline-offset-2 hover:underline">
              Sign in
            </Link>
            {" "}to make picks
          </p>
        )}

        {/* ── Community pick bar ── */}
        {showCommunity && !isPending && (
          <div className="space-y-1.5 pt-0.5">
            <div className="flex items-center justify-between px-0.5">
              <span className={`font-stats text-[9px] tabular-nums ${pickA ? "text-gold/80" : winA ? "text-success/70" : "text-text-dim"}`}>
                <span className="text-text-dim mr-1 font-display text-[8px] tracking-wider">{shortA}</span>
                {pctA}%
              </span>
              <span className="text-[7px] text-text-dim/35 uppercase tracking-[0.3em] font-display">
                {totalCommunity}
              </span>
              <span className={`font-stats text-[9px] tabular-nums ${pickB ? "text-gold/80" : winB ? "text-success/70" : "text-text-dim"}`}>
                {pctB}%
                <span className="text-text-dim ml-1 font-display text-[8px] tracking-wider">{shortB}</span>
              </span>
            </div>
            <div className="flex h-[3px] rounded-full overflow-hidden gap-px">
              <div
                className={`h-full rounded-l-full transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                  winA ? "bg-success/60" : pickA ? "bg-gold/65" : "bg-white/14"
                }`}
                style={{ width: `${pctA}%` }}
              />
              <div
                className={`h-full rounded-r-full transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                  winB ? "bg-success/60" : pickB ? "bg-gold/65" : "bg-white/14"
                }`}
                style={{ width: `${pctB}%` }}
              />
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
