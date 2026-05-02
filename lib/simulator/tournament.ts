// ─── Full Tournament State: Play-In → Swiss → Playoffs ───────────────────────
// BLAST R6 Major SLC 2026
// ─────────────────────────────────────────────────────────────────────────────

export interface TTeam {
  id: string
  name: string
  shortName: string
  color: string
}

// ─── Teams ───────────────────────────────────────────────────────────────────

export const PLAYIN_TEAMS: TTeam[] = [
  { id: 'los',    name: 'LOS',               shortName: 'LOS',    color: '#A78BFA' },
  { id: 'wolves', name: 'Wolves Esports',     shortName: 'Wolves', color: '#60A5FA' },
  { id: 'enet',   name: 'ENTERPRISE Esports', shortName: 'ENET',   color: '#F59E0B' },
  { id: 'edw',    name: 'EDward Gaming',      shortName: 'EDw',    color: '#34D399' },
  { id: 'falc',   name: 'Team Falcons',       shortName: 'Falcons',color: '#22C55E' },
  { id: 'day',    name: 'Daystar',            shortName: 'Day',    color: '#EC4899' },
  { id: 'shop',   name: 'Shopify Rebellion',  shortName: 'SR',     color: '#84CC16' },
  { id: 'fam',    name: 'Four Angry Men',     shortName: 'FAM',    color: '#FB923C' },
]

export const SWISS_DIRECT_TEAMS: TTeam[] = [
  { id: 'g2',   name: 'G2 Esports',        shortName: 'G2',    color: '#00529B' },
  { id: 'fur',  name: 'FURIA',              shortName: 'FUR',   color: '#D4FF00' },
  { id: 'faze', name: 'FaZe Clan',          shortName: 'FaZe',  color: '#C41E3A' },
  { id: 'nip',  name: 'Ninjas in Pyjamas',  shortName: 'NiP',   color: '#F4D03F' },
  { id: 'dz',   name: 'DarkZero',           shortName: 'DZ',    color: '#8B5CF6' },
  { id: 'vp',   name: 'Virtus.pro',         shortName: 'VP',    color: '#FF6B35' },
  { id: 'tm',   name: 'Twisted Minds',      shortName: 'TM',    color: '#EC4899' },
  { id: '5f',   name: 'Five Fears',         shortName: '5F',    color: '#10B981' },
  { id: 'wg',   name: 'Weibo Gaming',       shortName: 'WG',    color: '#EF4444' },
  { id: 'ag',   name: 'All Gamers',         shortName: 'AG',    color: '#3B82F6' },
  { id: 'cag',  name: 'CAG OSAKA',          shortName: 'CAG',   color: '#06B6D4' },
  { id: 'wc',   name: 'Wildcard Gaming',    shortName: 'WC',    color: '#14B8A6' },
]

export const ALL_TEAMS: Record<string, TTeam> = Object.fromEntries(
  [...PLAYIN_TEAMS, ...SWISS_DIRECT_TEAMS].map(t => [t.id, t])
)

// ─── Match state ─────────────────────────────────────────────────────────────

export interface TMatch {
  id: string
  teamA: string | null   // teamId or null (TBD)
  teamB: string | null
  winnerId: string | null
  mapsA: number
  mapsB: number
}

// ─── Play-In bracket definition ───────────────────────────────────────────────
//
// Double elimination: 8 teams → 4 qualify to Swiss
//
// UBR1:   [LOS vs Wolves]   [ENET vs EDward]   [Falcons vs Daystar]   [Shop vs FAM]
// UBR2:   [W(UBR1-1) vs W(UBR1-2)]   [W(UBR1-3) vs W(UBR1-4)]
// LBR1:   [L(UBR1-1) vs L(UBR1-2)]   [L(UBR1-3) vs L(UBR1-4)]
// LBR2:   [L(UBR2-1) vs W(LBR1-1)]   [L(UBR2-2) vs W(LBR1-2)]
// Qualified: W(UBR2-1), W(UBR2-2), W(LBR2-1), W(LBR2-2)

export type SlotSource =
  | { kind: 'team'; teamId: string }
  | { kind: 'winner'; matchId: string }
  | { kind: 'loser';  matchId: string }

