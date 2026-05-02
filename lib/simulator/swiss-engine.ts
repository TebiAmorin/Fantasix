// ─── Swiss Stage Engine ──────────────────────────────────────────────────────
// Implements the R6 Siege Swiss Stage format used at BLAST Majors.
//
// Seeding rules (from BLAST official format):
//   Round 1–2 : Dutch seeding (top 8 vs bottom 8, then fold by seed within bracket)
//   Round 3–5 : Buchholz seeding (best vs worst in same W–L bracket, no rematches)
//
// Buchholz formula: Σ (opp.wins − opp.losses) for every past opponent
// ─────────────────────────────────────────────────────────────────────────────

export interface SwissTeam {
  id: string
  name: string
  shortName: string
  seed: number
  /** Approximate brand colour for avatar placeholder */
  color: string
}

export interface SwissTeamState extends SwissTeam {
  wins: number
  losses: number
  buchholz: number
  /** Ids of opponents already faced (used for anti-rematch logic) */
  facedOpponents: string[]
  status: "active" | "qualified" | "eliminated"
}

export interface SimMatch {
  id: string
  round: number
  teamAId: string
  teamBId: string
  /** null = unplayed */
  winnerId: string | null
  /** Maps won by A — 2 if winner, 0 or 1 if loser */
  mapsA: number
  /** Maps won by B */
  mapsB: number
}

export interface SwissState {
  teams: SwissTeamState[]
  /** rounds[0] = round 1, rounds[4] = round 5 */
  rounds: SimMatch[][]
}

// ─── Default team roster ─────────────────────────────────────────────────────

export const BLAST_SLC_TEAMS: SwissTeam[] = [
  { id: "g2",      name: "G2 Esports",         shortName: "G2",      seed: 1,  color: "#00529B" },
  { id: "fur",     name: "FURIA",               shortName: "FUR",     seed: 2,  color: "#E8FF00" },
  { id: "faze",    name: "FaZe Clan",           shortName: "FaZe",    seed: 3,  color: "#C41E3A" },
  { id: "nip",     name: "Ninjas in Pyjamas",   shortName: "NiP",     seed: 4,  color: "#F4D03F" },
  { id: "dz",      name: "DarkZero",            shortName: "DZ",      seed: 5,  color: "#8B5CF6" },
  { id: "vp",      name: "Virtus.pro",          shortName: "VP",      seed: 6,  color: "#FF6B35" },
  { id: "tm",      name: "Twisted Minds",       shortName: "TM",      seed: 7,  color: "#EC4899" },
  { id: "5f",      name: "Five Fears",          shortName: "5F",      seed: 8,  color: "#10B981" },
  { id: "wg",      name: "Weibo Gaming",        shortName: "WG",      seed: 9,  color: "#EF4444" },
  { id: "ag",      name: "All Gamers",          shortName: "AG",      seed: 10, color: "#3B82F6" },
  { id: "cag",     name: "CAG OSAKA",           shortName: "CAG",     seed: 11, color: "#06B6D4" },
  { id: "wc",      name: "Wildcard Gaming",     shortName: "WC",      seed: 12, color: "#14B8A6" },
  { id: "los",     name: "LOS",                 shortName: "LOS",     seed: 13, color: "#A78BFA" },
  { id: "falcons", name: "Team Falcons",        shortName: "Falcons", seed: 14, color: "#22C55E" },
  { id: "sr",      name: "Shopify Rebellion",   shortName: "SR",      seed: 15, color: "#84CC16" },
  { id: "ee",      name: "ENTERPRISE Esports",  shortName: "EE",      seed: 16, color: "#F59E0B" },
]

// ─── Initialise state ─────────────────────────────────────────────────────────

export function createInitialState(teams: SwissTeam[] = BLAST_SLC_TEAMS): SwissState {
  const teamStates: SwissTeamState[] = teams.map(t => ({
    ...t,
    wins: 0,
    losses: 0,
    buchholz: 0,
    facedOpponents: [],
    status: "active",
  }))

  const round1 = generateRound1(teamStates)

  return {
    teams: teamStates,
    rounds: [round1],
  }
}

// ─── Round generation ─────────────────────────────────────────────────────────

/** Round 1: Dutch seeding — seed 1 vs 9, 2 vs 10, …, 8 vs 16 */
function generateRound1(teams: SwissTeamState[]): SimMatch[] {
  const sorted = [...teams].sort((a, b) => a.seed - b.seed)
  const top8   = sorted.slice(0, 8)
  const bot8   = sorted.slice(8, 16)
  return top8.map((t, i) => makeMatch(1, t.id, bot8[i].id))
}

