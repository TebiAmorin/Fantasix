"use client"

import { useReducer, useCallback, useMemo, useState } from "react"
import {
  createInitialState,
  setMatchResult,
  clearResult,
  activeRoundIdx,
  teamsAtRoundStart,
  isComplete,
  qualifiedCount,
  eliminatedCount,
  type SwissState,
  type SwissTeamState,
  type SimMatch,
} from "@/lib/simulator/swiss-engine"

// ─── Reducer ─────────────────────────────────────────────────────────────────

type Action =
  | { type: "SET_WINNER";   matchId: string; winnerId: string; mapsLoser: 0 | 1 }
  | { type: "SET_MAPS_LOSER"; matchId: string; winnerId: string; mapsLoser: 0 | 1 }
  | { type: "CLEAR";        matchId: string }
  | { type: "RESET" }

function reducer(state: SwissState, action: Action): SwissState {
  switch (action.type) {
    case "SET_WINNER":
    case "SET_MAPS_LOSER":
      return setMatchResult(state, action.matchId, action.winnerId, 2, action.mapsLoser)
    case "CLEAR":
      return clearResult(state, action.matchId)
    case "RESET":
      return createInitialState()
    default:
      return state
  }
}

// ─── Util ─────────────────────────────────────────────────────────────────────

function buchhStr(b: number) {
  if (b > 0) return `+${b}`
  if (b < 0) return `${b}`
  return "0"
}

const ROUND_LABELS = ["Round 1", "Round 2", "Round 3", "Round 4", "Round 5"]

// ─── Sub-components ───────────────────────────────────────────────────────────

function TeamAvatar({
  team,
  size = "md",
}: {
  team: SwissTeamState
  size?: "sm" | "md" | "lg"
}) {
  const sz = size === "sm" ? "h-7 w-7 text-[9px]" : size === "lg" ? "h-10 w-10 text-xs" : "h-8 w-8 text-[10px]"
  return (
    <div
      className={`${sz} rounded-full flex items-center justify-center shrink-0 font-display font-bold uppercase`}
      style={{ background: `${team.color}22`, border: `1px solid ${team.color}55`, color: team.color }}
    >
      {team.shortName.slice(0, 2)}
    </div>
  )
}

function SeedBadge({ seed }: { seed: number }) {
  return (
    <span className="inline-flex items-center justify-center h-4 w-4 rounded-sm text-[8px] font-stats font-bold text-text-dim"
      style={{ background: "rgba(255,255,255,0.06)" }}>
      {seed}
    </span>
  )
}

function StatusDot({ status }: { status: SwissTeamState["status"] }) {
  if (status === "qualified")  return <span className="inline-block h-1.5 w-1.5 rounded-full bg-success" title="Qualified" />
  if (status === "eliminated") return <span className="inline-block h-1.5 w-1.5 rounded-full bg-danger" title="Eliminated" />
  return null
}

function MapScorePill({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`px-2 py-0.5 rounded-full text-[9px] font-stats font-bold uppercase transition-all duration-200 ${
        active
          ? "bg-gold/20 text-gold border border-gold/40"
          : "bg-white/5 text-text-dim border border-white/8 hover:border-white/20 hover:text-text-muted"
      }`}
    >
      {label}
    </button>
  )
}

// ─── Match Card ───────────────────────────────────────────────────────────────

