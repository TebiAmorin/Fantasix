"use client"

import { useReducer, useMemo, useState, useEffect, useRef } from "react"
import {
  createTournamentState, setTMatchResult, clearTMatch, populatePlayoffs,
  ALL_TEAMS, type TournamentState, type TTeam, type TMatch,
} from "@/lib/simulator/tournament"
import {
  createInitialState, setMatchResult, clearResult,
  activeRoundIdx, teamsAtRoundStart, isComplete, qualifiedCount, eliminatedCount,
  BLAST_SLC_TEAMS, type SwissState, type SwissTeamState, type SimMatch,
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
  | { type: "SIMULATE_PI" }
  | { type: "SIMULATE_SW" }
  | { type: "SIMULATE_PO" }
  | { type: "RESET" }

function rndWinner(a: string, b: string): { w: string; ml: 0 | 1 } {
  return { w: Math.random() < 0.5 ? a : b, ml: Math.random() < 0.5 ? 0 : 1 }
}

interface FullState {
  playin: TournamentState
  swiss: SwissState
  playoffs: TournamentState
}

function buildSwissTeams(playinQuals: Record<number, string | null>) {
  return BLAST_SLC_TEAMS.map(t => {
    if (t.seed >= 13 && t.seed <= 16) {
      const qualId = playinQuals[t.seed]
      if (qualId) {
        const team = ALL_TEAMS[qualId]
        if (team) return { ...t, id: qualId, name: team.name, shortName: team.shortName, color: team.color }
      }
    }
    return t
  })
}

function createFullState(): FullState {
  return {
    playin: createTournamentState(),
    swiss: createInitialState(),
    playoffs: createTournamentState(),
  }
}

function fullReducer(state: FullState, action: TAction): FullState {
  switch (action.type) {
    case "SET_PI": {
      const playin = setTMatchResult(state.playin, action.matchId, action.winnerId, action.mapsLoser)
      const newTeams = buildSwissTeams(playin.playinQualifiers)
      return { playin, swiss: createInitialState(newTeams), playoffs: createTournamentState() }
    }
    case "CLEAR_PI": {
      const playin = clearTMatch(state.playin, action.matchId)
      const newTeams = buildSwissTeams(playin.playinQualifiers)
      return { playin, swiss: createInitialState(newTeams), playoffs: createTournamentState() }
    }
    case "SET_SW": {
      const swiss = setMatchResult(state.swiss, action.matchId, action.winnerId, 2, action.mapsLoser)
      const qualifiers = swiss.teams
        .filter(t => t.status === "qualified")
        .sort((a, b) => b.wins - a.wins || b.buchholz - a.buchholz || a.seed - b.seed)
        .map(t => t.id)
      const playoffs = qualifiers.length === 8
        ? populatePlayoffs(state.playoffs, qualifiers)
        : state.playoffs
      return { ...state, swiss, playoffs }
    }
    case "CLEAR_SW":
      return { ...state, swiss: clearResult(state.swiss, action.matchId), playoffs: createTournamentState() }
    case "SET_PO":
      return { ...state, playoffs: setTMatchResult(state.playoffs, action.matchId, action.winnerId, action.mapsLoser) }
    case "CLEAR_PO":
      return { ...state, playoffs: clearTMatch(state.playoffs, action.matchId) }

    case "SIMULATE_PI": {
      // Play all unresolved Play-In matches in dependency order
      const PI_ORDER = ["pi-u1a","pi-u1b","pi-u1c","pi-u1d","pi-u2a","pi-l1a","pi-u2b","pi-l1b","pi-l2a","pi-l2b"]
      let playin = state.playin
      for (const id of PI_ORDER) {
        const m = playin.matches[id]
        if (!m.winnerId && m.teamA && m.teamB) {
          const { w, ml } = rndWinner(m.teamA, m.teamB)
          playin = setTMatchResult(playin, id, w, ml)
        }
      }
      const newTeams = buildSwissTeams(playin.playinQualifiers)
      return { playin, swiss: createInitialState(newTeams), playoffs: createTournamentState() }
    }

    case "SIMULATE_SW": {
      // Play all rounds round-by-round; each setMatchResult generates the next round
      let swiss = state.swiss
      let guard = 0
      while (!isComplete(swiss) && guard++ < 200) {
        const rIdx = activeRoundIdx(swiss)
        const round = swiss.rounds[rIdx]
        if (!round) break
        let anyUnplayed = false
        for (const m of round) {
          if (!m.winnerId) {
            anyUnplayed = true
            const { w, ml } = rndWinner(m.teamAId, m.teamBId)
            swiss = setMatchResult(swiss, m.id, w, 2, ml)
          }
        }
        if (!anyUnplayed) break
      }
      const qualifiers = swiss.teams
        .filter(t => t.status === "qualified")
        .sort((a, b) => b.wins - a.wins || b.buchholz - a.buchholz || a.seed - b.seed)
        .map(t => t.id)
      const playoffs = qualifiers.length === 8
        ? populatePlayoffs(state.playoffs, qualifiers)
        : state.playoffs
      return { ...state, swiss, playoffs }
    }

    case "SIMULATE_PO": {
      const PO_ORDER = ["po-qf1","po-qf2","po-qf3","po-qf4","po-sf1","po-sf2","po-final"]
      let playoffs = state.playoffs
      for (const id of PO_ORDER) {
        const m = playoffs.matches[id]
        if (m && !m.winnerId && m.teamA && m.teamB) {
          const { w, ml } = rndWinner(m.teamA, m.teamB)
          playoffs = setTMatchResult(playoffs, id, w, ml)
        }
      }
      return { ...state, playoffs }
    }

    case "RESET":
      return createFullState()
    default:
      return state
  }
}

// ─── Shared team card type ────────────────────────────────────────────────────

interface CardTeam {
  id: string
  shortName: string
  color: string
  record?: string // "2-1" for Swiss W-L
}

function tTeamToCard(t: TTeam | null): CardTeam | null {
  if (!t) return null
  return { id: t.id, shortName: t.shortName, color: t.color }
}

function swissToCard(t: SwissTeamState | null): CardTeam | null {
  if (!t) return null
  return { id: t.id, shortName: t.shortName, color: t.color, record: `${t.wins}-${t.losses}` }
}

function getCard(id: string | null, extra: Record<string, TTeam>): CardTeam | null {
  if (!id) return null
  const t = ALL_TEAMS[id] ?? extra[id]
  return t ? { id: t.id, shortName: t.shortName, color: t.color } : null
}

// ─── Team badge ───────────────────────────────────────────────────────────────

function TeamBadge({ team, size = 24 }: { team: CardTeam | null; size?: number }) {
  if (!team) {
    return (
      <div
        className="rounded-lg flex-shrink-0"
        style={{ width: size, height: size, background: "rgba(255,255,255,0.03)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)" }}
      />
    )
  }
  const abbr = team.shortName.slice(0, 3)
  return (
    <div
      className="rounded-lg flex-shrink-0 flex items-center justify-center font-bold"
      style={{
        width: size,
        height: size,
        background: `${team.color}1a`,
        boxShadow: `inset 0 0 0 1px ${team.color}38`,
        color: team.color,
        fontSize: abbr.length >= 3 ? 7 : 9,
        letterSpacing: "0.04em",
      }}
    >
      {abbr}
    </div>
  )
}

// ─── Score +/− button ────────────────────────────────────────────────────────

function Sb({ onClick, disabled, sign }: { onClick: () => void; disabled?: boolean; sign: "+" | "−" }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="h-5 w-5 rounded flex items-center justify-center text-xs font-bold leading-none select-none bg-white/5 text-white/30 hover:bg-white/10 hover:text-white transition-all duration-100 disabled:opacity-10 disabled:pointer-events-none"
    >
      {sign}
    </button>
  )
}

