"use client"

import { useReducer, useMemo, useState, useCallback } from "react"
import {
  createTournamentState,
  setTMatchResult,
  clearTMatch,
  populatePlayoffs,
  getTeam,
  ALL_TEAMS,
  PLAYIN_MATCH_DEFS,
  PLAYOFF_MATCH_DEFS,
  type TournamentState,
  type TTeam,
  type TMatch,
} from "@/lib/simulator/tournament"
import {
  createInitialState,
  setMatchResult,
  clearResult,
  activeRoundIdx,
  teamsAtRoundStart,
  isComplete,
  qualifiedCount,
  eliminatedCount,
  BLAST_SLC_TEAMS,
  type SwissState,
  type SwissTeamState,
  type SimMatch,
} from "@/lib/simulator/swiss-engine"

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase = "playin" | "swiss" | "playoffs"

type TAction =
  | { type: "SET_PI"; matchId: string; winnerId: string; mapsLoser: 0 | 1 }
  | { type: "CLEAR_PI"; matchId: string }
  | { type: "SET_SW"; matchId: string; winnerId: string; mapsLoser: 0 | 1 }
  | { type: "CLEAR_SW"; matchId: string }
  | { type: "SET_PO"; matchId: string; winnerId: string; mapsLoser: 0 | 1 }
  | { type: "CLEAR_PO"; matchId: string }
  | { type: "RESET" }

interface FullState {
  playin: TournamentState
  swiss: SwissState
  playoffs: TournamentState
}

// ─── Swiss teams merged with Play-In qualifiers ───────────────────────────────

function buildSwissTeams(playinQuals: Record<number, string | null>) {
  // Seeds 1-12: direct teams from BLAST_SLC_TEAMS (already in swiss-engine)
  // Seeds 13-16: Play-In qualifiers — override the swiss-engine defaults
  const teams = BLAST_SLC_TEAMS.map(t => {
    if (t.seed >= 13 && t.seed <= 16) {
      const qualId = playinQuals[t.seed]
      if (qualId) {
        const team = ALL_TEAMS[qualId]
        if (team) {
          return { ...t, id: qualId, name: team.name, shortName: team.shortName, color: team.color }
        }
      }
    }
    return t
  })
  return teams
}

function createFullState(): FullState {
  return {
    playin: createTournamentState(),
    swiss: createInitialState(),
    playoffs: createTournamentState(),
  }
}

// ─── Reducer ──────────────────────────────────────────────────────────────────

function fullReducer(state: FullState, action: TAction): FullState {
  switch (action.type) {
    case "SET_PI": {
      const playin = setTMatchResult(state.playin, action.matchId, action.winnerId, action.mapsLoser)
      // Rebuild Swiss if Play-In qualifiers changed
      const newTeams = buildSwissTeams(playin.playinQualifiers)
      const swiss = createInitialState(newTeams)
      const playoffs = createTournamentState()
      return { playin, swiss, playoffs }
    }
    case "CLEAR_PI": {
      const playin = clearTMatch(state.playin, action.matchId)
      const newTeams = buildSwissTeams(playin.playinQualifiers)
      const swiss = createInitialState(newTeams)
      const playoffs = createTournamentState()
      return { playin, swiss, playoffs }
    }
    case "SET_SW": {
      const swiss = setMatchResult(state.swiss, action.matchId, action.winnerId, 2, action.mapsLoser)
      // If Swiss is complete, populate playoffs
      const qualifiers = swiss.teams
        .filter(t => t.status === "qualified")
        .sort((a, b) => {
          const wDiff = b.wins - a.wins
          if (wDiff !== 0) return wDiff
          const bhDiff = b.buchholz - a.buchholz
          if (bhDiff !== 0) return bhDiff
          return a.seed - b.seed
        })
        .map(t => t.id)
      const allQualified = qualifiers.length === 8
      const playoffs = allQualified
        ? populatePlayoffs(state.playoffs, qualifiers)
        : state.playoffs
      return { ...state, swiss, playoffs }
    }
    case "CLEAR_SW": {
      const swiss = clearResult(state.swiss, action.matchId)
      const playoffs = createTournamentState()
      return { ...state, swiss, playoffs }
    }
    case "SET_PO": {
      const playoffs = setTMatchResult(state.playoffs, action.matchId, action.winnerId, action.mapsLoser)
      return { ...state, playoffs }
    }
    case "CLEAR_PO": {
      const playoffs = clearTMatch(state.playoffs, action.matchId)
      return { ...state, playoffs }
    }
    case "RESET":
      return createFullState()
    default:
      return state
  }
}