export interface MatchDef {
  id: string
  slotA: SlotSource
  slotB: SlotSource
  /** Winner advances to this match's slot */
  winnerTo?: { matchId: string; slot: 'A' | 'B' }
  /** Loser drops to this match's slot (double elim) */
  loserTo?: { matchId: string; slot: 'A' | 'B' }
  /** If winner directly qualifies to next phase */
  qualifies?: boolean
  /** Which Swiss seed (13-16) this qualifier becomes */
  swissSeed?: number
}

export const PLAYIN_MATCH_DEFS: MatchDef[] = [
  // ── Upper Round 1
  { id: 'pi-u1a', slotA: { kind: 'team', teamId: 'los'  }, slotB: { kind: 'team', teamId: 'wolves' },
    winnerTo: { matchId: 'pi-u2a', slot: 'A' }, loserTo: { matchId: 'pi-l1a', slot: 'A' } },
  { id: 'pi-u1b', slotA: { kind: 'team', teamId: 'enet' }, slotB: { kind: 'team', teamId: 'edw'   },
    winnerTo: { matchId: 'pi-u2a', slot: 'B' }, loserTo: { matchId: 'pi-l1a', slot: 'B' } },
  { id: 'pi-u1c', slotA: { kind: 'team', teamId: 'falc' }, slotB: { kind: 'team', teamId: 'day'   },
    winnerTo: { matchId: 'pi-u2b', slot: 'A' }, loserTo: { matchId: 'pi-l1b', slot: 'A' } },
  { id: 'pi-u1d', slotA: { kind: 'team', teamId: 'shop' }, slotB: { kind: 'team', teamId: 'fam'   },
    winnerTo: { matchId: 'pi-u2b', slot: 'B' }, loserTo: { matchId: 'pi-l1b', slot: 'B' } },

  // ── Upper Round 2
  { id: 'pi-u2a', slotA: { kind: 'winner', matchId: 'pi-u1a' }, slotB: { kind: 'winner', matchId: 'pi-u1b' },
    winnerTo: undefined, loserTo: { matchId: 'pi-l2a', slot: 'A' }, qualifies: true, swissSeed: 13 },
  { id: 'pi-u2b', slotA: { kind: 'winner', matchId: 'pi-u1c' }, slotB: { kind: 'winner', matchId: 'pi-u1d' },
    winnerTo: undefined, loserTo: { matchId: 'pi-l2b', slot: 'A' }, qualifies: true, swissSeed: 14 },

  // ── Lower Round 1
  { id: 'pi-l1a', slotA: { kind: 'loser', matchId: 'pi-u1a' }, slotB: { kind: 'loser', matchId: 'pi-u1b' },
    winnerTo: { matchId: 'pi-l2a', slot: 'B' } },
  { id: 'pi-l1b', slotA: { kind: 'loser', matchId: 'pi-u1c' }, slotB: { kind: 'loser', matchId: 'pi-u1d' },
    winnerTo: { matchId: 'pi-l2b', slot: 'B' } },

  // ── Lower Round 2
  { id: 'pi-l2a', slotA: { kind: 'loser',  matchId: 'pi-u2a' }, slotB: { kind: 'winner', matchId: 'pi-l1a' },
    qualifies: true, swissSeed: 15 },
  { id: 'pi-l2b', slotA: { kind: 'loser',  matchId: 'pi-u2b' }, slotB: { kind: 'winner', matchId: 'pi-l1b' },
    qualifies: true, swissSeed: 16 },
]

// ─── Playoffs bracket definition ──────────────────────────────────────────────
//
// Single elimination: 8 Swiss qualifiers → 1 Champion
// Seeds from Swiss: 1=best record, 8=worst
// Pairings: 1v8, 4v5 | 2v7, 3v6
//
// QF1 ──┐               ┌── SF1 ──┐
// QF2 ──┘               │        ├─ FINAL → Champion
// QF3 ──┐               └── SF2 ──┘
// QF4 ──┘

