"use client"

import { useState } from "react"
import { PredictionCard } from "./prediction-card"

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

interface PhaseTabsProps {
  phases: PhaseData[]
  matches: MatchForDisplay[]
  picksMap: Record<string, string>
  isLoggedIn: boolean
}

export function PhaseTabs({ phases, matches, picksMap, isLoggedIn }: PhaseTabsProps) {
  const sortedPhases = [...phases].sort((a, b) => a.order_index - b.order_index)
  const defaultId = sortedPhases.find(p => p.is_active)?.id ?? sortedPhases[0]?.id ?? "__all"
  const [activeTab, setActiveTab] = useState<string>(defaultId)

  const filtered = activeTab === "__all"
    ? matches
    : matches.filter(m => m.phase_id === activeTab)

  const live      = filtered.filter(m => m.status === "live")
  const upcoming  = filtered.filter(m => m.status === "scheduled")
  const completed = filtered.filter(m => m.status === "completed").reverse()

  const liveCount = (phaseId: string) => {
    const pool = phaseId === "__all" ? matches : matches.filter(m => m.phase_id === phaseId)
    return pool.filter(m => m.status === "live").length
  }

  const matchCount = (phaseId: string) => {
    const pool = phaseId === "__all" ? matches : matches.filter(m => m.phase_id === phaseId)
    return pool.filter(m => m.status !== "cancelled").length
  }

  const allTab = { id: "__all", name: "All", order_index: -1, is_active: false }
  const tabs = [allTab, ...sortedPhases]

  return (
    <div className="space-y-6">
      {/* Tab strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1" style={{scrollbarWidth:"none"}}>
        {tabs.map(tab => {
          const live = liveCount(tab.id)
          const total = matchCount(tab.id)
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-full text-xs font-display font-bold uppercase tracking-wider whitespace-nowrap transition-all duration-500 shrink-0 ${
                isActive
                  ? "bg-gold text-void shadow-[0_0_24px_rgba(245,200,66,0.35)]"
                  : "text-text-muted border border-white/10 hover:border-white/25 hover:text-text bg-white/2"
              }`}
            >
              {tab.name}
              {live > 0 ? (
                <span className={`h-1.5 w-1.5 rounded-full animate-pulse ${isActive ? "bg-void/60" : "bg-live"}`} />
              ) : total > 0 ? (
                <span className={`font-stats text-[10px] font-normal ${isActive ? "text-void/50" : "text-text-dim"}`}>
                  {total}
                </span>
              ) : null}
            </button>
          )
        })}
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <div className="py-20 text-center space-y-2">
          <div className="font-display text-3xl text-text-muted/15 tracking-widest">NO MATCHES</div>
          <p className="text-text-muted text-sm">Matches will appear here once scheduled.</p>
        </div>
      ) : (
        <div className="space-y-10">

          {/* Live */}
          {live.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2.5">
                <span className="h-2 w-2 rounded-full bg-live animate-pulse" />
                <h3 className="font-display text-sm text-live uppercase tracking-widest">Live Now</h3>
                <span className="font-stats text-[10px] text-live/50">{live.length} match{live.length > 1 ? "es" : ""}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {live.map(m => (
                  <PredictionCard
                    key={m.id} matchId={m.id}
                    teamA={m.team_a} teamB={m.team_b}
                    format={m.format} scheduledAt={m.scheduled_at}
                    status={m.status} winnerId={m.winner_id}
                    mapsA={m.team_a_maps_won} mapsB={m.team_b_maps_won}
                    userPickId={picksMap[m.id] ?? null} isLoggedIn={isLoggedIn}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Upcoming */}
          {upcoming.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="h-px flex-1 bg-white/5" />
                <h3 className="font-display text-xs text-text-muted uppercase tracking-widest">
                  Upcoming · {upcoming.length}
                </h3>
                <div className="h-px flex-1 bg-white/5" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {upcoming.map(m => (
                  <PredictionCard
                    key={m.id} matchId={m.id}
                    teamA={m.team_a} teamB={m.team_b}
                    format={m.format} scheduledAt={m.scheduled_at}
                    status={m.status} winnerId={m.winner_id}
                    mapsA={m.team_a_maps_won} mapsB={m.team_b_maps_won}
                    userPickId={picksMap[m.id] ?? null} isLoggedIn={isLoggedIn}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Completed */}
          {completed.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="h-px flex-1 bg-white/5" />
                <h3 className="font-display text-xs text-text-muted uppercase tracking-widest">
                  Results · {completed.length}
                </h3>
                <div className="h-px flex-1 bg-white/5" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {completed.map(m => (
                  <PredictionCard
                    key={m.id} matchId={m.id}
                    teamA={m.team_a} teamB={m.team_b}
                    format={m.format} scheduledAt={m.scheduled_at}
                    status={m.status} winnerId={m.winner_id}
                    mapsA={m.team_a_maps_won} mapsB={m.team_b_maps_won}
                    userPickId={picksMap[m.id] ?? null} isLoggedIn={isLoggedIn}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