/**
 * Round 2: Dutch seeding within each bracket.
 * Sort active teams in each bracket (1-0 and 0-1) by seed, then fold-pair.
 */
function generateRound2(teams: SwissTeamState[]): SimMatch[] {
  return [
    ...foldPairBySeed(teams.filter(t => t.wins === 1 && t.losses === 0), 2),
    ...foldPairBySeed(teams.filter(t => t.wins === 0 && t.losses === 1), 2),
  ]
}

/**
 * Rounds 3–5: Buchholz seeding within same W–L bracket.
 * Pair highest Buchholz vs lowest, avoiding rematches.
 */
function generateBuchholzRound(roundNum: number, teams: SwissTeamState[]): SimMatch[] {
  const activeBrackets = getActiveBrackets(teams)
  const matches: SimMatch[] = []

  for (const [wins, losses] of activeBrackets) {
    const inBracket = teams.filter(
      t => t.wins === wins && t.losses === losses && t.status === "active"
    )
    if (inBracket.length < 2) continue

    // Sort: highest Buchholz first, then seed ascending as tiebreaker
    const sorted = [...inBracket].sort((a, b) =>
      b.buchholz !== a.buchholz ? b.buchholz - a.buchholz : a.seed - b.seed
    )

    const paired = avoidRematchPairing(sorted)
    matches.push(...paired.map(([a, b]) => makeMatch(roundNum, a.id, b.id)))
  }

  return matches
}

/** All distinct (wins, losses) combos for active teams */
function getActiveBrackets(teams: SwissTeamState[]): [number, number][] {
  const seen = new Set<string>()
  const result: [number, number][] = []
  for (const t of teams) {
    if (t.status !== "active") continue
    const key = `${t.wins}-${t.losses}`
    if (!seen.has(key)) {
      seen.add(key)
      result.push([t.wins, t.losses])
    }
  }
  return result
}

/** Fold-pair sorted teams: [0 vs n/2, 1 vs n/2+1, …] */
function foldPairBySeed(teams: SwissTeamState[], roundNum: number): SimMatch[] {
  const sorted = [...teams].sort((a, b) => a.seed - b.seed)
  const half   = Math.floor(sorted.length / 2)
  return Array.from({ length: half }, (_, i) =>
    makeMatch(roundNum, sorted[i].id, sorted[i + half].id)
  )
}

/**
 * Buchholz fold pairing with anti-rematch: pair highest with lowest,
 * swap adjacent if rematch detected.
 */
function avoidRematchPairing(sorted: SwissTeamState[]): [SwissTeamState, SwissTeamState][] {
  const n    = sorted.length
  const used = new Set<string>()
  const out: [SwissTeamState, SwissTeamState][] = []

  for (let i = 0; i < n; i++) {
    if (used.has(sorted[i].id)) continue

    // Try from the far end, walk inward until no-rematch found
    let partnered = false
    for (let j = n - 1; j > i; j--) {
      if (used.has(sorted[j].id)) continue
      if (!sorted[i].facedOpponents.includes(sorted[j].id)) {
        out.push([sorted[i], sorted[j]])
        used.add(sorted[i].id)
        used.add(sorted[j].id)
        partnered = true
        break
      }
    }

    // Fallback: allow rematch (no other option)
    if (!partnered) {
      for (let j = n - 1; j > i; j--) {
        if (used.has(sorted[j].id)) continue
        out.push([sorted[i], sorted[j]])
        used.add(sorted[i].id)
        used.add(sorted[j].id)
        break
      }
    }
  }

  return out
}

// ─── State mutations (pure functions) ────────────────────────────────────────