export const PLAYOFF_MATCH_DEFS: MatchDef[] = [
  // Quarter Finals
  { id: 'po-qf1', slotA: { kind: 'team', teamId: 'po-seed1' }, slotB: { kind: 'team', teamId: 'po-seed8' },
    winnerTo: { matchId: 'po-sf1', slot: 'A' } },
  { id: 'po-qf2', slotA: { kind: 'team', teamId: 'po-seed4' }, slotB: { kind: 'team', teamId: 'po-seed5' },
    winnerTo: { matchId: 'po-sf1', slot: 'B' } },
  { id: 'po-qf3', slotA: { kind: 'team', teamId: 'po-seed2' }, slotB: { kind: 'team', teamId: 'po-seed7' },
    winnerTo: { matchId: 'po-sf2', slot: 'A' } },
  { id: 'po-qf4', slotA: { kind: 'team', teamId: 'po-seed3' }, slotB: { kind: 'team', teamId: 'po-seed6' },
    winnerTo: { matchId: 'po-sf2', slot: 'B' } },

  // Semi Finals
  { id: 'po-sf1', slotA: { kind: 'winner', matchId: 'po-qf1' }, slotB: { kind: 'winner', matchId: 'po-qf2' },
    winnerTo: { matchId: 'po-final', slot: 'A' } },
  { id: 'po-sf2', slotA: { kind: 'winner', matchId: 'po-qf3' }, slotB: { kind: 'winner', matchId: 'po-qf4' },
    winnerTo: { matchId: 'po-final', slot: 'B' } },

  // Grand Final
  { id: 'po-final', slotA: { kind: 'winner', matchId: 'po-sf1' }, slotB: { kind: 'winner', matchId: 'po-sf2' },
    qualifies: true },
]

// ─── State types ─────────────────────────────────────────────────────────────

export interface TournamentState {
  /** All matches keyed by ID */
  matches: Record<string, TMatch>
  /** Extra teams not in PLAYIN_TEAMS / SWISS_DIRECT_TEAMS (playoff seeds mapped) */
  extraTeams: Record<string, TTeam>
  /** Swiss qualifiers in order (1–8) — populated as Swiss completes */
  swissQualifiers: (string | null)[]  // 8 slots
  /** Play-In qualifiers (Swiss seeds 13–16) */
  playinQualifiers: Record<number, string | null>  // seed → teamId
}

// ─── Initialise state ─────────────────────────────────────────────────────────

function initMatch(def: MatchDef, matches: Record<string, TMatch>): TMatch {
  const resolve = (src: SlotSource): string | null => {
    if (src.kind === 'team') {
      // Playoff seed placeholders won't be in ALL_TEAMS — that's OK
      return src.teamId.startsWith('po-seed') ? null : src.teamId
    }
    return null  // winner/loser determined later
  }
  return {
    id: def.id,
    teamA: resolve(def.slotA),
    teamB: resolve(def.slotB),
    winnerId: null,
    mapsA: 0,
    mapsB: 0,
  }
}