// ─── Match Card — core component with +/− score interaction ──────────────────

function MatchCard({
  matchId,
  teamA,
  teamB,
  globalWinnerId,
  globalMapsA,
  globalMapsB,
  onScore,
  onClear,
  label,
  minWidth = 195,
}: {
  matchId: string
  teamA: CardTeam | null
  teamB: CardTeam | null
  globalWinnerId: string | null
  globalMapsA: number
  globalMapsB: number
  onScore: (winnerId: string, mapsLoser: 0 | 1) => void
  onClear: () => void
  label?: string
  minWidth?: number
}) {
  const [lA, setLA] = useState(0)
  const [lB, setLB] = useState(0)
  const skipSync = useRef(false)

  // Sync display from global state (when match resolves externally or resets)
  useEffect(() => {
    if (skipSync.current) { skipSync.current = false; return }
    setLA(globalWinnerId !== null ? globalMapsA : 0)
    setLB(globalWinnerId !== null ? globalMapsB : 0)
  }, [globalWinnerId, globalMapsA, globalMapsB, matchId])

  // Reset local scores when teams change (slot gets filled / bracket rebuilds)
  const prevAId = useRef(teamA?.id)
  const prevBId = useRef(teamB?.id)
  useEffect(() => {
    if (prevAId.current !== teamA?.id || prevBId.current !== teamB?.id) {
      prevAId.current = teamA?.id
      prevBId.current = teamB?.id
      setLA(0)
      setLB(0)
    }
  })

  const has = !!teamA && !!teamB
  const played = globalWinnerId !== null
  const aWins = played && globalWinnerId === teamA?.id
  const bWins = played && globalWinnerId === teamB?.id
  const dA = played ? globalMapsA : lA
  const dB = played ? globalMapsB : lB

  function plusA() {
    if (!has || played) return
    const n = lA + 1
    if (n >= 2) onScore(teamA.id, Math.min(lB, 1) as 0 | 1)
    else setLA(n)
  }
  function minusA() {
    if (!has) return
    if (aWins) { skipSync.current = true; const pb = globalMapsB; onClear(); setLA(1); setLB(pb) }
    else if (!played && lA > 0) setLA(lA - 1)
  }
  function plusB() {
    if (!has || played) return
    const n = lB + 1
    if (n >= 2) onScore(teamB.id, Math.min(lA, 1) as 0 | 1)
    else setLB(n)
  }
  function minusB() {
    if (!has) return
    if (bWins) { skipSync.current = true; const pa = globalMapsA; onClear(); setLB(1); setLA(pa) }
    else if (!played && lB > 0) setLB(lB - 1)
  }

  return (
    <div className="flex flex-col gap-1" style={{ minWidth }}>
      {label && (
        <div className="text-[8px] uppercase tracking-[0.18em] text-white/20 font-display text-center">{label}</div>
      )}
      <div
        className="rounded-xl overflow-hidden transition-all duration-200"
        style={{
          background: played
            ? "rgba(255,255,255,0.045)"
            : has
            ? "rgba(255,255,255,0.025)"
            : "rgba(255,255,255,0.01)",
          boxShadow: played
            ? "inset 0 0 0 1px rgba(255,255,255,0.11)"
            : has
            ? "inset 0 0 0 1px rgba(255,255,255,0.07)"
            : "inset 0 0 0 1px rgba(255,255,255,0.04)",
        }}
      >
        {/* Row A */}
        <div className={`flex items-center gap-2 px-2.5 py-[7px] transition-opacity duration-200 ${bWins ? "opacity-30" : ""}`}>
          <TeamBadge team={teamA} size={22} />
          <div className="flex-1 min-w-0">
            <span className={`text-[11px] font-display tracking-wide truncate block leading-tight ${aWins ? "text-white" : "text-white/60"}`}>
              {teamA ? teamA.shortName : <span className="text-white/15 italic text-[9px]">TBD</span>}
            </span>
            {teamA?.record && <span className="text-[8px] text-white/25 font-stats tabular-nums">{teamA.record}</span>}
          </div>
          {has && (
            <div className="flex items-center gap-1 shrink-0">
              <Sb onClick={minusA} disabled={!aWins && (played || lA === 0)} sign="−" />
              <span className={`w-4 text-center font-bold tabular-nums text-[13px] leading-none select-none ${aWins ? "text-white" : played ? "text-white/20" : "text-white/50"}`}>
                {dA}
              </span>
              <Sb onClick={plusA} disabled={played || lA >= 2 || lB >= 2} sign="+" />
            </div>
          )}
        </div>

        <div className="h-px bg-white/[0.055] mx-2" />

        {/* Row B */}
        <div className={`flex items-center gap-2 px-2.5 py-[7px] transition-opacity duration-200 ${aWins ? "opacity-30" : ""}`}>
          <TeamBadge team={teamB} size={22} />
          <div className="flex-1 min-w-0">
            <span className={`text-[11px] font-display tracking-wide truncate block leading-tight ${bWins ? "text-white" : "text-white/60"}`}>
              {teamB ? teamB.shortName : <span className="text-white/15 italic text-[9px]">TBD</span>}
            </span>
            {teamB?.record && <span className="text-[8px] text-white/25 font-stats tabular-nums">{teamB.record}</span>}
          </div>
          {has && (
            <div className="flex items-center gap-1 shrink-0">
              <Sb onClick={minusB} disabled={!bWins && (played || lB === 0)} sign="−" />
              <span className={`w-4 text-center font-bold tabular-nums text-[13px] leading-none select-none ${bWins ? "text-white" : played ? "text-white/20" : "text-white/50"}`}>
                {dB}
              </span>
              <Sb onClick={plusB} disabled={played || lB >= 2 || lA >= 2} sign="+" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Bracket connectors ───────────────────────────────────────────────────────

function Conn2({ h }: { h: number }) {
  // } shape connecting 2 left cards to 1 right card, given half-height h
  return (
    <div className="flex-shrink-0 w-4 self-stretch flex flex-col" style={{ minHeight: h * 2 }}>
      <div className="flex-1 border-r border-t border-white/10" style={{ borderTopRightRadius: 4 }} />
      <div className="flex-1 border-r border-b border-white/10" style={{ borderBottomRightRadius: 4 }} />
    </div>
  )
}

function HLine() {
  return <div className="flex-shrink-0 w-3 self-center h-px bg-white/10" />
}

// ─── Qualify slot ─────────────────────────────────────────────────────────────

function QSlot({ seed, teamId, extra }: { seed: number; teamId: string | null; extra: Record<string, TTeam> }) {
  const team = teamId ? (ALL_TEAMS[teamId] ?? extra[teamId]) : null
  return (
    <div
      className="flex items-center gap-2 rounded-xl px-3 py-2 min-w-[130px] transition-all duration-300"
      style={
        team
          ? { background: "rgba(0,212,184,0.07)", boxShadow: "inset 0 0 0 1px rgba(0,212,184,0.2)" }
          : { background: "rgba(255,255,255,0.01)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.04)" }
      }
    >
      <span className="text-[9px] font-display text-white/20 w-4 shrink-0">#{seed}</span>
      {team ? (
        <>
          <div
            className="h-5 w-5 rounded-md flex-shrink-0 flex items-center justify-center font-bold"
            style={{ background: `${team.color}1a`, boxShadow: `inset 0 0 0 1px ${team.color}35`, color: team.color, fontSize: 7 }}
          >
            {team.shortName.slice(0, 3)}
          </div>
          <span className="text-[11px] font-display text-slc-teal truncate">{team.shortName}</span>
        </>
      ) : (
        <span className="text-[10px] font-display text-white/15 italic">TBD</span>
      )}
    </div>
  )
}

// ─── Phase progress ───────────────────────────────────────────────────────────

function PhaseProgress({ phase, swiss, playin }: { phase: Phase; swiss: SwissState; playin: TournamentState }) {
  const piCount = Object.values(playin.playinQualifiers).filter(v => v !== null).length
  const piDone = piCount === 4
  const swissDone = isComplete(swiss)
  const qCount = qualifiedCount(swiss)

  return (
    <div className="flex items-center gap-2 text-[9px] font-display uppercase tracking-wider">
      <span className={piDone ? "text-slc-teal" : phase === "playin" ? "text-white/70" : "text-white/25"}>
        {piDone ? "✓" : "·"} Play-In ({piCount}/4)
      </span>
      <span className="text-white/15">›</span>
      <span className={swissDone ? "text-slc-teal" : phase === "swiss" ? "text-white/70" : "text-white/25"}>
        {swissDone ? "✓" : "·"} Swiss ({qCount}/8)
      </span>
      <span className="text-white/15">›</span>
      <span className={phase === "playoffs" ? "text-white/70" : "text-white/25"}>
        · Playoffs
      </span>
    </div>
  )
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="h-px flex-1 bg-white/6" />
      <span className="text-[9px] uppercase tracking-[0.2em] text-white/30 font-display">{children}</span>
      <div className="h-px flex-1 bg-white/6" />
    </div>
  )
}

// ─── Round column label ───────────────────────────────────────────────────────

function RoundLabel({ children, active }: { children: React.ReactNode; active?: boolean }) {
  return (
    <div className={`text-[9px] uppercase tracking-[0.18em] font-display text-center mb-2 ${active ? "text-slc-red" : "text-white/25"}`}>
      {children}
    </div>
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

  const card = (id: string) => {
    const match = m[id]
    return (
      <MatchCard
        key={id}
        matchId={id}
        teamA={getCard(match.teamA, et)}
        teamB={getCard(match.teamB, et)}
        globalWinnerId={match.winnerId}
        globalMapsA={match.mapsA}
        globalMapsB={match.mapsB}
        onScore={(w, ml) => onScore(id, w, ml)}
        onClear={() => onClear(id)}
      />
    )
  }

  return (
    <div className="overflow-x-auto pb-2">
      <div className="min-w-[820px] space-y-5">

        {/* ── Upper Bracket ── */}
        <div>
          <SectionLabel>Upper Bracket</SectionLabel>
          <div className="flex items-center gap-0">
            {/* R1 */}
            <div className="flex flex-col gap-3">
              <RoundLabel>Round 1</RoundLabel>
              <div className="flex flex-col gap-2">{card("pi-u1a")}{card("pi-u1b")}</div>
              <div className="mt-1" />
              <div className="flex flex-col gap-2">{card("pi-u1c")}{card("pi-u1d")}</div>
            </div>

            {/* Connectors R1→R2 */}
            <div className="flex flex-col gap-0 self-stretch pt-6">
              <div className="flex-1 flex flex-col justify-around">
                <Conn2 h={42} />
              </div>
              <div style={{ height: 20 }} />
              <div className="flex-1 flex flex-col justify-around">
                <Conn2 h={42} />
              </div>
            </div>

            {/* R2 + qualify */}
            <div className="flex flex-col gap-5 pt-6">
              <RoundLabel>Round 2</RoundLabel>
              <div className="flex items-center gap-0">
                {card("pi-u2a")}
                <HLine />
                <QSlot seed={13} teamId={m["pi-u2a"].winnerId} extra={et} />
              </div>
              <div style={{ height: 8 }} />
              <div className="flex items-center gap-0">
                {card("pi-u2b")}
                <HLine />
                <QSlot seed={14} teamId={m["pi-u2b"].winnerId} extra={et} />
              </div>
            </div>
          </div>
        </div>

        {/* ── Lower Bracket ── */}
        <div>
          <SectionLabel>Lower Bracket</SectionLabel>
          <div className="flex items-center gap-0">
            {/* LBR1 */}
            <div className="flex flex-col gap-3">
              <RoundLabel>Round 1</RoundLabel>
              {card("pi-l1a")}
              <div className="mt-1" />
              {card("pi-l1b")}
            </div>

            {/* Connectors LBR1→LBR2 */}
            <div className="flex flex-col self-stretch pt-6 gap-0">
              <div className="flex-1 flex flex-col justify-around">
                <Conn2 h={32} />
              </div>
              <div style={{ height: 20 }} />
              <div className="flex-1 flex flex-col justify-around">
                <Conn2 h={32} />
              </div>
            </div>

            {/* LBR2 + qualify */}
            <div className="flex flex-col gap-4 pt-6">
              <RoundLabel>Round 2</RoundLabel>
              <div className="flex items-center gap-0">
                {card("pi-l2a")}
                <HLine />
                <QSlot seed={15} teamId={m["pi-l2a"].winnerId} extra={et} />
              </div>
              <div style={{ height: 8 }} />
              <div className="flex items-center gap-0">
                {card("pi-l2b")}
                <HLine />
                <QSlot seed={16} teamId={m["pi-l2b"].winnerId} extra={et} />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

// ─── Swiss bracket ────────────────────────────────────────────────────────────

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

  const BRACKET_LABELS: Record<string, string> = {
    "0-0": "Opening", "1-0": "1-0", "0-1": "0-1",
    "2-0": "2-0", "1-1": "1-1", "0-2": "0-2",
    "2-1": "2-1", "1-2": "1-2", "2-2": "Match Point",
  }

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex gap-1 min-w-[720px]">
        {rounds.map((round, rIdx) => {
          const preTeams = teamsAtRoundStart(state, rIdx)
          const preById = Object.fromEntries(preTeams.map(t => [t.id, t]))
          const isActive = rIdx === activeRound && !complete
          const isPast = rIdx < activeRound || round.every(m => m.winnerId !== null)

          // Group by W-L bracket
          const groups = new Map<string, SimMatch[]>()
          for (const m of round) {
            const tA = preById[m.teamAId]
            const key = tA ? `${tA.wins}-${tA.losses}` : "?"
            if (!groups.has(key)) groups.set(key, [])
            groups.get(key)!.push(m)
          }

          return (
            <div key={rIdx} className="flex">
              <div
                className={`flex flex-col gap-4 px-3 py-3 rounded-xl min-w-[185px] transition-all duration-300 ${
                  isActive ? "bg-white/[0.025] ring-1 ring-slc-red/20" : ""
                }`}
              >
                <div className="text-center">
                  <div className={`text-[9px] uppercase tracking-[0.18em] font-display ${isActive ? "text-slc-red" : isPast ? "text-white/20" : "text-white/25"}`}>
                    Round {rIdx + 1}
                  </div>
                  <div className="text-[8px] text-white/20 font-display">
                    {round.length} match{round.length !== 1 ? "es" : ""}
                  </div>
                </div>

                {[...groups.entries()]
                  .sort(([a], [b]) => {
                    const [aw, al] = a.split("-").map(Number)
                    const [bw, bl] = b.split("-").map(Number)
                    return (bw - aw) || (al - bl)
                  })
                  .map(([key, matches]) => (
                    <div key={key} className="flex flex-col gap-2">
                      {groups.size > 1 && (
                        <div className="text-[7px] uppercase tracking-widest text-white/20 font-display text-center px-2 py-0.5 rounded-full"
                          style={{ background: "rgba(255,255,255,0.025)" }}>
                          {BRACKET_LABELS[key] ?? key}
                        </div>
                      )}
                      {matches.map(sm => {
                        const tA = state.teams.find(t => t.id === sm.teamAId) ?? null
                        const tB = state.teams.find(t => t.id === sm.teamBId) ?? null
                        return (
                          <MatchCard
                            key={sm.id}
                            matchId={sm.id}
                            teamA={swissToCard(tA)}
                            teamB={swissToCard(tB)}
                            globalWinnerId={sm.winnerId}
                            globalMapsA={sm.mapsA}
                            globalMapsB={sm.mapsB}
                            onScore={(w, ml) => onScore(sm.id, w, ml)}
                            onClear={() => onClear(sm.id)}
                            minWidth={170}
                          />
                        )
                      })}
                    </div>
                  ))}
              </div>

              {rIdx < rounds.length - 1 && (
                <div className="flex items-center px-1">
                  <div className="w-3 border-t border-dashed border-white/8" />
                </div>
              )}
            </div>
          )
        })}

        {/* Qualified / Eliminated summary */}
        {(qualifiedCount(state) > 0 || eliminatedCount(state) > 0) && (
          <div className="flex flex-col gap-1.5 px-4 py-3 justify-center min-w-[120px]">
            {qualifiedCount(state) > 0 && (
              <>
                <div className="text-[8px] uppercase tracking-widest text-slc-teal/60 font-display mb-1">Qualified</div>
                {state.teams
                  .filter(t => t.status === "qualified")
                  .sort((a, b) => b.wins - a.wins || b.buchholz - a.buchholz || a.seed - b.seed)
                  .map((t, i) => (
                    <div key={t.id} className="flex items-center gap-1.5 text-[10px] font-display">
                      <span className="text-white/20 w-4 tabular-nums">#{i + 1}</span>
                      <div
                        className="h-4 w-4 rounded flex items-center justify-center font-bold flex-shrink-0"
                        style={{ background: `${t.color}1a`, boxShadow: `inset 0 0 0 1px ${t.color}35`, color: t.color, fontSize: 6 }}
                      >
                        {t.shortName.slice(0, 3)}
                      </div>
                      <span className="text-white/70 truncate">{t.shortName}</span>
                      <span className="text-white/25 text-[8px] ml-auto tabular-nums">{t.wins}-{t.losses}</span>
                    </div>
                  ))}
              </>
            )}
            {eliminatedCount(state) > 0 && (
              <>
                <div className="text-[8px] uppercase tracking-widest text-slc-red/40 font-display mb-1 mt-2">Elim.</div>
                {state.teams
                  .filter(t => t.status === "eliminated")
                  .map(t => (
                    <div key={t.id} className="flex items-center gap-1.5 text-[10px] font-display opacity-40">
                      <span className="text-white/20 w-4">✕</span>
                      <span className="text-white/50 truncate">{t.shortName}</span>
                      <span className="text-white/20 text-[8px] ml-auto tabular-nums">{t.wins}-{t.losses}</span>
                    </div>
                  ))}
              </>
            )}
          </div>
        )}
      </div>
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
        <div
          className="h-12 w-12 rounded-2xl flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.03)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)" }}
        >
          <svg className="h-5 w-5 text-white/20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
            <path d="M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
            <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
          </svg>
        </div>
        <p className="text-text-muted text-sm font-display">Complete the Swiss Stage to unlock Playoffs</p>
        <div className="flex gap-2 flex-wrap justify-center mt-2">
          {Array(8).fill(null).map((_, i) => {
            const id = swissQualifiers[i]
            const team = id ? (ALL_TEAMS[id] ?? et[id]) : null
            return (
              <div
                key={i}
                className="px-2.5 py-1 rounded-lg text-[10px] font-display transition-all duration-200"
                style={
                  team
                    ? { background: "rgba(0,212,184,0.07)", boxShadow: "inset 0 0 0 1px rgba(0,212,184,0.2)", color: "#00D4B8" }
                    : { background: "rgba(255,255,255,0.02)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.2)" }
                }
              >
                {team ? team.shortName : `Seed ${i + 1}`}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const card = (id: string, label?: string) => {
    const match = m[id]
    return (
      <MatchCard
        key={id}
        matchId={id}
        teamA={getCard(match.teamA, et)}
        teamB={getCard(match.teamB, et)}
        globalWinnerId={match.winnerId}
        globalMapsA={match.mapsA}
        globalMapsB={match.mapsB}
        onScore={(w, ml) => onScore(id, w, ml)}
        onClear={() => onClear(id)}
        label={label}
      />
    )
  }

  const champion = m["po-final"]?.winnerId
    ? (ALL_TEAMS[m["po-final"].winnerId] ?? et[m["po-final"].winnerId])
    : null

  return (
    <div className="overflow-x-auto pb-2">
      <div className="min-w-[680px]">
        <div className="flex items-center gap-0">
          {/* Quarter Finals */}
          <div className="flex flex-col gap-5">
            <RoundLabel>Quarter Finals</RoundLabel>
            <div className="flex flex-col gap-2">
              {card("po-qf1", "1 vs 8")}
              {card("po-qf2", "4 vs 5")}
            </div>
            <div className="mt-1" />
            <div className="flex flex-col gap-2">
              {card("po-qf3", "2 vs 7")}
              {card("po-qf4", "3 vs 6")}
            </div>
          </div>

          {/* Connectors QF→SF */}
          <div className="flex flex-col self-stretch pt-6 gap-0">
            <div className="flex-1 flex flex-col justify-around">
              <Conn2 h={46} />
            </div>
            <div style={{ height: 28 }} />
            <div className="flex-1 flex flex-col justify-around">
              <Conn2 h={46} />
            </div>
          </div>

          {/* Semi Finals */}
          <div className="flex flex-col gap-10 pt-6">
            <RoundLabel>Semi Finals</RoundLabel>
            {card("po-sf1")}
            <div style={{ height: 4 }} />
            {card("po-sf2")}
          </div>

          {/* Connectors SF→Final */}
          <div className="self-stretch pt-6" style={{ minHeight: 220 }}>
            <Conn2 h={60} />
          </div>

          {/* Grand Final + champion */}
          <div className="flex flex-col items-center gap-3 pt-6">
            <RoundLabel>Grand Final</RoundLabel>
            {card("po-final")}
            {champion && (
              <div
                className="mt-1 flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-display font-bold"
                style={{
                  background: "linear-gradient(135deg, rgba(196,30,58,0.15), rgba(0,212,184,0.15))",
                  boxShadow: "inset 0 0 0 1px rgba(0,212,184,0.25)",
                  color: "#00D4B8",
                }}
              >
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
                </svg>
                {champion.shortName} — Champion
              </div>
            )}
          </div>
        </div>
      </div>
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

  const piCount = Object.values(state.playin.playinQualifiers).filter(v => v !== null).length

  return (
    <div className="space-y-5">
      {/* Header: phase tabs + progress + reset */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div
          className="flex gap-1 p-1 rounded-xl"
          style={{ background: "rgba(255,255,255,0.03)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.07)" }}
        >
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
                phase === p.id ? "bg-white/20 text-white" : "bg-white/5 text-white/30"
              }`}>
                {p.tag}
              </span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <PhaseProgress phase={phase} swiss={state.swiss} playin={state.playin} />

          {/* Quick Sim button */}
          <button
            onClick={() => {
              if (phase === "playin")   dispatch({ type: "SIMULATE_PI" })
              if (phase === "swiss")    dispatch({ type: "SIMULATE_SW" })
              if (phase === "playoffs") dispatch({ type: "SIMULATE_PO" })
            }}
            className="flex items-center gap-1.5 text-[9px] font-display uppercase tracking-widest px-2.5 py-1 rounded-lg transition-all duration-200 text-slc-teal/60 hover:text-slc-teal hover:bg-slc-teal/8"
            style={{ boxShadow: "inset 0 0 0 1px rgba(0,212,184,0.12)" }}
            title="Randomize all remaining matches in this phase"
          >
            <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>
            </svg>
            Quick sim
          </button>

          <button
            onClick={() => dispatch({ type: "RESET" })}
            className="text-[9px] font-display uppercase tracking-widest text-white/20 hover:text-slc-red/70 transition-colors px-2 py-1 rounded hover:bg-slc-red/5"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Phase container */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "rgba(255,255,255,0.018)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)" }}
      >
        {/* Score controls hint */}
        <div className="px-5 pt-4 pb-0 flex items-center gap-2">
          <div className="text-[9px] text-white/20 font-display">
            Click <span className="text-white/35 font-bold px-1 py-0.5 rounded bg-white/5">−</span> and <span className="text-white/35 font-bold px-1 py-0.5 rounded bg-white/5">+</span> to set map scores · reaching 2 resolves the match · <span className="text-white/35">−</span> on a winner's score (2) to undo
          </div>
        </div>

        <div className="p-4 sm:p-5">
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

      {/* Auto-advance banners */}
      {phase === "playin" && piCount > 0 && piCount < 4 && (
        <div
          className="rounded-xl px-4 py-3 flex items-center gap-3"
          style={{ background: "rgba(196,30,58,0.05)", boxShadow: "inset 0 0 0 1px rgba(196,30,58,0.12)" }}
        >
          <svg className="h-3.5 w-3.5 text-slc-red/60 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
          <p className="text-[10px] text-text-muted font-display">
            Play-In qualifiers auto-fill Swiss seeds 13–16.{" "}
            <button onClick={() => setPhase("swiss")} className="text-slc-teal/80 underline hover:text-slc-teal transition-colors">
              Go to Swiss
            </button>
          </p>
        </div>
      )}
      {phase === "playin" && piCount === 4 && (
        <div
          className="rounded-xl px-4 py-3 flex items-center gap-3"
          style={{ background: "rgba(0,212,184,0.05)", boxShadow: "inset 0 0 0 1px rgba(0,212,184,0.15)" }}
        >
          <svg className="h-3.5 w-3.5 text-slc-teal shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M20 6 9 17l-5-5" />
          </svg>
          <p className="text-[10px] text-text-muted font-display">
            All 4 Play-In slots filled → Swiss bracket ready.{" "}
            <button onClick={() => setPhase("swiss")} className="text-slc-teal underline hover:text-slc-teal/80 transition-colors">
              Go to Swiss →
            </button>
          </p>
        </div>
      )}
      {swissComplete && phase === "swiss" && (
        <div
          className="rounded-xl px-4 py-3 flex items-center gap-3"
          style={{ background: "rgba(0,212,184,0.05)", boxShadow: "inset 0 0 0 1px rgba(0,212,184,0.2)" }}
        >
          <svg className="h-3.5 w-3.5 text-slc-teal shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M20 6 9 17l-5-5" />
          </svg>
          <p className="text-[10px] text-text-muted font-display">
            Swiss complete — top 8 seeded into Playoffs.{" "}
            <button onClick={() => setPhase("playoffs")} className="text-slc-teal underline hover:text-slc-teal/80 transition-colors">
              View Playoffs →
            </button>
          </p>
        </div>
      )}
    </div>
  )
}
