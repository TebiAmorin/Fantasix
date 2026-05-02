"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { PredictionCard } from "./prediction-card"
import { EVENT_START } from "@/lib/constants"

interface Team {
  id: string
  name: string
  short_name: string | null
  logo_url: string | null
}

export interface MatchForDisplay {
  id: string
  status: "scheduled" | "live" | "completed" | "cancelled"
  format: string
  scheduled_at: string | null
  team_a_maps_won: number
  team_b_maps_won: number
  winner_id: string | null
  phase_id: string | null
  round_name: string | null
  team_a: Team
  team_b: Team
}

export interface PhaseData {
  id: string
  name: string
  order_index: number
  is_active: boolean
  description?: string | null
}

// [matchId][teamId] = pick count
export type CommunityPicksMap = Record<string, Record<string, number>>

interface PhaseTabsProps {
  phases: PhaseData[]
  matches: MatchForDisplay[]
  picksMap: Record<string, string>
  isLoggedIn: boolean
  communityPicksMap: CommunityPicksMap
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function groupByRound(matches: MatchForDisplay[]) {
  const groups = new Map<string, MatchForDisplay[]>()
  for (const m of matches) {
    const key = m.round_name ?? ""
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(m)
  }
  return Array.from(groups.entries()).map(([round, items]) => ({
    round: round || null,
    items,
  }))
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function SectionDivider({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
      <div className="flex items-center gap-2">
        <span className="font-display text-[9px] text-text-dim/80 uppercase tracking-[0.3em]">{label}</span>
        <span className="font-stats text-[9px] text-text-dim/40 tabular-nums bg-white/3 rounded-full px-1.5 py-px border border-white/5">
          {count}
        </span>
      </div>
      <div className="h-px flex-1 bg-gradient-to-l from-white/10 to-transparent" />
    </div>
  )
}

function RoundLabel({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2 pl-0.5">
      <div className="h-px w-3 bg-white/10" />
      <span className="text-[9px] text-text-dim/70 uppercase tracking-[0.3em] font-display">{name}</span>
    </div>
  )
}

function EventCountdown() {
  const TARGET = EVENT_START.getTime()
  const [diff, setDiff] = useState(() => TARGET - Date.now())

  useEffect(() => {
    if (diff <= 0) return
    const id = setInterval(() => setDiff(TARGET - Date.now()), 1000)
    return () => clearInterval(id)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (diff <= 0) return null

  const days    = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours   = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)

  return (
    <div
      className="relative rounded-2xl px-4 sm:px-8 py-10 text-center space-y-6 overflow-hidden"
      style={{
        background: "radial-gradient(ellipse 70% 60% at 50% 110%, rgba(196,30,58,0.08) 0%, transparent 65%), rgba(255,255,255,0.015)",
        boxShadow: "inset 0 0 0 1px rgba(196,30,58,0.12), inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      {/* Diagonal slash */}
      <div className="absolute inset-0 slc-slash opacity-100 pointer-events-none" />

      <div className="relative z-10 space-y-2">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="h-px flex-1 max-w-[60px]" style={{ background: "rgba(196,30,58,0.3)" }} />
          <p className="text-[9px] uppercase tracking-[0.35em] font-display" style={{ color: "rgba(196,30,58,0.7)" }}>Picks open in</p>
          <div className="h-px flex-1 max-w-[60px]" style={{ background: "rgba(196,30,58,0.3)" }} />
        </div>
        <div className="flex items-end justify-center gap-2 sm:gap-3">
          {[
            { value: days,    label: "days" },
            { value: hours,   label: "hrs" },
            { value: minutes, label: "min" },
            { value: seconds, label: "sec" },
          ].map(({ value, label }, i) => (
            <div key={label} className="flex items-end gap-2 sm:gap-3">
              {i > 0 && <span className="font-stats text-lg sm:text-xl mb-2 text-white/20">:</span>}
              <div className="text-center min-w-[2.5rem] sm:min-w-[3rem]">
                <div
                  className="rounded-xl py-2 px-1 mb-1"
                  style={{ background: "rgba(196,30,58,0.08)", border: "1px solid rgba(196,30,58,0.15)" }}
                >
                  <p className="font-stats text-3xl sm:text-4xl font-bold tabular-nums leading-none" style={{ color: "#EEF2FF" }}>
                    {String(value).padStart(2, "0")}
                  </p>
                </div>
                <p className="text-[8px] text-text-dim uppercase tracking-[0.25em] font-display">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-10 space-y-1">
        <p className="text-sm font-display text-text">Matches appear once the event starts</p>
        <p className="text-xs" style={{ color: "rgba(0,212,184,0.5)" }}>FORGED THE HARD WAY · Salt Lake City · May 8–17</p>
      </div>

      <div className="relative z-10 flex items-center justify-center gap-1.5 pt-1">
        {["Playins", "Swiss", "Playoffs"].map((phase, i) => (
          <div key={phase} className="flex items-center gap-1.5">
            {i > 0 && <div className="h-px w-4 bg-white/8" />}
            <span
              className="text-[9px] uppercase tracking-widest font-display rounded-full px-2.5 py-0.5"
              style={{ color: "rgba(196,30,58,0.6)", border: "1px solid rgba(196,30,58,0.15)", background: "rgba(196,30,58,0.06)" }}
            >
              {phase}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Match grid with round grouping ─────────────────────────────────────────────

function MatchGrid({
  matches,
  picksMap,
  isLoggedIn,
  communityPicksMap,
  showRoundLabels,
}: {
  matches: MatchForDisplay[]
  picksMap: Record<string, string>
  isLoggedIn: boolean
  communityPicksMap: CommunityPicksMap
  showRoundLabels: boolean
}) {
  const groups = groupByRound(matches)
  const hasMultipleRounds = groups.length > 1 && showRoundLabels

  // Flat index for stagger animation across all groups
  let cardIdx = 0

  return (
    <div className="space-y-5">
      {groups.map(({ round, items }) => (
        <div key={round ?? "__no_round"} className="space-y-3">
          {hasMultipleRounds && round && <RoundLabel name={round} />}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {items.map(m => {
              const community = communityPicksMap[m.id] ?? {}
              const stagger   = Math.min(++cardIdx, 8)
              return (
                <div key={m.id} className={`card-enter card-enter-${stagger}`}>
                  <PredictionCard
                    matchId={m.id}
                    teamA={m.team_a}
                    teamB={m.team_b}
                    format={m.format}
                    roundName={hasMultipleRounds ? null : m.round_name}
                    scheduledAt={m.scheduled_at}
                    status={m.status}
                    winnerId={m.winner_id}
                    mapsA={m.team_a_maps_won}
                    mapsB={m.team_b_maps_won}
                    userPickId={picksMap[m.id] ?? null}
                    isLoggedIn={isLoggedIn}
                    communityA={community[m.team_a.id] ?? 0}
                    communityB={community[m.team_b.id] ?? 0}
                  />
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Main export ────────────────────────────────────────────────────────────────

export function PhaseTabs({
  phases, matches, picksMap, isLoggedIn, communityPicksMap,
}: PhaseTabsProps) {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const pathname     = usePathname()

  const sortedPhases = [...phases].sort((a, b) => a.order_index - b.order_index)
  const fallbackId   = sortedPhases.find(p => p.is_active)?.id ?? sortedPhases[0]?.id ?? "__all"
  const urlPhase     = searchParams.get("phase") ?? null
  // Validate URL param against known phase IDs; fall back to default
  const validUrlPhase = urlPhase && (urlPhase === "__all" || sortedPhases.some(p => p.id === urlPhase))
    ? urlPhase : null
  const [activeTab, setActiveTab] = useState<string>(validUrlPhase ?? fallbackId)

  const handleTabChange = (id: string) => {
    setActiveTab(id)
    const params = new URLSearchParams(searchParams.toString())
    if (id === "__all") params.delete("phase")
    else params.set("phase", id)
    const qs = params.toString()
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false })
  }

  const filtered = activeTab === "__all"
    ? matches
    : matches.filter(m => m.phase_id === activeTab)

  const byDate = (a: MatchForDisplay, b: MatchForDisplay) =>
    (a.scheduled_at ?? "").localeCompare(b.scheduled_at ?? "")

  const live      = filtered.filter(m => m.status === "live")
  const upcoming  = filtered.filter(m => m.status === "scheduled").sort(byDate)
  const completed = filtered.filter(m => m.status === "completed")
    .sort((a, b) => byDate(b, a)) // most recent first
  const cancelled = filtered.filter(m => m.status === "cancelled")

  const pickedUpcoming     = upcoming.filter(m => picksMap[m.id]).length
  const allUpcomingPicked  = upcoming.length > 0 && pickedUpcoming === upcoming.length

  // Per-tab stats
  const tabStats = (phaseId: string) => {
    const pool = phaseId === "__all" ? matches : matches.filter(m => m.phase_id === phaseId)
    const scheduledMatches = pool.filter(m => m.status === "scheduled")
    const liveMatches      = pool.filter(m => m.status === "live")
    const completedMatches = pool.filter(m => m.status === "completed")
    const pickedScheduled  = scheduledMatches.filter(m => picksMap[m.id]).length
    const total            = pool.filter(m => m.status !== "cancelled").length
    return {
      live:             liveMatches.length,
      upcoming:         scheduledMatches.length,
      completed:        completedMatches.length,
      total,
      pickedScheduled,
      allScheduledPicked: scheduledMatches.length > 0 && pickedScheduled === scheduledMatches.length,
    }
  }

  const allTab: PhaseData = { id: "__all", name: "All", order_index: -1, is_active: false }
  const tabs = [allTab, ...sortedPhases]

  const activePhaseData = activeTab === "__all"
    ? null
    : sortedPhases.find(p => p.id === activeTab)

  return (
    <div className="space-y-6">

      {/* ── Tab strip ── */}
      <div
        className="relative rounded-2xl p-1.5"
        style={{ background: "rgba(255,255,255,0.03)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04)" }}
      >
        <div className="flex items-center gap-1 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {tabs.map(tab => {
            const stats   = tabStats(tab.id)
            const isActive = activeTab === tab.id

            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-display font-bold uppercase tracking-wider whitespace-nowrap transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] shrink-0 ${
                  isActive
                    ? "text-void shadow-[0_2px_12px_rgba(245,200,66,0.3),0_0_0_1px_rgba(245,200,66,0.4)]"
                    : "text-text-muted hover:text-text hover:bg-white/4"
                }`}
                style={isActive ? {
                  background: "linear-gradient(135deg, rgba(245,200,66,0.95) 0%, rgba(245,180,40,1) 100%)",
                } : {}}
              >
                {tab.name}

                {/* Live dot */}
                {stats.live > 0 && (
                  <span className="relative flex h-1.5 w-1.5 shrink-0">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isActive ? "bg-void/60" : "bg-live"}`} />
                    <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${isActive ? "bg-void/60" : "bg-live"}`} />
                  </span>
                )}

                {/* Pick progress badge (logged-in only) */}
                {stats.live === 0 && stats.upcoming > 0 && isLoggedIn && (
                  stats.allScheduledPicked ? (
                    <svg className={`h-3 w-3 shrink-0 ${isActive ? "text-void/60" : "text-success/70"}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  ) : (
                    <span className={`font-stats text-[9px] font-normal leading-none ${isActive ? "text-void/50" : "text-text-dim"}`}>
                      {stats.pickedScheduled}/{stats.upcoming}
                    </span>
                  )
                )}

                {/* Total count when no upcoming */}
                {stats.live === 0 && stats.upcoming === 0 && stats.total > 0 && (
                  <span className={`font-stats text-[10px] font-normal leading-none ${isActive ? "text-void/50" : "text-text-dim"}`}>
                    {stats.total}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Phase description ── */}
      {activePhaseData?.description && (
        <p className="text-xs text-text-muted pl-1 -mt-2">{activePhaseData.description}</p>
      )}

      {/* ── Content ── */}
      {filtered.length === 0 ? (
        <EventCountdown />
      ) : (
        <div className="space-y-10">

          {/* Live */}
          {live.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-live opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-live" />
                </span>
                <h3 className="font-display text-sm text-live uppercase tracking-widest">Live Now</h3>
                <span className="font-stats text-[10px] text-live/50">{live.length} match{live.length > 1 ? "es" : ""}</span>
              </div>
              <MatchGrid
                matches={live}
                picksMap={picksMap}
                isLoggedIn={isLoggedIn}
                communityPicksMap={communityPicksMap}
                showRoundLabels={false}
              />
            </section>
          )}

          {/* Upcoming */}
          {upcoming.length > 0 && (
            <section className="space-y-4">
              {(live.length > 0 || completed.length > 0) && (
                <SectionDivider label="Upcoming" count={upcoming.length} />
              )}
              <MatchGrid
                matches={upcoming}
                picksMap={picksMap}
                isLoggedIn={isLoggedIn}
                communityPicksMap={communityPicksMap}
                showRoundLabels={true}
              />
              {isLoggedIn && allUpcomingPicked && (
                <div
                  className="relative overflow-hidden rounded-xl px-4 py-3.5 flex items-center gap-3"
                  style={{
                    background: "linear-gradient(90deg, rgba(52,211,153,0.06) 0%, rgba(52,211,153,0.02) 60%, transparent 100%)",
                    boxShadow: "inset 0 0 0 1px rgba(52,211,153,0.14), inset 0 1px 0 rgba(52,211,153,0.08)",
                  }}
                >
                  {/* Subtle top accent */}
                  <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-success/40 via-success/20 to-transparent" />
                  <div className="h-7 w-7 rounded-full bg-success/12 border border-success/22 flex items-center justify-center shrink-0">
                    <svg className="h-3.5 w-3.5 text-success" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-display font-bold text-success uppercase tracking-wider">All caught up</p>
                    <p className="text-[10px] text-text-muted mt-0.5 leading-tight">
                      {upcoming.length} pick{upcoming.length > 1 ? "s" : ""} locked in — check back after matches play
                    </p>
                  </div>
                  <span className="text-[10px] font-stats text-success/50 tabular-nums shrink-0">{upcoming.length}/{upcoming.length}</span>
                </div>
              )}
            </section>
          )}

          {/* Completed */}
          {completed.length > 0 && (
            <section className="space-y-4">
              {(live.length > 0 || upcoming.length > 0) && (
                <SectionDivider label="Results" count={completed.length} />
              )}
              <MatchGrid
                matches={completed}
                picksMap={picksMap}
                isLoggedIn={isLoggedIn}
                communityPicksMap={communityPicksMap}
                showRoundLabels={true}
              />
            </section>
          )}

          {/* Cancelled */}
          {cancelled.length > 0 && (
            <section className="space-y-3">
              <SectionDivider label="Cancelled" count={cancelled.length} />
              <div className="space-y-2">
                {cancelled.map(m => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between px-4 py-2.5 rounded-xl border border-white/5 bg-white/2 opacity-50"
                  >
                    <span className="font-display text-xs text-text-muted uppercase tracking-wide">
                      {m.team_a.short_name ?? m.team_a.name} vs {m.team_b.short_name ?? m.team_b.name}
                    </span>
                    <span className="text-[9px] font-display text-text-dim uppercase tracking-[0.2em] border border-white/8 px-1.5 py-0.5 rounded">
                      Cancelled
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