// ─── Team chip ────────────────────────────────────────────────────────────────

function TeamChip({
  teamId,
  extraTeams,
  isWinner,
  isLoser,
  onClick,
  mapsWon,
  mapsLost,
  size = "md",
}: {
  teamId: string | null
  extraTeams?: Record<string, TTeam>
  isWinner?: boolean
  isLoser?: boolean
  onClick?: () => void
  mapsWon?: number
  mapsLost?: number
  size?: "sm" | "md"
}) {
  const team = teamId ? (ALL_TEAMS[teamId] ?? extraTeams?.[teamId] ?? null) : null
  const isTbd = !team

  const base = size === "sm"
    ? "flex items-center gap-1.5 px-2 py-1 rounded text-[10px]"
    : "flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs"

  const bg = isWinner
    ? "bg-white/10 ring-1 ring-white/20"
    : isLoser
    ? "opacity-40 bg-white/3"
    : isTbd
    ? "bg-white/3 ring-1 ring-dashed ring-white/10"
    : onClick
    ? "bg-white/5 ring-1 ring-white/10 hover:bg-white/10 hover:ring-white/20 cursor-pointer transition-all duration-150"
    : "bg-white/5 ring-1 ring-white/10"

  return (
    <div className={`${base} ${bg} font-display tracking-wide`} onClick={onClick}>
      {team ? (
        <>
          <span
            className={size === "sm" ? "h-4 w-4 rounded-sm flex-shrink-0 flex items-center justify-center text-[7px] font-bold" : "h-5 w-5 rounded flex-shrink-0 flex items-center justify-center text-[8px] font-bold"}
            style={{ background: team.color + "30", color: team.color, border: `1px solid ${team.color}40` }}
          >
            {team.shortName.slice(0, 2)}
          </span>
          <span className={`font-semibold ${isLoser ? "text-text-muted" : "text-text"} truncate max-w-[72px]`}>
            {team.shortName}
          </span>
          {mapsWon !== undefined && (
            <span className={`ml-auto font-bold tabular-nums ${isWinner ? "text-slc-teal" : "text-text-muted"}`}>
              {mapsWon}
            </span>
          )}
        </>
      ) : (
        <span className="text-text-muted/40 italic">TBD</span>
      )}
    </div>
  )
}

// ─── Score pills ──────────────────────────────────────────────────────────────

function ScorePills({
  match,
  onScore,
}: {
  match: { teamA: string | null; teamB: string | null; winnerId: string | null }
  onScore: (winnerId: string, mapsLoser: 0 | 1) => void
}) {
  if (!match.teamA || !match.teamB) return null
  if (match.winnerId) return null

  return (
    <div className="flex gap-1 justify-center mt-1">
      {(["2-0", "2-1"] as const).map(score => (
        <div key={score} className="flex gap-0.5">
          <button
            onClick={() => onScore(match.teamA!, score === "2-0" ? 0 : 1)}
            className="px-1.5 py-0.5 rounded text-[9px] font-display text-text-muted hover:text-slc-red hover:bg-slc-red/10 transition-colors duration-100"
            title={`${match.teamA} wins ${score}`}
          >
            A {score}
          </button>
          <button
            onClick={() => onScore(match.teamB!, score === "2-0" ? 0 : 1)}
            className="px-1.5 py-0.5 rounded text-[9px] font-display text-text-muted hover:text-slc-red hover:bg-slc-red/10 transition-colors duration-100"
            title={`${match.teamB} wins ${score}`}
          >
            B {score}
          </button>
        </div>
      ))}
    </div>
  )
}

// ─── Bracket match card ───────────────────────────────────────────────────────