function MatchCard({
  match,
  teamA,
  teamB,
  dispatch,
  roundComplete,
}: {
  match: SimMatch
  teamA: SwissTeamState
  teamB: SwissTeamState
  dispatch: React.Dispatch<Action>
  roundComplete: boolean
}) {
  const winner = match.winnerId
  const loser  = winner ? (winner === teamA.id ? teamB.id : teamA.id) : null
  const mapsLoser = winner
    ? (winner === teamA.id ? match.mapsB : match.mapsA) as 0 | 1
    : 0

  const selectWinner = (winnerId: string) => {
    if (winner === winnerId) {
      dispatch({ type: "CLEAR", matchId: match.id })
    } else {
      dispatch({ type: "SET_WINNER", matchId: match.id, winnerId, mapsLoser: 0 })
    }
  }

  const setMaps = (loser: 0 | 1) => {
    if (!winner) return
    dispatch({ type: "SET_MAPS_LOSER", matchId: match.id, winnerId: winner, mapsLoser: loser })
  }

  const TeamRow = ({
    team,
    isWinner,
    isLoser,
    score,
  }: {
    team: SwissTeamState
    isWinner: boolean
    isLoser: boolean
    score: number
  }) => {
    const cantPick = team.status !== "active" && !winner
    return (
      <button
        onClick={() => !cantPick && selectWinner(team.id)}
        disabled={cantPick}
        className={`
          w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all duration-300
          ${isWinner
            ? "bg-success/10 ring-1 ring-success/30"
            : isLoser
              ? "opacity-40"
              : "hover:bg-white/5 active:scale-[0.98]"
          }
          ${cantPick ? "cursor-default" : "cursor-pointer"}
        `}
        style={{ userSelect: "none" }}
      >
        <TeamAvatar team={team} />
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-1.5">
            <SeedBadge seed={team.seed} />
            <span className={`text-xs font-medium truncate ${isWinner ? "text-text" : isLoser ? "text-text-dim" : "text-text-muted"}`}>
              {team.name}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="font-stats text-[9px] text-text-dim tabular-nums">
              {team.wins}–{team.losses}
            </span>
            <span className="font-stats text-[9px] tabular-nums"
              style={{ color: team.buchholz >= 0 ? "rgba(245,200,66,0.7)" : "rgba(239,68,68,0.7)" }}>
              BH {buchhStr(team.buchholz)}
            </span>
            <StatusDot status={team.status} />
          </div>
        </div>
        {winner && (
          <span className={`font-stats font-bold text-sm tabular-nums shrink-0 ${
            isWinner ? "text-success" : "text-text-dim"
          }`}>
            {score}
          </span>
        )}
        {isWinner && (
          <span className="shrink-0">
            <svg className="h-3.5 w-3.5 text-success" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </span>
        )}
      </button>
    )
  }

  return (
    <div
      className={`rounded-2xl overflow-hidden transition-all duration-300 ${
        winner ? "opacity-100" : "opacity-100"
      }`}
      style={{
        background: winner ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.025)",
        boxShadow: winner
          ? "inset 0 0 0 1px rgba(16,185,129,0.2), inset 0 1px 0 rgba(255,255,255,0.04)"
          : "inset 0 0 0 1px rgba(255,255,255,0.07), inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      <div className="p-1.5 space-y-1">
        <TeamRow team={teamA} isWinner={winner === teamA.id} isLoser={loser === teamA.id} score={match.mapsA} />
        <div className="flex items-center gap-2 px-3 py-0.5">
          <div className="flex-1 h-px bg-white/5" />
          <span className="text-[9px] font-display uppercase tracking-widest text-text-dim">vs</span>
          <div className="flex-1 h-px bg-white/5" />
        </div>
        <TeamRow team={teamB} isWinner={winner === teamB.id} isLoser={loser === teamB.id} score={match.mapsB} />
      </div>

      {/* Map score selector */}
      {winner && (
        <div className="flex items-center gap-2 px-4 pb-3 pt-1">
          <span className="text-[9px] text-text-dim font-display uppercase tracking-wider">Score</span>
          <MapScorePill label="2–0" active={mapsLoser === 0} onClick={() => setMaps(0)} />
          <MapScorePill label="2–1" active={mapsLoser === 1} onClick={() => setMaps(1)} />
        </div>
      )}
    </div>
  )
}

// ─── Standings Table ───────────────────────────────────────────────────────────

function StandingsPanel({ teams }: { teams: SwissTeamState[] }) {
  const sorted = useMemo(() =>
    [...teams].sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins
      if (b.buchholz !== a.buchholz) return b.buchholz - a.buchholz
      return a.seed - b.seed
    }),
  [teams])

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.025)",
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.07)",
      }}
    >
      <div className="px-4 py-3 border-b border-white/6">
        <h3 className="font-display text-[10px] uppercase tracking-[0.25em] text-text-dim">Standings</h3>
      </div>
      <div className="divide-y divide-white/4">
        {sorted.map((t, i) => (
          <div
            key={t.id}
            className={`flex items-center gap-2.5 px-3 py-2 ${
              t.status === "qualified"  ? "bg-success/5"
            : t.status === "eliminated" ? "opacity-50"
            : ""
            }`}
          >
            <span className="font-stats text-[10px] text-text-dim w-4 shrink-0 tabular-nums">{i + 1}</span>
            <TeamAvatar team={t} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-medium text-text truncate leading-tight">{t.shortName}</span>
                <StatusDot status={t.status} />
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="font-stats text-[11px] text-text tabular-nums font-bold">
                {t.wins}–{t.losses}
              </div>
              <div className="font-stats text-[9px] tabular-nums"
                style={{ color: t.buchholz >= 0 ? "rgba(245,200,66,0.6)" : "rgba(239,68,68,0.6)" }}>
                {buchhStr(t.buchholz)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Round Summary (past rounds) ──────────────────────────────────────────────

function RoundSummary({
  roundIdx,
  matches,
  teams,
  onExpand,
}: {
  roundIdx: number
  matches: SimMatch[]
  teams: SwissTeamState[]
  onExpand: () => void
}) {
  const byId = useMemo(() => Object.fromEntries(teams.map(t => [t.id, t])), [teams])
  const complete = matches.every(m => m.winnerId)
  if (!complete) return null

  return (
    <button
      onClick={onExpand}
      className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors hover:bg-white/3"
      style={{ background: "rgba(255,255,255,0.015)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.05)" }}
    >
      <span className="font-display text-[10px] uppercase tracking-[0.2em] text-text-dim shrink-0 w-16">{ROUND_LABELS[roundIdx]}</span>
      <div className="flex flex-wrap gap-1 flex-1">
        {matches.map(m => {
          const w = byId[m.winnerId!]
          const l = byId[m.winnerId === m.teamAId ? m.teamBId : m.teamAId]
          return (
            <span key={m.id} className="inline-flex items-center gap-1 text-[10px]">
              <span className="text-text font-medium">{w.shortName}</span>
              <span className="text-text-dim font-stats">{m.mapsA > m.mapsB ? m.mapsA : m.mapsB}–{m.mapsA < m.mapsB ? m.mapsA : m.mapsB}</span>
              <span className="text-text-dim">{l.shortName}</span>
              <span className="text-white/10 mx-0.5">·</span>
            </span>
          )
        })}
      </div>
      <svg className="h-3.5 w-3.5 text-text-dim shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="m9 18 6-6-6-6" />
      </svg>
    </button>
  )
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ state }: { state: SwissState }) {
  const qualified  = qualifiedCount(state)
  const eliminated = eliminatedCount(state)

  return (
    <div
      className="rounded-2xl px-5 py-4"
      style={{
        background: "rgba(255,255,255,0.02)",
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-success" />
          <span className="text-[10px] font-display uppercase tracking-widest text-text-muted">
            Qualified <span className="text-success font-bold">{qualified}</span>/8
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-display uppercase tracking-widest text-text-muted">
            Eliminated <span className="text-danger font-bold">{eliminated}</span>/8
          </span>
          <div className="h-2 w-2 rounded-full bg-danger" />
        </div>
      </div>
      {/* 16-cell bar */}
      <div className="flex gap-0.5">
        {[...state.teams]
          .sort((a, b) => {
            if (b.wins !== a.wins) return b.wins - a.wins
            return a.seed - b.seed
          })
          .map(t => (
            <div
              key={t.id}
              title={`${t.name} ${t.wins}–${t.losses}`}
              className="flex-1 h-2 rounded-sm transition-all duration-700"
              style={{
                background:
                  t.status === "qualified"  ? "#10B981" :
                  t.status === "eliminated" ? "#EF4444" :
                  `${t.color}55`,
              }}
            />
          ))}
      </div>
    </div>
  )
}

// ─── Final Results ─────────────────────────────────────────────────────────────

function FinalResults({ teams }: { teams: SwissTeamState[] }) {
  const qualified  = [...teams].filter(t => t.status === "qualified").sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins
    if (b.buchholz !== a.buchholz) return b.buchholz - a.buchholz
    return a.seed - b.seed
  })
  const eliminated = [...teams].filter(t => t.status === "eliminated").sort((a, b) => {
    if (a.losses !== b.losses) return a.losses - b.losses
    if (b.buchholz !== a.buchholz) return b.buchholz - a.buchholz
    return a.seed - b.seed
  })

  const RecordBadge = ({ wins, losses }: { wins: number; losses: number }) => {
    const color = losses === 0 ? "text-success" : wins === 3 ? "text-gold" : "text-danger"
    return <span className={`font-stats text-xs font-bold tabular-nums ${color}`}>{wins}–{losses}</span>
  }

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {/* Qualified */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "rgba(16,185,129,0.05)", boxShadow: "inset 0 0 0 1px rgba(16,185,129,0.2)" }}
      >
        <div className="px-4 py-3 border-b border-success/15">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-success" />
            <h3 className="font-display text-[10px] uppercase tracking-[0.25em] text-success/70">Qualified</h3>
          </div>
        </div>
        <div className="divide-y divide-white/4">
          {qualified.map((t, i) => (
            <div key={t.id} className="flex items-center gap-2.5 px-3 py-2.5">
              <span className="font-stats text-[10px] text-text-dim w-4 tabular-nums">{i + 1}</span>
              <TeamAvatar team={t} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-text truncate">{t.name}</div>
                <div className="font-stats text-[9px] text-text-dim"
                  style={{ color: t.buchholz >= 0 ? "rgba(245,200,66,0.6)" : "rgba(239,68,68,0.6)" }}>
                  BH {buchhStr(t.buchholz)}
                </div>
              </div>
              <RecordBadge wins={t.wins} losses={t.losses} />
            </div>
          ))}
        </div>
      </div>

      {/* Eliminated */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "rgba(239,68,68,0.03)", boxShadow: "inset 0 0 0 1px rgba(239,68,68,0.15)" }}
      >
        <div className="px-4 py-3 border-b border-danger/15">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-danger" />
            <h3 className="font-display text-[10px] uppercase tracking-[0.25em] text-danger/70">Eliminated</h3>
          </div>
        </div>
        <div className="divide-y divide-white/4">
          {eliminated.map((t, i) => (
            <div key={t.id} className="flex items-center gap-2.5 px-3 py-2.5 opacity-70">
              <span className="font-stats text-[10px] text-text-dim w-4 tabular-nums">{i + 1}</span>
              <TeamAvatar team={t} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-text-muted truncate">{t.name}</div>
                <div className="font-stats text-[9px]"
                  style={{ color: t.buchholz >= 0 ? "rgba(245,200,66,0.5)" : "rgba(239,68,68,0.5)" }}>
                  BH {buchhStr(t.buchholz)}
                </div>
              </div>
              <RecordBadge wins={t.wins} losses={t.losses} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main Simulator ───────────────────────────────────────────────────────────

export function SwissSimulator() {
  const [state, dispatch]       = useReducer(reducer, undefined, createInitialState)
  const [viewRound, setViewRound] = useState<number | null>(null) // null = active round
  const [showBuchholzInfo, setShowBuchholzInfo] = useState(false)

  const byId = useMemo(
    () => Object.fromEntries(state.teams.map(t => [t.id, t])),
    [state.teams]
  )

  const activeIdx = activeRoundIdx(state)
  const displayIdx = viewRound !== null ? viewRound : activeIdx
  const currentRoundMatches = state.rounds[displayIdx] ?? []
  const complete = isComplete(state)

  const roundProgress = useCallback((idx: number) => {
    const r = state.rounds[idx]
    if (!r) return null
    const done = r.filter(m => m.winnerId).length
    return { done, total: r.length, pct: Math.round((done / r.length) * 100) }
  }, [state.rounds])

  // Team records at the START of the displayed round (for correct bracket labels)
  const preRoundByid = useMemo(() => {
    const snap = teamsAtRoundStart(state, displayIdx)
    return Object.fromEntries(snap.map(t => [t.id, t]))
  }, [state, displayIdx])

  // Group current round by W-L bracket (using pre-round records)
  const matchGroups = useMemo(() => {
    const groups: { label: string; matches: SimMatch[] }[] = []
    const seen = new Set<string>()
    for (const m of currentRoundMatches) {
      const a = preRoundByid[m.teamAId]
      if (!a) continue
      const key = `${a.wins}-${a.losses}`
      if (!seen.has(key)) {
        seen.add(key)
        const label = a.wins === 0 && a.losses === 0 ? "0–0" : `${a.wins}–${a.losses}`
        groups.push({ label, matches: [] })
      }
      groups[groups.length - 1]?.matches.push(m)
    }
    return groups
  }, [currentRoundMatches, preRoundByid])

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <ProgressBar state={state} />

      {/* Buchholz explainer toggle */}
      <div>
        <button
          onClick={() => setShowBuchholzInfo(v => !v)}
          className="flex items-center gap-2 text-[10px] font-display uppercase tracking-wider text-text-dim hover:text-text-muted transition-colors"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01"/>
          </svg>
          How seeding &amp; Buchholz works
          <svg className={`h-3 w-3 transition-transform duration-200 ${showBuchholzInfo ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </button>

        {showBuchholzInfo && (
          <div
            className="mt-3 rounded-2xl p-5 space-y-4 text-xs text-text-muted"
            style={{ background: "rgba(245,200,66,0.03)", boxShadow: "inset 0 0 0 1px rgba(245,200,66,0.1)" }}
          >
            <div className="grid sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <p className="font-display text-[10px] uppercase tracking-widest text-gold/60">Dutch Seeding (Rounds 1–2)</p>
                <p><span className="text-text font-medium">Round 1:</span> Seeds 1–8 face seeds 9–16 (seed 1 vs 9, 2 vs 10, etc.).</p>
                <p><span className="text-text font-medium">Round 2:</span> Within each bracket (1–0 and 0–1), sort teams by seed and fold-pair: seed-1 vs seed-5, seed-2 vs seed-6, etc.</p>
              </div>
              <div className="space-y-2">
                <p className="font-display text-[10px] uppercase tracking-widest text-slc-teal/60">Buchholz (Rounds 3–5)</p>
                <p>Each team&apos;s Buchholz = sum of (opponent wins − opponent losses) across all opponents faced so far.</p>
                <p>Within each W–L bracket, the team with the <span className="text-text">highest</span> Buchholz faces the team with the <span className="text-text">lowest</span> Buchholz. Rematches avoided when possible.</p>
              </div>
            </div>
            <div
              className="rounded-xl px-4 py-3 text-[11px]"
              style={{ background: "rgba(255,255,255,0.03)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)" }}
            >
              <p className="text-text-muted mb-1"><span className="text-text font-medium">Example:</span> Team A faced opponents with records 2–1, 1–2, 3–0.</p>
              <p>Buchholz = (2−1) + (1−2) + (3−0) = <span className="text-gold font-stats">+1 + −1 + +3 = +3</span></p>
            </div>
          </div>
        )}
      </div>

      {/* Layout: matches + sidebar */}
      <div className="grid lg:grid-cols-[1fr_280px] gap-6">
        {/* Left: rounds + matches */}
        <div className="space-y-4">

          {/* Round tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
            {state.rounds.map((r, i) => {
              const prog  = roundProgress(i)
              const isActive = i === activeIdx
              const isView   = displayIdx === i
              const allDone  = prog?.done === prog?.total

              return (
                <button
                  key={i}
                  onClick={() => setViewRound(i === activeIdx ? null : i)}
                  className={`
                    relative flex items-center gap-1.5 px-3 py-2 rounded-xl shrink-0 transition-all duration-200 text-[11px] font-display uppercase tracking-wider
                    ${isView
                      ? "text-text"
                      : "text-text-dim hover:text-text-muted"
                    }
                  `}
                  style={{
                    background: isView
                      ? allDone
                        ? "rgba(16,185,129,0.1)"
                        : "rgba(196,30,58,0.1)"
                      : "rgba(255,255,255,0.03)",
                    boxShadow: isView
                      ? allDone
                        ? "inset 0 0 0 1px rgba(16,185,129,0.25)"
                        : "inset 0 0 0 1px rgba(196,30,58,0.3)"
                      : "inset 0 0 0 1px rgba(255,255,255,0.06)",
                  }}
                >
                  {isActive && !allDone && (
                    <span className="h-1.5 w-1.5 rounded-full bg-slc-red animate-pulse shrink-0" />
                  )}
                  {allDone && <span className="h-1.5 w-1.5 rounded-full bg-success shrink-0" />}
                  {ROUND_LABELS[i]}
                  {prog && !allDone && (
                    <span className="font-stats text-[9px] text-text-dim">{prog.done}/{prog.total}</span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Round label + bracket groups */}
          {complete && displayIdx === activeIdx ? (
            <FinalResults teams={state.teams} />
          ) : (
            <div className="space-y-5">
              {matchGroups.length === 0 && (
                <div className="py-10 text-center text-sm text-text-muted">
                  Complete the previous round to unlock this one.
                </div>
              )}
              {matchGroups.map(({ label, matches }) => (
                <div key={label} className="space-y-2">
                  {matchGroups.length > 1 && (
                    <div className="flex items-center gap-2 px-1">
                      <div
                        className="h-px flex-1"
                        style={{ background: "linear-gradient(to right, rgba(196,30,58,0.3), transparent)" }}
                      />
                      <span className="font-display text-[9px] uppercase tracking-[0.3em] text-text-dim px-2">
                        {label} Bracket
                      </span>
                      <div
                        className="h-px flex-1"
                        style={{ background: "linear-gradient(to left, rgba(0,212,184,0.3), transparent)" }}
                      />
                    </div>
                  )}
                  <div className="grid sm:grid-cols-2 gap-2.5">
                    {matches.map(m => (
                      <MatchCard
                        key={m.id}
                        match={m}
                        teamA={byId[m.teamAId]}
                        teamB={byId[m.teamBId]}
                        dispatch={dispatch}
                        roundComplete={matches.every(x => x.winnerId)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Reset button */}
          <div className="flex justify-end pt-2">
            <button
              onClick={() => { dispatch({ type: "RESET" }); setViewRound(null) }}
              className="flex items-center gap-1.5 text-[10px] text-text-dim hover:text-danger transition-colors duration-200 font-display uppercase tracking-wider"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5"/>
              </svg>
              Reset simulation
            </button>
          </div>
        </div>

        {/* Right: standings */}
        <div className="space-y-4">
          <StandingsPanel teams={state.teams} />

          {/* Legend */}
          <div className="px-1 space-y-1.5">
            {[
              { color: "bg-success", label: "Qualified (3+ wins)" },
              { color: "bg-danger",  label: "Eliminated (3+ losses)" },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-2">
                <div className={`h-1.5 w-1.5 rounded-full ${color}`} />
                <span className="text-[9px] text-text-dim">{label}</span>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <span className="font-stats text-[9px] text-gold/60">BH</span>
              <span className="text-[9px] text-text-dim">= Buchholz score</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
