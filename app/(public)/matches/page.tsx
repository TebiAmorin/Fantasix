import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import Image from "next/image"
import { MatchTime } from "@/components/matches/match-time"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Schedule — BLAST R6 Major SLC 2026 · Fantasix",
  description: "Full match schedule and results for the BLAST Rainbow Six Major Salt Lake City 2026.",
  openGraph: {
    title: "Schedule — BLAST R6 Major SLC 2026",
    description: "Full match schedule and results for the BLAST Rainbow Six Major Salt Lake City 2026.",
    images: [{ url: "/api/og?title=Schedule&sub=BLAST+R6+Major+%C2%B7+SLC+2026", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/api/og?title=Schedule&sub=BLAST+R6+Major+%C2%B7+SLC+2026"],
  },
}

export const revalidate = 60

type MatchStatus = "scheduled" | "live" | "completed" | "cancelled"

interface Match {
  id: string
  status: MatchStatus
  format: string
  scheduled_at: string | null
  team_a_maps_won: number
  team_b_maps_won: number
  external_stats_url: string | null
  team_a: { id: string; short_name: string; name: string; logo_url: string | null } | null
  team_b: { id: string; short_name: string; name: string; logo_url: string | null } | null
  winner:  { short_name: string } | null
}

interface Phase {
  id: string
  name: string
  order_index: number
  matches: Match[]
}

function StatusBadge({ status }: { status: MatchStatus }) {
  if (status === "live") return (
    <span className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-display uppercase tracking-[0.2em] font-bold text-live border border-live/25 bg-live/8">
      <span className="relative flex h-1.5 w-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-live opacity-75" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-live" />
      </span>
      Live
    </span>
  )
  if (status === "completed") return (
    <span className="rounded-full px-2.5 py-1 text-[9px] font-display uppercase tracking-[0.2em] text-success/70 border border-success/15 bg-success/5">
      Final
    </span>
  )
  return (
    <span className="rounded-full px-2.5 py-1 text-[9px] font-display uppercase tracking-[0.2em] text-text-dim border border-white/8">
      Upcoming
    </span>
  )
}

function TeamLogo({ team, size = 32 }: { team: { short_name: string; logo_url: string | null } | null; size?: number }) {
  if (!team) return null
  return (
    <div className="shrink-0 flex items-center justify-center" style={{ width: size, height: size }}>
      {team.logo_url ? (
        <Image src={team.logo_url} alt={team.short_name} width={size} height={size} className="object-contain" />
      ) : (
        <div className="rounded bg-purple/15 border border-purple/20 flex items-center justify-center text-purple font-display font-bold"
          style={{ width: size, height: size, fontSize: size * 0.28 }}>
          {team.short_name.slice(0, 2).toUpperCase()}
        </div>
      )}
    </div>
  )
}

function MatchRow({ match }: { match: Match }) {
  const completed = match.status === "completed"
  const live      = match.status === "live"
  const winA      = completed && match.winner?.short_name === match.team_a?.short_name
  const winB      = completed && match.winner?.short_name === match.team_b?.short_name

  return (
    <div className={`
      relative flex items-center gap-2 sm:gap-4 px-3 sm:px-4 py-3.5 sm:py-4 transition-all duration-300 min-h-[60px]
      ${live ? "bg-live/4" : "hover:bg-white/2"}
    `}>
      {/* Live left bar */}
      {live && <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-r" style={{ background: "rgba(251,146,60,0.7)" }} />}
      {/* Completed winner teal accent */}
      {completed && <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-r" style={{ background: "rgba(0,212,184,0.25)" }} />}

      {/* Teams + score */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 sm:gap-3">

          {/* Team A */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-1 justify-end min-w-0">
            <span className={`font-display text-xs sm:text-sm tracking-wide truncate text-right leading-tight ${
              winA ? "text-text font-bold" : completed ? "text-text-muted" : "text-text"
            }`}>
              {match.team_a?.short_name ?? "TBD"}
            </span>
            <TeamLogo team={match.team_a} size={24} />
          </div>

          {/* Score or vs */}
          <div className="shrink-0 text-center w-12 sm:w-16">
            {completed ? (
              <span className="font-stats text-sm sm:text-base font-bold tabular-nums" style={{ color: "#EEF2FF" }}>
                {match.team_a_maps_won}
                <span className="text-text-dim mx-0.5 sm:mx-1">–</span>
                {match.team_b_maps_won}
              </span>
            ) : live ? (
              <span className="font-stats text-[10px] sm:text-xs font-bold text-live tabular-nums">LIVE</span>
            ) : (
              <span className="font-stats text-xs text-text-dim">vs</span>
            )}
          </div>

          {/* Team B */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
            <TeamLogo team={match.team_b} size={24} />
            <span className={`font-display text-xs sm:text-sm tracking-wide truncate leading-tight ${
              winB ? "text-text font-bold" : completed ? "text-text-muted" : "text-text"
            }`}>
              {match.team_b?.short_name ?? "TBD"}
            </span>
          </div>
        </div>
      </div>

      {/* Right side: status + time + format */}
      <div className="flex flex-col items-end gap-1 shrink-0">
        <StatusBadge status={match.status} />
        <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] text-text-dim">
          <span className="font-stats uppercase">{match.format}</span>
          {match.scheduled_at && !completed && !live && (
            <>
              <span className="hidden sm:inline">·</span>
              <span className="hidden sm:inline">
                <MatchTime scheduledAt={match.scheduled_at} />
              </span>
            </>
          )}
        </div>
        {/* Time on mobile — second line */}
        {match.scheduled_at && !completed && !live && (
          <div className="sm:hidden">
            <MatchTime scheduledAt={match.scheduled_at} />
          </div>
        )}
      </div>

      {/* External stats link */}
      {completed && match.external_stats_url && (
        <a
          href={match.external_stats_url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-text-dim hover:text-[#00D4B8] transition-colors touch-target flex items-center justify-center"
          title="Full stats"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </a>
      )}
    </div>
  )
}

export default async function MatchesPage() {
  const supabase = await createClient()

  // Active tournament
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: tournament } = await (supabase as any)
    .from("tournaments")
    .select("id, name, start_date, end_date")
    .eq("is_active", true)
    .single() as { data: { id: string; name: string; start_date: string | null; end_date: string | null } | null }

  if (!tournament) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center space-y-3">
        <p className="font-display text-2xl text-text-muted/20 tracking-widest">NO TOURNAMENT</p>
        <p className="text-sm text-text-muted">No active tournament right now.</p>
        <Link href="/predictions" className="text-xs text-purple hover:underline">Back to predictions →</Link>
      </div>
    )
  }

  // All phases with matches
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rawPhases } = await (supabase as any)
    .from("phases")
    .select(`
      id, name, order_index,
      matches(
        id, status, format, scheduled_at,
        team_a_maps_won, team_b_maps_won, external_stats_url,
        team_a:teams!matches_team_a_id_fkey(id, short_name, name, logo_url),
        team_b:teams!matches_team_b_id_fkey(id, short_name, name, logo_url),
        winner:teams!matches_winner_id_fkey(short_name)
      )
    `)
    .eq("tournament_id", tournament.id)
    .order("order_index") as { data: Phase[] | null }

  const phases: Phase[] = (rawPhases ?? []).map(p => ({
    ...p,
    matches: (p.matches ?? [])
      .filter((m: Match) => m.status !== "cancelled")
      .sort((a: Match, b: Match) => {
        // Live first, then scheduled by time, then completed newest-last
        if (a.status === "live"      && b.status !== "live")      return -1
        if (b.status === "live"      && a.status !== "live")      return  1
        if (a.status === "scheduled" && b.status !== "scheduled") return -1
        if (b.status === "scheduled" && a.status !== "scheduled") return  1
        return (a.scheduled_at ?? "").localeCompare(b.scheduled_at ?? "")
      }),
  })).filter(p => p.matches.length > 0)

  const totalMatches    = phases.flatMap(p => p.matches).length
  const completedCount  = phases.flatMap(p => p.matches).filter(m => m.status === "completed").length
  const liveCount       = phases.flatMap(p => p.matches).filter(m => m.status === "live").length

  return (
    <div>
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-slc-mesh" />
        <div className="absolute inset-0 slc-slash opacity-100 pointer-events-none" />
        <div
          className="absolute -top-20 right-0 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: "rgba(0,212,184,0.09)", filter: "blur(90px)" }}
        />
        <div
          className="absolute bottom-0 left-1/4 w-64 h-48 rounded-full pointer-events-none"
          style={{ background: "rgba(196,30,58,0.08)", filter: "blur(70px)" }}
        />
        <div className="absolute inset-x-0 bottom-0 h-px"
          style={{ background: "linear-gradient(to right, transparent, rgba(0,212,184,0.4), rgba(196,30,58,0.3), transparent)" }} />

        <div className="relative z-10 mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 pb-12">
          <div className="space-y-4 animate-fade-up">
            <div
              className="inline-flex items-center gap-2 rounded-full px-3 py-1.5"
              style={{ color: "#00D4B8", borderColor: "rgba(0,212,184,0.3)", background: "rgba(0,212,184,0.08)", border: "1px solid rgba(0,212,184,0.3)" }}
            >
              <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              <span className="text-[10px] font-display font-bold uppercase tracking-[0.2em]">{tournament.name}</span>
            </div>
            <h1 className="font-display text-5xl sm:text-6xl text-text leading-none tracking-tight">
              Sched<span className="text-glow-teal" style={{ color: "#00D4B8" }}>ule</span>
            </h1>
            {/* Quick stats */}
            <div className="flex flex-wrap items-center gap-5 pt-1">
              <div>
                <span className="font-stats text-xl font-bold text-text tabular-nums">{totalMatches}</span>
                <span className="text-[10px] text-text-dim uppercase tracking-[0.2em] ml-2">Matches</span>
              </div>
              <div>
                <span className="font-stats text-xl font-bold text-success tabular-nums">{completedCount}</span>
                <span className="text-[10px] text-text-dim uppercase tracking-[0.2em] ml-2">Completed</span>
              </div>
              {liveCount > 0 && (
                <div>
                  <span className="font-stats text-xl font-bold text-live tabular-nums">{liveCount}</span>
                  <span className="text-[10px] text-text-dim uppercase tracking-[0.2em] ml-2">Live now</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Phases */}
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {phases.map(phase => (
          <section key={phase.id} className="space-y-3">
            <div className="flex items-center gap-3">
              <h2 className="font-display text-sm text-text uppercase tracking-wide">{phase.name}</h2>
              <div className="flex-1 h-px bg-white/5" />
              <span className="text-[10px] text-text-dim font-stats">
                {phase.matches.filter(m => m.status === "completed").length}/{phase.matches.length}
              </span>
            </div>

            <div
              className="rounded-2xl overflow-hidden divide-y divide-white/5"
              style={{
                background: "rgba(255,255,255,0.025)",
                boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.07)",
              }}
            >
              {phase.matches.map(match => (
                <MatchRow key={match.id} match={match} />
              ))}
            </div>
          </section>
        ))}

        {phases.length === 0 && (
          <div className="py-16 border border-dashed border-white/8 rounded-2xl text-center space-y-3">
            <p className="text-sm text-text-muted">No matches scheduled yet.</p>
            <Link href="/predictions" className="text-xs text-purple hover:underline">Go to predictions →</Link>
          </div>
        )}

        {/* CTA */}
        <div className="flex justify-center pt-4">
          <Link
            href="/predictions"
            className="group flex items-center gap-2.5 rounded-full px-6 py-3 text-sm font-display font-bold uppercase tracking-wider transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97] touch-target"
            style={{
              background: "linear-gradient(135deg, rgba(196,30,58,0.85) 0%, rgba(170,15,40,0.95) 100%)",
              boxShadow: "0 0 0 1px rgba(196,30,58,0.35), 0 4px 20px rgba(196,30,58,0.22)",
              color: "#fff",
            }}
          >
            <svg className="h-3.5 w-3.5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            Make predictions
            <div className="h-6 w-6 rounded-full bg-white/15 flex items-center justify-center group-hover:translate-x-0.5 transition-transform duration-300">
              <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