function BracketMatchCard({
  match,
  extraTeams,
  onScore,
  onClear,
  label,
}: {
  match: TMatch
  extraTeams: Record<string, TTeam>
  onScore: (winnerId: string, mapsLoser: 0 | 1) => void
  onClear: () => void
  label?: string
}) {
  const hasTeams = match.teamA && match.teamB
  const played = !!match.winnerId

  return (
    <div className="flex flex-col">
      {label && (
        <span className="text-[8px] uppercase tracking-widest text-text-muted/50 font-display mb-1 text-center">{label}</span>
      )}
      <div
        className={`rounded-lg overflow-hidden border ${
          played
            ? "border-white/10 bg-surface/60"
            : hasTeams
            ? "border-white/8 bg-surface/40"
            : "border-dashed border-white/6 bg-surface/20"
        } min-w-[130px]`}
        style={{ transition: "border-color 0.2s" }}
      >
        <TeamChip
          teamId={match.teamA}
          extraTeams={extraTeams}
          isWinner={played && match.winnerId === match.teamA}
          isLoser={played && match.winnerId !== match.teamA}
          onClick={hasTeams && !played ? () => onScore(match.teamA!, 0) : undefined}
          mapsWon={played ? match.mapsA : undefined}
        />
        <div className="h-px bg-white/5" />
        <TeamChip
          teamId={match.teamB}
          extraTeams={extraTeams}
          isWinner={played && match.winnerId === match.teamB}
          isLoser={played && match.winnerId !== match.teamB}
          onClick={hasTeams && !played ? () => onScore(match.teamB!, 0) : undefined}
          mapsWon={played ? match.mapsB : undefined}
        />
        {hasTeams && !played && (
          <div className="border-t border-white/5 px-1.5 py-1">
            <div className="flex gap-1 flex-wrap justify-center">
              {([match.teamA, match.teamB] as string[]).flatMap(winnerId =>
                ([0, 1] as const).map(ml => {
                  const wTeam = ALL_TEAMS[winnerId] ?? extraTeams[winnerId]
                  return (
                    <button
                      key={`${winnerId}-${ml}`}
                      onClick={() => onScore(winnerId, ml)}
                      className="px-1.5 py-0.5 rounded text-[8px] font-display text-text-muted hover:text-white hover:bg-white/10 transition-all duration-100 whitespace-nowrap"
                    >
                      {wTeam?.shortName ?? "?"} 2-{ml}
                    </button>
                  )
                })
              )}
            </div>
          </div>
        )}
        {played && (
          <div className="border-t border-white/5 flex justify-end px-1.5 py-0.5">
            <button
              onClick={onClear}
              className="text-[8px] text-text-muted/40 hover:text-slc-red/80 transition-colors font-display"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Bracket connector line ───────────────────────────────────────────────────
// Creates the classic "}" shape connecting two matches to one.

function BracketConnector({ topOffset }: { topOffset?: string }) {
  return (
    <div className="flex items-stretch w-5 flex-shrink-0" style={{ minHeight: 0 }}>
      <div className="flex flex-col w-full">
        <div className="flex-1 border-r border-t border-white/15" style={{ borderTopRightRadius: 4 }} />
        <div className="flex-1 border-r border-b border-white/15" style={{ borderBottomRightRadius: 4 }} />
      </div>
    </div>
  )
}

function SingleConnector() {
  return (
    <div className="w-5 flex-shrink-0 border-t border-white/15 self-center" />
  )
}

// ─── Play-In bracket ──────────────────────────────────────────────────────────

function PlayInBracket({
  state,
  onScore,
  onClear,
}: {
  state: TournamentState
  onScore: (matchId: string, winnerId: string, ml: 0 | 1) => void
  onClear: (matchId: string) => void
}) {
  const m = state.matches
  const et = state.extraTeams

  const matchCard = (id: string, label?: string) => (
    <BracketMatchCard
      key={id}
      match={m[id]}
      extraTeams={et}
      label={label}
      onScore={(w, ml) => onScore(id, w, ml)}
      onClear={() => onClear(id)}
    />
  )

  return (
    <div className="overflow-x-auto pb-4">
      <div className="min-w-[700px]">
        {/* Upper Bracket */}
        <div className="mb-2">
          <div className="text-[9px] uppercase tracking-widest text-text-muted/40 font-display mb-3 flex items-center gap-2">
            <span className="h-px flex-1 bg-white/8" />
            Upper Bracket
            <span className="h-px flex-1 bg-white/8" />
          </div>

          <div className="flex items-center gap-0">
            {/* UBR1 */}
            <div className="flex flex-col gap-3">
              <div className="text-[8px] uppercase tracking-widest text-text-muted/30 font-display text-center mb-1">Round 1</div>
              <div className="flex flex-col gap-3">
                {matchCard("pi-u1a")}
                {matchCard("pi-u1b")}
              </div>
              <div className="flex flex-col gap-3">
                {matchCard("pi-u1c")}
                {matchCard("pi-u1d")}
              </div>
            </div>

            {/* Connector UBR1→UBR2 */}
            <div className="flex flex-col" style={{ gap: 12 }}>
              <div className="flex flex-col" style={{ height: 90 }}>
                <BracketConnector />
              </div>
              <div style={{ height: 12 }} />
              <div className="flex flex-col" style={{ height: 90 }}>
                <BracketConnector />
              </div>
            </div>

            {/* UBR2 + qualify badges */}
            <div className="flex flex-col gap-3" style={{ justifyContent: "space-around" }}>
              <div className="text-[8px] uppercase tracking-widest text-text-muted/30 font-display text-center mb-1">Round 2</div>
              <div className="relative">
                {matchCard("pi-u2a")}
                {m["pi-u2a"].winnerId && (
                  <QualifyBadge seed={13} teamId={m["pi-u2a"].winnerId} extraTeams={et} />
                )}
              </div>
              <div style={{ height: 24 }} />
              <div className="relative">
                {matchCard("pi-u2b")}
                {m["pi-u2b"].winnerId && (
                  <QualifyBadge seed={14} teamId={m["pi-u2b"].winnerId} extraTeams={et} />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-white/6 my-4" />

        {/* Lower Bracket */}
        <div>
          <div className="text-[9px] uppercase tracking-widest text-text-muted/40 font-display mb-3 flex items-center gap-2">
            <span className="h-px flex-1 bg-white/8" />
            Lower Bracket
            <span className="h-px flex-1 bg-white/8" />
          </div>

          <div className="flex items-center gap-0">
            {/* LBR1 */}
            <div className="flex flex-col gap-3">
              <div className="text-[8px] uppercase tracking-widest text-text-muted/30 font-display text-center mb-1">Round 1</div>
              {matchCard("pi-l1a")}
              <div style={{ height: 12 }} />
              {matchCard("pi-l1b")}
            </div>

            {/* Connectors LBR1→LBR2 */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-col" style={{ height: 64 }}>
                <BracketConnector />
              </div>
              <div style={{ height: 24 }} />
              <div className="flex flex-col" style={{ height: 64 }}>
                <BracketConnector />
              </div>
            </div>

            {/* LBR2 + qualify badges */}
            <div className="flex flex-col gap-3" style={{ justifyContent: "space-around" }}>
              <div className="text-[8px] uppercase tracking-widest text-text-muted/30 font-display text-center mb-1">Round 2</div>
              <div className="relative">
                {matchCard("pi-l2a")}
                {m["pi-l2a"].winnerId && (
                  <QualifyBadge seed={15} teamId={m["pi-l2a"].winnerId} extraTeams={et} />
                )}
              </div>
              <div style={{ height: 24 }} />
              <div className="relative">
                {matchCard("pi-l2b")}
                {m["pi-l2b"].winnerId && (
                  <QualifyBadge seed={16} teamId={m["pi-l2b"].winnerId} extraTeams={et} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function QualifyBadge({ seed, teamId, extraTeams }: { seed: number; teamId: string | null; extraTeams: Record<string, TTeam> }) {
  const team = teamId ? (ALL_TEAMS[teamId] ?? extraTeams[teamId]) : null
  return (
    <div className="mt-1.5 flex items-center gap-1.5 px-2 py-1 rounded-md text-[9px] font-display"
      style={{ background: "rgba(0,212,184,0.08)", border: "1px solid rgba(0,212,184,0.2)", color: "#00D4B8" }}>
      <span className="font-bold">✓ Swiss #{seed}</span>
      {team && <span className="text-white/60">· {team.shortName}</span>}
    </div>
  )
}

// ─── Swiss bracket (5-round flow) ────────────────────────────────────────────

function SwissBracket({
  state,
  onScore,
  onClear,
}: {
  state: SwissState
  onScore: (matchId: string, winnerId: string, ml: 0 | 1) => void
  onClear: (matchId: string) => void
}) {
  const rounds = state.rounds
  const activeRound = activeRoundIdx(state)
  const complete = isComplete(state)

  // Bracket labels per bracket (wins-losses)
  const BRACKET_LABELS: Record<string, string> = {
    "0-0": "Opening",
    "1-0": "1-0 Bracket", "0-1": "0-1 Bracket",
    "2-0": "2-0 Bracket", "1-1": "1-1 Bracket", "0-2": "0-2 Bracket",
    "2-1": "2-1 Bracket", "1-2": "1-2 Bracket",
    "2-2": "Match Point",
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-0 min-w-[700px]">
        {rounds.map((round, rIdx) => {
          const preTeams = teamsAtRoundStart(state, rIdx)
          const preById = Object.fromEntries(preTeams.map(t => [t.id, t]))

          // Group matches by their W-L bracket
          const groups = new Map<string, SimMatch[]>()
          for (const m of round) {
            const tA = preById[m.teamAId]
            const tB = preById[m.teamBId]
            const key = tA && tB ? `${tA.wins}-${tA.losses}` : "?"
            if (!groups.has(key)) groups.set(key, [])
            groups.get(key)!.push(m)
          }

          const isActive = rIdx === activeRound && !complete
          const isPast = rIdx < activeRound || (rIdx === activeRound && round.every(m => m.winnerId !== null))

          return (
            <div key={rIdx} className="flex">
              {/* Round column */}
              <div
                className={`flex flex-col gap-4 px-3 py-3 rounded-xl min-w-[170px] transition-all duration-300 ${
                  isActive
                    ? "bg-white/3 ring-1 ring-slc-red/20"
                    : "bg-transparent"
                }`}
              >
                {/* Round header */}
                <div className="text-center">
                  <div className={`text-[9px] uppercase tracking-widest font-display ${isActive ? "text-slc-red" : "text-text-muted/40"}`}>
                    {["Round 1", "Round 2", "Round 3", "Round 4", "Round 5"][rIdx]}
                  </div>
                  <div className="text-[8px] text-text-muted/30 font-display mt-0.5">
                    {round.length} match{round.length !== 1 ? "es" : ""}
                  </div>
                </div>

                {/* Match groups */}
                {[...groups.entries()].sort(([a], [b]) => {
                  const [aw, al] = a.split("-").map(Number)
                  const [bw, bl] = b.split("-").map(Number)
                  return (bw - aw) || (al - bl)
                }).map(([key, matches]) => (
                  <div key={key} className="flex flex-col gap-2">
                    {groups.size > 1 && (
                      <div className="text-[7px] uppercase tracking-widest text-text-muted/30 font-display text-center px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.03)" }}>
                        {BRACKET_LABELS[key] ?? key}
                      </div>
                    )}
                    {matches.map(m => {
                      const tA = state.teams.find(t => t.id === m.teamAId)
                      const tB = state.teams.find(t => t.id === m.teamBId)
                      const played = !!m.winnerId

                      return (
                        <SwissMatchCard
                          key={m.id}
                          match={m}
                          teamA={tA ?? null}
                          teamB={tB ?? null}
                          onScore={(w, ml) => onScore(m.id, w, ml)}
                          onClear={() => onClear(m.id)}
                        />
                      )
                    })}
                  </div>
                ))}
              </div>

              {/* Column connector arrow → */}
              {rIdx < rounds.length - 1 && (
                <div className="flex items-center px-0.5">
                  <div className="w-4 border-t border-dashed border-white/10" />
                </div>
              )}
            </div>
          )
        })}

        {/* Qualified / Eliminated summary */}
        {complete && (
          <div className="flex flex-col gap-2 px-4 py-3 justify-center">
            <div className="text-[9px] uppercase tracking-widest text-slc-teal font-display">Qualified ✓</div>
            {state.teams.filter(t => t.status === "qualified").sort((a,b) => b.wins - a.wins || b.buchholz - a.buchholz || a.seed - b.seed).map((t, i) => (
              <div key={t.id} className="flex items-center gap-2 text-[10px] font-display">
                <span className="text-text-muted/50 w-4">#{i+1}</span>
                <span
                  className="h-4 w-4 rounded flex items-center justify-center text-[7px] font-bold flex-shrink-0"
                  style={{ background: t.color + "30", color: t.color, border: `1px solid ${t.color}40` }}
                >
                  {t.shortName.slice(0,2)}
                </span>
                <span className="text-text">{t.shortName}</span>
                <span className="text-text-muted/40 ml-auto">{t.wins}-{t.losses}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function SwissMatchCard({
  match,
  teamA,
  teamB,
  onScore,
  onClear,
}: {
  match: SimMatch
  teamA: SwissTeamState | null
  teamB: SwissTeamState | null
  onScore: (winnerId: string, ml: 0 | 1) => void
  onClear: () => void
}) {
  const played = !!match.winnerId

  return (
    <div className={`rounded-lg overflow-hidden border min-w-[150px] ${
      played ? "border-white/10 bg-surface/60" : "border-white/8 bg-surface/40"
    }`}>
      <SwissTeamRow
        team={teamA}
        isWinner={played && match.winnerId === match.teamAId}
        isLoser={played && match.winnerId !== match.teamAId}
        mapsWon={played ? match.mapsA : undefined}
        onClick={!played && teamA && teamB ? () => onScore(match.teamAId, 0) : undefined}
      />
      <div className="h-px bg-white/5" />
      <SwissTeamRow
        team={teamB}
        isWinner={played && match.winnerId === match.teamBId}
        isLoser={played && match.winnerId !== match.teamBId}
        mapsWon={played ? match.mapsB : undefined}
        onClick={!played && teamA && teamB ? () => onScore(match.teamBId, 0) : undefined}
      />
      {teamA && teamB && !played && (
        <div className="border-t border-white/5 px-1.5 py-1">
          <div className="flex gap-1 flex-wrap justify-center">
            {([teamA, teamB] as SwissTeamState[]).flatMap(t =>
              ([0, 1] as const).map(ml => (
                <button
                  key={`${t.id}-${ml}`}
                  onClick={() => onScore(t.id, ml)}
                  className="px-1.5 py-0.5 rounded text-[8px] font-display text-text-muted hover:text-white hover:bg-white/10 transition-all duration-100 whitespace-nowrap"
                >
                  {t.shortName} 2-{ml}
                </button>
              ))
            )}
          </div>
        </div>
      )}
      {played && (
        <div className="border-t border-white/5 flex justify-end px-1.5 py-0.5">
          <button onClick={onClear} className="text-[8px] text-text-muted/40 hover:text-slc-red/80 transition-colors font-display">✕</button>
        </div>
      )}
    </div>
  )
}

function SwissTeamRow({
  team,
  isWinner,
  isLoser,
  mapsWon,
  onClick,
}: {
  team: SwissTeamState | null
  isWinner?: boolean
  isLoser?: boolean
  mapsWon?: number
  onClick?: () => void
}) {
  if (!team) return (
    <div className="flex items-center gap-2 px-2.5 py-1.5 text-xs">
      <span className="text-text-muted/30 italic text-[10px]">TBD</span>
    </div>
  )
  return (
    <div
      className={`flex items-center gap-2 px-2.5 py-1.5 text-[11px] font-display tracking-wide ${
        isLoser ? "opacity-40" : ""
      } ${onClick ? "cursor-pointer hover:bg-white/5 transition-colors" : ""}`}
      onClick={onClick}
    >
      <span
        className="h-5 w-5 rounded flex-shrink-0 flex items-center justify-center text-[7px] font-bold"
        style={{ background: team.color + "30", color: team.color, border: `1px solid ${team.color}40` }}
      >
        {team.shortName.slice(0, 2)}
      </span>
      <span className={`font-semibold ${isLoser ? "text-text-muted" : "text-text"} truncate max-w-[68px]`}>
        {team.shortName}
      </span>
      <span className="text-text-muted/40 text-[8px] ml-auto whitespace-nowrap">
        {team.wins}-{team.losses}
      </span>
      {mapsWon !== undefined && (
        <span className={`font-bold tabular-nums text-xs ${isWinner ? "text-slc-teal" : "text-text-muted/40"}`}>
          {mapsWon}
        </span>
      )}
    </div>
  )
}

// ─── Playoffs bracket ─────────────────────────────────────────────────────────

function PlayoffsBracket({
  state,
  swissQualifiers,
  swissComplete,
  onScore,
  onClear,
}: {
  state: TournamentState
  swissQualifiers: (string | null)[]
  swissComplete: boolean
  onScore: (matchId: string, winnerId: string, ml: 0 | 1) => void
  onClear: (matchId: string) => void
}) {
  const m = state.matches
  const et = state.extraTeams

  if (!swissComplete) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="text-4xl opacity-20">🏆</div>
        <p className="text-text-muted text-sm font-display">Complete the Swiss Stage to unlock Playoffs</p>
        <div className="flex gap-2 flex-wrap justify-center">
          {swissQualifiers.map((id, i) => (
            <div
              key={i}
              className={`px-2 py-1 rounded text-[10px] font-display ${id ? "text-slc-teal" : "text-text-muted/30 border border-dashed border-white/10"}`}
              style={id ? { background: "rgba(0,212,184,0.08)", border: "1px solid rgba(0,212,184,0.2)" } : {}}
            >
              {id ? (ALL_TEAMS[id] ?? et[id])?.shortName ?? id : `#${i + 1}`}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const matchCard = (id: string, label?: string) => (
    <BracketMatchCard
      key={id}
      match={m[id]}
      extraTeams={et}
      label={label}
      onScore={(w, ml) => onScore(id, w, ml)}
      onClear={() => onClear(id)}
    />
  )

  const champion = m["po-final"]?.winnerId
    ? (ALL_TEAMS[m["po-final"].winnerId] ?? et[m["po-final"].winnerId])
    : null

  return (
    <div className="overflow-x-auto pb-4">
      <div className="min-w-[640px]">
        {/* Quarter Finals → Semi Finals → Final */}
        <div className="flex items-center gap-0">
          {/* QFs — split into two halves */}
          <div className="flex flex-col gap-8">
            <div className="text-[8px] uppercase tracking-widest text-text-muted/30 font-display text-center mb-1">Quarter Finals</div>
            <div className="flex flex-col gap-2">
              {matchCard("po-qf1", "1 vs 8")}
              {matchCard("po-qf2", "4 vs 5")}
            </div>
            <div className="flex flex-col gap-2">
              {matchCard("po-qf3", "2 vs 7")}
              {matchCard("po-qf4", "3 vs 6")}
            </div>
          </div>

          {/* Connectors QF→SF */}
          <div className="flex flex-col gap-0">
            <div className="flex flex-col" style={{ height: 100 }}>
              <BracketConnector />
            </div>
            <div style={{ height: 64 }} />
            <div className="flex flex-col" style={{ height: 100 }}>
              <BracketConnector />
            </div>
          </div>

          {/* SFs */}
          <div className="flex flex-col gap-8" style={{ justifyContent: "space-around" }}>
            <div className="text-[8px] uppercase tracking-widest text-text-muted/30 font-display text-center mb-1">Semi Finals</div>
            {matchCard("po-sf1")}
            <div style={{ height: 16 }} />
            {matchCard("po-sf2")}
          </div>

          {/* Connectors SF→Final */}
          <div className="flex flex-col" style={{ height: 200 }}>
            <BracketConnector />
          </div>

          {/* Final */}
          <div className="flex flex-col items-center gap-2">
            <div className="text-[8px] uppercase tracking-widest text-text-muted/30 font-display text-center mb-1">Grand Final</div>
            {matchCard("po-final")}
            {champion && (
              <div
                className="mt-2 flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-display font-bold"
                style={{
                  background: "linear-gradient(135deg, rgba(196,30,58,0.2), rgba(0,212,184,0.2))",
                  border: "1px solid rgba(0,212,184,0.3)",
                  color: "#00D4B8",
                }}
              >
                🏆 {champion.shortName} — Champion
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function PhaseProgress({ phase, swiss, playin }: { phase: Phase; swiss: SwissState; playin: TournamentState }) {
  const playinDone = Object.values(playin.playinQualifiers).every(v => v !== null)
  const swissDone = isComplete(swiss)
  const qCount = qualifiedCount(swiss)
  const eCount = eliminatedCount(swiss)
  const piQCount = Object.values(playin.playinQualifiers).filter(v => v !== null).length

  return (
    <div className="flex items-center gap-3 text-[9px] font-display uppercase tracking-wider text-text-muted/60">
      <span className={playinDone ? "text-slc-teal" : phase === "playin" ? "text-white" : ""}>
        {playinDone ? "✓" : "·"} Play-In {playinDone ? `(${piQCount}/4)` : `(${piQCount}/4)`}
      </span>
      <span className="text-white/20">›</span>
      <span className={swissDone ? "text-slc-teal" : phase === "swiss" ? "text-white" : ""}>
        {swissDone ? "✓" : "·"} Swiss {swissDone ? `(8/8)` : `(${qCount}/8)`}
      </span>
      <span className="text-white/20">›</span>
      <span className={phase === "playoffs" ? "text-white" : ""}>
        · Playoffs
      </span>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function TournamentSimulator() {
  const [state, dispatch] = useReducer(fullReducer, undefined, createFullState)
  const [phase, setPhase] = useState<Phase>("playin")

  const swissComplete = isComplete(state.swiss)
  const swissQuals = useMemo(() => {
    if (!swissComplete) return state.swiss.teams.filter(t => t.status === "qualified").map(t => t.id)
    return state.swiss.teams
      .filter(t => t.status === "qualified")
      .sort((a, b) => b.wins - a.wins || b.buchholz - a.buchholz || a.seed - b.seed)
      .map(t => t.id)
  }, [state.swiss, swissComplete])

  const PHASES: { id: Phase; label: string; tag: string }[] = [
    { id: "playin",   label: "Play-In",  tag: "8 teams" },
    { id: "swiss",    label: "Swiss",    tag: "5 rounds" },
    { id: "playoffs", label: "Playoffs", tag: "Top 8" },
  ]

  return (
    <div className="space-y-6">
      {/* Phase tabs + progress */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          {PHASES.map(p => (
            <button
              key={p.id}
              onClick={() => setPhase(p.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-display font-semibold tracking-wide transition-all duration-200 ${
                phase === p.id
                  ? "bg-slc-red text-white"
                  : "text-text-muted hover:text-text hover:bg-white/5"
              }`}
            >
              {p.label}
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-display ${
                phase === p.id ? "bg-white/20 text-white" : "bg-white/6 text-text-muted/60"
              }`}>
                {p.tag}
              </span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <PhaseProgress phase={phase} swiss={state.swiss} playin={state.playin} />
          <button
            onClick={() => dispatch({ type: "RESET" })}
            className="text-[9px] font-display uppercase tracking-widest text-text-muted/40 hover:text-slc-red/80 transition-colors px-2 py-1 rounded hover:bg-slc-red/5"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Phase content */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="p-4 sm:p-6">
          {phase === "playin" && (
            <PlayInBracket
              state={state.playin}
              onScore={(id, w, ml) => dispatch({ type: "SET_PI", matchId: id, winnerId: w, mapsLoser: ml })}
              onClear={id => dispatch({ type: "CLEAR_PI", matchId: id })}
            />
          )}
          {phase === "swiss" && (
            <SwissBracket
              state={state.swiss}
              onScore={(id, w, ml) => dispatch({ type: "SET_SW", matchId: id, winnerId: w, mapsLoser: ml })}
              onClear={id => dispatch({ type: "CLEAR_SW", matchId: id })}
            />
          )}
          {phase === "playoffs" && (
            <PlayoffsBracket
              state={state.playoffs}
              swissQualifiers={Array(8).fill(null).map((_, i) => swissQuals[i] ?? null)}
              swissComplete={swissComplete}
              onScore={(id, w, ml) => dispatch({ type: "SET_PO", matchId: id, winnerId: w, mapsLoser: ml })}
              onClear={id => dispatch({ type: "CLEAR_PO", matchId: id })}
            />
          )}
        </div>
      </div>

      {/* Swiss qualifiers banner — shown below Swiss tab when teams qualify */}
      {phase === "swiss" && qualifiedCount(state.swiss) > 0 && (
        <div className="rounded-xl px-4 py-3" style={{ background: "rgba(0,212,184,0.05)", border: "1px solid rgba(0,212,184,0.15)" }}>
          <div className="text-[9px] uppercase tracking-widest text-slc-teal/70 font-display mb-2">Swiss Qualifiers</div>
          <div className="flex flex-wrap gap-2">
            {state.swiss.teams
              .filter(t => t.status === "qualified")
              .sort((a, b) => b.wins - a.wins || b.buchholz - a.buchholz || a.seed - b.seed)
              .map((t, i) => (
                <div
                  key={t.id}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-display"
                  style={{ background: "rgba(0,212,184,0.08)", border: "1px solid rgba(0,212,184,0.2)" }}
                >
                  <span className="text-slc-teal/60 text-[8px]">#{i+1}</span>
                  <span
                    className="h-4 w-4 rounded flex items-center justify-center text-[7px] font-bold"
                    style={{ background: t.color + "30", color: t.color }}
                  >
                    {t.shortName.slice(0, 2)}
                  </span>
                  <span className="text-text">{t.shortName}</span>
                </div>
              ))}
            {eliminatedCount(state.swiss) > 0 && (
              <div className="ml-auto flex items-center gap-1 text-[9px] text-text-muted/40 font-display">
                <span className="text-slc-red/60">{eliminatedCount(state.swiss)}</span> eliminated
              </div>
            )}
          </div>
        </div>
      )}

      {/* Auto-advance hint */}
      {phase === "playin" && Object.values(state.playin.playinQualifiers).some(v => v !== null) && (
        <div
          className="rounded-xl px-4 py-3 flex items-center gap-3"
          style={{ background: "rgba(196,30,58,0.05)", border: "1px solid rgba(196,30,58,0.15)" }}
        >
          <span className="text-slc-red/70 text-sm">→</span>
          <p className="text-[10px] text-text-muted font-display">
            Play-In qualifiers auto-populate Swiss seeds 13–16.{" "}
            <button onClick={() => setPhase("swiss")} className="text-slc-teal/80 underline hover:text-slc-teal transition-colors">
              Go to Swiss
            </button>
          </p>
        </div>
      )}

      {swissComplete && phase === "swiss" && (
        <div
          className="rounded-xl px-4 py-3 flex items-center gap-3"
          style={{ background: "rgba(0,212,184,0.05)", border: "1px solid rgba(0,212,184,0.2)" }}
        >
          <span className="text-slc-teal text-sm">✓</span>
          <p className="text-[10px] text-text-muted font-display">
            Swiss complete! Top 8 seeded into Playoffs.{" "}
            <button onClick={() => setPhase("playoffs")} className="text-slc-teal underline hover:text-slc-teal/80 transition-colors">
              View Playoffs →
            </button>
          </p>
        </div>
      )}
    </div>
  )
}