export function setMatchResult(
  state: SwissState,
  matchId: string,
  winnerId: string,
  mapsWinner: 2,
  mapsLoser: 0 | 1
): SwissState {
  const roundIdx = state.rounds.findIndex(r => r.some(m => m.id === matchId))
  if (roundIdx === -1) return state

  // Was this match already decided? If so, changing it invalidates future rounds.
  const prevResult = state.rounds[roundIdx].find(m => m.id === matchId)?.winnerId
  const resultChanged = prevResult !== null && prevResult !== winnerId

  const updatedRounds = state.rounds.map((r, ri) => {
    if (ri !== roundIdx) return r
    return r.map(m => {
      if (m.id !== matchId) return m
      const aWins = m.teamAId === winnerId
      return {
        ...m,
        winnerId,
        mapsA: aWins ? mapsWinner : mapsLoser,
        mapsB: aWins ? mapsLoser  : mapsWinner,
      }
    })
  })

  // Truncate future rounds if we're changing an already-decided result
  const rounds = resultChanged ? updatedRounds.slice(0, roundIdx + 1) : updatedRounds

  // Recompute team records from scratch based on all set matches
  const teams = recomputeTeams(state.teams, rounds.flat())

  // If round just completed → generate next round (if not already generated)
  const completedRound = rounds[roundIdx]
  const roundComplete  = completedRound.every(m => m.winnerId !== null)
  const nextRoundIdx   = roundIdx + 1

  if (roundComplete && nextRoundIdx < 5 && rounds.length <= nextRoundIdx) {
    const nextRound = nextRoundIdx === 1
      ? generateRound2(teams)
      : generateBuchholzRound(nextRoundIdx + 1, teams)

    if (nextRound.length > 0) {
      return { teams, rounds: [...rounds, nextRound] }
    }
  }

  return { teams, rounds }
}

/** Recompute all team stats from match history */
function recomputeTeams(base: SwissTeamState[], allMatches: SimMatch[]): SwissTeamState[] {
  // Reset dynamic fields
  const teams: SwissTeamState[] = base.map(t => ({
    ...t,
    wins: 0,
    losses: 0,
    buchholz: 0,
    facedOpponents: [],
    status: "active" as const,
  }))

  const byId = Object.fromEntries(teams.map(t => [t.id, t]))

  // Pass 1: build W/L records and faced-opponent lists
  for (const m of allMatches) {
    if (!m.winnerId) continue
    const loserId = m.teamAId === m.winnerId ? m.teamBId : m.teamAId
    byId[m.winnerId].wins   += 1
    byId[loserId].losses    += 1
    byId[m.winnerId].facedOpponents.push(loserId)
    byId[loserId].facedOpponents.push(m.winnerId)
  }

  // Pass 2: set qualified / eliminated
  for (const t of teams) {
    if (t.wins   >= 3) t.status = "qualified"
    if (t.losses >= 3) t.status = "eliminated"
  }

  // Pass 3: Buchholz = Σ (opp.wins − opp.losses)
  for (const t of teams) {
    t.buchholz = t.facedOpponents.reduce(
      (sum, oppId) => sum + byId[oppId].wins - byId[oppId].losses,
      0
    )
  }

  return teams
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeMatch(round: number, teamAId: string, teamBId: string): SimMatch {
  // Deterministic ID: avoids hydration mismatches with React's server/client rendering
  return { id: `r${round}-${teamAId}-${teamBId}`, round, teamAId, teamBId, winnerId: null, mapsA: 0, mapsB: 0 }
}

export function clearResult(state: SwissState, matchId: string): SwissState {
  const roundIdx = state.rounds.findIndex(r => r.some(m => m.id === matchId))
  if (roundIdx === -1) return state

  const rounds = state.rounds.map((r, ri) => {
    if (ri !== roundIdx) return r
    return r.map(m =>
      m.id !== matchId ? m : { ...m, winnerId: null, mapsA: 0, mapsB: 0 }
    )
  })

  // Truncate any generated future rounds if we're un-completing this round
  const truncated = rounds.slice(0, roundIdx + 1)
  const teams = recomputeTeams(state.teams, truncated.flat())
  return { teams, rounds: truncated }
}

/**
 * Returns a snapshot of team states as they were at the START of a given round
 * (i.e., after all rounds before it have fully resolved).
 */
export function teamsAtRoundStart(state: SwissState, roundIdx: number): SwissTeamState[] {
  const completedMatches = state.rounds
    .slice(0, roundIdx)
    .flat()
    .filter(m => m.winnerId !== null)
  return recomputeTeams(state.teams, completedMatches)
}

/** How many of the 8 qualifier spots are filled */
export function qualifiedCount(state: SwissState): number {
  return state.teams.filter(t => t.status === "qualified").length
}

export function eliminatedCount(state: SwissState): number {
  return state.teams.filter(t => t.status === "eliminated").length
}

/** Which round is currently active (has unplayed matches) */
export function activeRoundIdx(state: SwissState): number {
  for (let i = 0; i < state.rounds.length; i++) {
    if (state.rounds[i].some(m => m.winnerId === null)) return i
  }
  return state.rounds.length - 1
}

/** Is the entire simulation finished? */
export function isComplete(state: SwissState): boolean {
  return state.teams.every(t => t.status !== "active")
}