export function createTournamentState(): TournamentState {
  const matches: Record<string, TMatch> = {}

  for (const def of [...PLAYIN_MATCH_DEFS, ...PLAYOFF_MATCH_DEFS]) {
    matches[def.id] = initMatch(def, matches)
  }

  return {
    matches,
    extraTeams: {},
    swissQualifiers: Array(8).fill(null),
    playinQualifiers: { 13: null, 14: null, 15: null, 16: null },
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getTeam(id: string | null, extraTeams: Record<string, TTeam>): TTeam | null {
  if (!id) return null
  return ALL_TEAMS[id] ?? extraTeams[id] ?? null
}

function getAllDefs(): Record<string, MatchDef> {
  return Object.fromEntries([...PLAYIN_MATCH_DEFS, ...PLAYOFF_MATCH_DEFS].map(d => [d.id, d]))
}

// ─── Set match result ─────────────────────────────────────────────────────────

export function setTMatchResult(
  state: TournamentState,
  matchId: string,
  winnerId: string,
  mapsLoser: 0 | 1,
): TournamentState {
  const match = state.matches[matchId]
  if (!match) return state

  const loserId  = match.teamA === winnerId ? match.teamB! : match.teamA!
  const aWins    = match.teamA === winnerId
  const newMatch = { ...match, winnerId, mapsA: aWins ? 2 : mapsLoser, mapsB: aWins ? mapsLoser : 2 }

  let matches     = { ...state.matches, [matchId]: newMatch }
  let extraTeams  = { ...state.extraTeams }
  let playinQuals = { ...state.playinQualifiers }

  const defs = getAllDefs()
  const def  = defs[matchId]
  if (!def) return state

  // Propagate winner → next match slot A/B
  if (def.winnerTo) {
    const { matchId: nextId, slot } = def.winnerTo
    const next = matches[nextId]
    if (next) {
      matches = {
        ...matches,
        [nextId]: slot === 'A'
          ? { ...next, teamA: winnerId }
          : { ...next, teamB: winnerId },
      }
    }
  }

  // Propagate loser → lower bracket match (double elim)
  if (def.loserTo) {
    const { matchId: nextId, slot } = def.loserTo
    const next = matches[nextId]
    if (next) {
      matches = {
        ...matches,
        [nextId]: slot === 'A'
          ? { ...next, teamA: loserId }
          : { ...next, teamB: loserId },
      }
    }
  }

  // Record Play-In qualifier
  if (def.qualifies && def.swissSeed) {
    playinQuals = { ...playinQuals, [def.swissSeed]: winnerId }
  }

  return { ...state, matches, extraTeams, playinQualifiers: playinQuals }
}

export function clearTMatch(state: TournamentState, matchId: string): TournamentState {
  const match = state.matches[matchId]
  if (!match || !match.winnerId) return state

  const prevWinnerId = match.winnerId
  const prevLoserId  = match.teamA === prevWinnerId ? match.teamB : match.teamA
  const cleared      = { ...match, winnerId: null, mapsA: 0, mapsB: 0 }
  let matches        = { ...state.matches, [matchId]: cleared }
  let playinQuals    = { ...state.playinQualifiers }

  const defs = getAllDefs()
  const def  = defs[matchId]
  if (!def) return state

  // Remove winner from next match
  if (def.winnerTo) {
    const { matchId: nextId, slot } = def.winnerTo
    const next = matches[nextId]
    if (next) {
      // Also clear downstream if next match was played
      if (next.winnerId) {
        const st2 = clearTMatch({ ...state, matches }, nextId)
        matches = st2.matches
        playinQuals = st2.playinQualifiers
      }
      const nextMatch = matches[nextId]
      matches = {
        ...matches,
        [nextId]: slot === 'A'
          ? { ...nextMatch, teamA: null, winnerId: null }
          : { ...nextMatch, teamB: null, winnerId: null },
      }
    }
  }

  // Remove loser from lower bracket match
  if (def.loserTo) {
    const { matchId: nextId, slot } = def.loserTo
    const next = matches[nextId]
    if (next) {
      if (next.winnerId) {
        const st2 = clearTMatch({ ...state, matches }, nextId)
        matches = st2.matches
        playinQuals = st2.playinQualifiers
      }
      const nextMatch = matches[nextId]
      matches = {
        ...matches,
        [nextId]: slot === 'A'
          ? { ...nextMatch, teamA: null, winnerId: null }
          : { ...nextMatch, teamB: null, winnerId: null },
      }
    }
  }

  // Remove Play-In qualifier
  if (def.qualifies && def.swissSeed) {
    playinQuals = { ...playinQuals, [def.swissSeed]: null }
  }

  return { ...state, matches, playinQualifiers: playinQuals }
}

// ─── Playoff seeding helpers ──────────────────────────────────────────────────

/** Populate playoff bracket slots from 8 Swiss qualifiers */
export function populatePlayoffs(
  state: TournamentState,
  qualifiers: (string | null)[],  // index 0 = seed 1 (best), index 7 = seed 8
): TournamentState {
  // Standard seeding: QF1=1v8, QF2=4v5, QF3=2v7, QF4=3v6
  const seedMap: Record<string, string | null> = {
    'po-seed1': qualifiers[0], 'po-seed2': qualifiers[1],
    'po-seed3': qualifiers[2], 'po-seed4': qualifiers[3],
    'po-seed5': qualifiers[4], 'po-seed6': qualifiers[5],
    'po-seed7': qualifiers[6], 'po-seed8': qualifiers[7],
  }

  // Build extra teams from Swiss qualifiers that aren't in the main team list
  const extraTeams = { ...state.extraTeams }
  qualifiers.forEach((id, i) => {
    if (id && !ALL_TEAMS[id]) {
      extraTeams[id] = { id, name: `Seed ${i + 1}`, shortName: `S${i + 1}`, color: '#6B7280' }
    }
  })

  // Update playoff matches with actual team IDs
  const matches = { ...state.matches }
  for (const def of PLAYOFF_MATCH_DEFS) {
    const m = { ...matches[def.id] }
    if (def.slotA.kind === 'team' && def.slotA.teamId in seedMap) {
      m.teamA = seedMap[def.slotA.teamId] ?? null
    }
    if (def.slotB.kind === 'team' && def.slotB.teamId in seedMap) {
      m.teamB = seedMap[def.slotB.teamId] ?? null
    }
    matches[def.id] = m
  }

  return { ...state, matches, extraTeams, swissQualifiers: qualifiers }
}
