/**
 * PandaScore Sync Route — /api/sync/pandascore
 *
 * Fetches live + upcoming + recent matches from PandaScore for the active R6 Siege tournament,
 * upserts into `matches`, and logs the result in `sync_logs`.
 *
 * Auth: Bearer token via SYNC_SECRET env var (set this in Vercel + local .env.local).
 * Can be triggered manually (admin panel) or by a Vercel Cron Job every 5 min during event.
 *
 * Setup:
 *   1. Register at https://app.pandascore.co → get API token
 *   2. Add PANDASCORE_TOKEN to .env.local + Vercel env vars
 *   3. Add SYNC_SECRET to .env.local + Vercel env vars
 *   4. Set tournament pandascore_id in DB (run query below after first successful sync)
 */

import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import type { MatchStatus, MatchFormat } from "@/lib/types/database.types"

const PANDASCORE_BASE = "https://api.pandascore.co"

// ── PandaScore types (subset we care about) ──────────────────────────────────

interface PSTeam {
  id: number
  name: string
  slug: string
  acronym: string | null
  image_url: string | null
  dark_mode_image_url?: string | null
}

interface PSGame {
  winner?: { id: number; type: string } | null
}

interface PSMatch {
  id: number
  name: string
  status: "not_started" | "running" | "finished" | "canceled"
  scheduled_at: string | null
  begin_at: string | null
  end_at: string | null
  match_type: string
  number_of_games: number
  opponents: Array<{ opponent: PSTeam }>
  results: Array<{ team_id: number; score: number }>
  winner?: PSTeam | null
  serie?: { id: number; name: string; slug: string } | null
  tournament?: { id: number; name: string; slug: string } | null
  games?: PSGame[] | null
  detailed_stats: boolean
  draw: boolean
  rescheduled: boolean | null
  league?: { id: number; name: string } | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function psStatusToLocal(status: PSMatch["status"]): MatchStatus {
  switch (status) {
    case "not_started": return "scheduled"
    case "running":     return "live"
    case "finished":    return "completed"
    case "canceled":    return "cancelled"
    default:            return "scheduled"
  }
}

function psFormatLabel(matchType: string, games: number): MatchFormat {
  // DB enum: bo1 | bo3 | bo5 (lowercase)
  const n = games === 1 ? 1 : games <= 3 ? 3 : 5
  return `bo${n}` as MatchFormat
}

async function psFetch(path: string, token: string) {
  const url = `${PANDASCORE_BASE}${path}`
  let res: Response
  try {
    res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "User-Agent": "Fantasix/1.0",
      },
    })
  } catch (e: unknown) {
    const cause = e instanceof Error && e.cause ? ` [cause: ${JSON.stringify(e.cause)}]` : ""
    throw new Error(`PandaScore network error fetching ${path}: ${e instanceof Error ? e.message : String(e)}${cause}`)
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`PandaScore ${path} → ${res.status}: ${text.slice(0, 200)}`)
  }
  return res.json()
}

// ── Auth helper ───────────────────────────────────────────────────────────────

function authorized(req: NextRequest): boolean {
  const auth = req.headers.get("authorization") ?? ""
  // Manual trigger: Bearer SYNC_SECRET
  const syncSecret = process.env.SYNC_SECRET
  if (syncSecret && auth === `Bearer ${syncSecret}`) return true
  // Vercel Cron: Bearer CRON_SECRET (auto-set by Vercel)
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && auth === `Bearer ${cronSecret}`) return true
  return false
}

// ── Main handler ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const token = process.env.PANDASCORE_TOKEN
  if (!token) {
    return NextResponse.json({ error: "PANDASCORE_TOKEN not configured" }, { status: 500 })
  }

  const supabase = createAdminClient()
  const startedAt = Date.now()

  let matchesCreated = 0
  let matchesUpdated = 0
  let errorMessage: string | null = null
  let tournamentDbId: string | null = null

  try {
    // 1. Load active tournament via direct REST fetch (bypasses SDK to isolate connectivity issues)
    const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const sbHeaders = { apikey: sbKey, Authorization: `Bearer ${sbKey}`, "Content-Type": "application/json" }

    const tRes = await fetch(
      `${sbUrl}/rest/v1/tournaments?is_active=eq.true&select=id,name,pandascore_id&limit=1`,
      { headers: sbHeaders, cache: "no-store" }
    )
    if (!tRes.ok) {
      const txt = await tRes.text().catch(() => "")
      console.error("[sync] tournament REST failed:", tRes.status, txt)
      return NextResponse.json({ error: `DB tournaments ${tRes.status}: ${txt}` }, { status: 500 })
    }
    const tournaments = await tRes.json() as Array<{ id: string; name: string; pandascore_id: string | null }>
    const tournament = tournaments[0] ?? null

    if (!tournament) {
      console.error("[sync] no active tournament found")
      return NextResponse.json({ error: "No active tournament in DB" }, { status: 404 })
    }
    tournamentDbId = tournament.id

    // Load phases via direct fetch
    const phRes = await fetch(
      `${sbUrl}/rest/v1/phases?tournament_id=eq.${tournament.id}&select=id,name,order_index&order=order_index.asc`,
      { headers: sbHeaders, cache: "no-store" }
    )
    const phasesData = phRes.ok ? await phRes.json() : []
    const sortedPhases = (phasesData ?? []) as Array<{ id: string; name: string; order_index: number }>

    // 2. Fetch matches from PandaScore
    //    Strategy A: filter by pandascore_id (tournament IDs, comma-separated) if already stored
    //    Strategy B: discover via BLAST R6 Major league_id=4999 — the fixed PandaScore league ID
    let psMatches: PSMatch[] = []
    const BLAST_MAJOR_LEAGUE_ID = 4999 // confirmed via API — never changes

    if (tournament.pandascore_id) {
      // pandascore_id stores comma-separated tournament IDs (one per phase)
      const tids = tournament.pandascore_id.split(",").map(s => s.trim()).join(",")
      const [running, upcoming, past] = await Promise.all([
        psFetch(`/r6siege/matches/running?filter[tournament_id]=${tids}&per_page=50`, token),
        psFetch(`/r6siege/matches/upcoming?filter[tournament_id]=${tids}&per_page=100`, token),
        psFetch(`/r6siege/matches/past?filter[tournament_id]=${tids}&per_page=100`, token),
      ])
      psMatches = [...running, ...upcoming, ...past]
    } else {
      // Discovery: find the latest BLAST Major serie, then grab its tournament IDs
      const series: Array<{ id: number; name: string; begin_at: string; tournaments: Array<{ id: number; name: string }> }> =
        await psFetch(
          `/r6siege/series?filter[league_id]=${BLAST_MAJOR_LEAGUE_ID}&sort=-begin_at&per_page=3`,
          token
        )

      // Pick the most recent serie (top of sort)
      const latestSerie = series[0]
      if (latestSerie && latestSerie.tournaments?.length > 0) {
        const tids = latestSerie.tournaments.map(t => t.id).join(",")

        const [running, upcoming, past] = await Promise.all([
          psFetch(`/r6siege/matches/running?filter[tournament_id]=${tids}&per_page=50`, token),
          psFetch(`/r6siege/matches/upcoming?filter[tournament_id]=${tids}&per_page=100`, token),
          psFetch(`/r6siege/matches/past?filter[tournament_id]=${tids}&per_page=100`, token),
        ])
        const allFound = [...running, ...upcoming, ...past]

        // Guard: only import matches from 2026-05-01 onwards (avoid pulling previous Majors)
        const MIN_DATE = new Date("2026-05-01T00:00:00Z")
        psMatches = allFound.filter(m => {
          const d = m.scheduled_at ?? m.begin_at
          return d ? new Date(d) >= MIN_DATE : false
        })

        // Only persist IDs if the serie actually has SLC 2026 matches
        if (psMatches.length === 0) {
          // No SLC data yet — don't persist, try again next sync
          psMatches = []
          return NextResponse.json({
            ok: true,
            warning: "BLAST Major found in PandaScore but no SLC 2026 matches yet (may still be scheduled). Check back after ~May 5.",
            matches_created: 0,
            matches_updated: 0,
          })
        }

        // Persist all tournament IDs for next run
        await supabase
          .from("tournaments")
          .update({ pandascore_id: tids })
          .eq("id", tournament.id)
      }
    }

    if (psMatches.length === 0) {
      // Log sync with warning
      await supabase.from("sync_logs").insert({
        tournament_id: tournament.id,
        triggered_by: "manual",
        status: "success",
        matches_created: 0,
        matches_updated: 0,
        error_message: "No PandaScore matches found for this tournament",
        duration_ms: Date.now() - startedAt,
      })
      return NextResponse.json({
        ok: true,
        warning: "No PandaScore matches found",
        matches_created: 0,
        matches_updated: 0,
      })
    }

    // 3. Load existing team roster from DB (to map PS team id/name → our UUID)
    const { data: dbTeams } = await supabase
      .from("teams")
      .select("id, name, short_name, pandascore_id")
      .order("name")
    const teamByPsId: Record<string, string> = {}
    const teamByNameLower: Record<string, string> = {}
    for (const t of (dbTeams ?? [])) {
      if (t.pandascore_id) teamByPsId[String(t.pandascore_id)] = t.id
      teamByNameLower[t.name.toLowerCase()] = t.id
      if (t.short_name) teamByNameLower[t.short_name.toLowerCase()] = t.id
    }

    function resolveTeamId(psTeam: PSTeam): string | null {
      if (teamByPsId[String(psTeam.id)]) return teamByPsId[String(psTeam.id)]
      if (teamByNameLower[psTeam.name.toLowerCase()]) return teamByNameLower[psTeam.name.toLowerCase()]
      if (psTeam.acronym && teamByNameLower[psTeam.acronym.toLowerCase()]) return teamByNameLower[psTeam.acronym.toLowerCase()]
      return null
    }

    // Also update pandascore_id + logo_url on teams we matched by name
    const teamPsIdUpdates: Array<{ id: string; pandascore_id: string; logo_url: string | null }> = []

    // 4. Upsert each match
    for (const m of psMatches) {
      if (m.opponents.length < 2) continue // skip TBD matches

      const psTeamA = m.opponents[0].opponent
      const psTeamB = m.opponents[1].opponent
      const teamAId = resolveTeamId(psTeamA)
      const teamBId = resolveTeamId(psTeamB)

      if (!teamAId || !teamBId) {
        // Unknown teams — skip (they may not be in our seeded roster)
        continue
      }

      // Track team pandascore_id + logo_url updates
      const psLogoUrl = (t: PSTeam) => t.dark_mode_image_url ?? t.image_url ?? null
      if (!teamByPsId[String(psTeamA.id)]) {
        teamPsIdUpdates.push({ id: teamAId, pandascore_id: String(psTeamA.id), logo_url: psLogoUrl(psTeamA) })
        teamByPsId[String(psTeamA.id)] = teamAId
      }
      if (!teamByPsId[String(psTeamB.id)]) {
        teamPsIdUpdates.push({ id: teamBId, pandascore_id: String(psTeamB.id), logo_url: psLogoUrl(psTeamB) })
        teamByPsId[String(psTeamB.id)] = teamBId
      }

      const resultA = m.results.find(r => r.team_id === psTeamA.id)?.score ?? 0
      const resultB = m.results.find(r => r.team_id === psTeamB.id)?.score ?? 0

      // Determine winner
      let winnerId: string | null = null
      if (m.winner && !m.draw) {
        winnerId = resolveTeamId(m.winner)
      } else if (m.status === "finished" && !m.draw && resultA !== resultB) {
        winnerId = resultA > resultB ? teamAId : teamBId
      }

      // Map to phase by round name (rough heuristic — phases ordered by date)
      // Phase assignment: PandaScore doesn't always expose phase nicely.
      // Fallback: assign to phase by order_index based on scheduled_at
      let phaseId: string | null = null
      const scheduledAt = m.scheduled_at ?? m.begin_at
      if (scheduledAt && sortedPhases.length > 0) {
        const matchDate = new Date(scheduledAt)
        // Playins: May 8-9; Swiss: May 10-13; Playoffs: May 15-17
        const PHASE_DATE_RANGES: Array<[string, Date, Date]> = [
          [sortedPhases[0]?.id, new Date("2026-05-08"), new Date("2026-05-10")],
          [sortedPhases[1]?.id, new Date("2026-05-10"), new Date("2026-05-15")],
          [sortedPhases[2]?.id, new Date("2026-05-15"), new Date("2026-05-18")],
        ]
        for (const [pid, start, end] of PHASE_DATE_RANGES) {
          if (pid && matchDate >= start && matchDate < end) { phaseId = pid; break }
        }
      }

      const format = psFormatLabel(m.match_type, m.number_of_games)
      const status = psStatusToLocal(m.status)

      const { data: existing } = await supabase
        .from("matches")
        .select("id")
        .eq("pandascore_id", String(m.id))
        .maybeSingle()

      if (existing) {
        // Update existing match
        const { error: updateErr } = await supabase
          .from("matches")
          .update({
            status,
            team_a_maps_won: resultA,
            team_b_maps_won: resultB,
            winner_id: winnerId,
            scheduled_at: scheduledAt,
            format,
            phase_id: phaseId ?? undefined,
          })
          .eq("pandascore_id", String(m.id))
        if (updateErr) throw new Error(`Update match ${m.id}: ${updateErr.message}`)
        matchesUpdated++
      } else {
        // Insert new match
        const { error: insertErr } = await supabase
          .from("matches")
          .insert({
            tournament_id: tournament.id,
            phase_id: phaseId,
            pandascore_id: String(m.id),
            team_a_id: teamAId,
            team_b_id: teamBId,
            status,
            format,
            scheduled_at: scheduledAt,
            team_a_maps_won: resultA,
            team_b_maps_won: resultB,
            winner_id: winnerId,
          })
        if (insertErr) throw new Error(`Insert match ${m.id} (${psTeamA.name} vs ${psTeamB.name}): ${insertErr.message}`)
        matchesCreated++
      }
    }

    // 5. Update team pandascore_id + logo_url in batch
    for (const update of teamPsIdUpdates) {
      await supabase
        .from("teams")
        .update({ pandascore_id: update.pandascore_id, ...(update.logo_url ? { logo_url: update.logo_url } : {}) })
        .eq("id", update.id)
    }

  } catch (err) {
    errorMessage = err instanceof Error ? err.message : String(err)
  }

  // 6. Log sync result
  const duration = Date.now() - startedAt
  await supabase.from("sync_logs").insert({
    tournament_id: tournamentDbId,
    triggered_by: "manual",
    status: errorMessage ? "error" : "success",
    matches_created: matchesCreated,
    matches_updated: matchesUpdated,
    error_message: errorMessage,
    duration_ms: duration,
  })

  if (errorMessage) {
    return NextResponse.json(
      { ok: false, error: errorMessage, matches_created: matchesCreated, matches_updated: matchesUpdated },
      { status: 500 }
    )
  }

  return NextResponse.json({
    ok: true,
    matches_created: matchesCreated,
    matches_updated: matchesUpdated,
    duration_ms: duration,
  })
}

// GET — Vercel Cron trigger OR health check
// Vercel Cron calls GET with Authorization: Bearer {CRON_SECRET}
// Admin health check: GET with Authorization: Bearer {SYNC_SECRET} + ?health=1
export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)

  // Health check mode — just return last sync logs
  if (searchParams.get("health") === "1") {
    const supabase = createAdminClient()
    const { data: lastSync } = await supabase
      .from("sync_logs")
      .select("*")
      .order("synced_at", { ascending: false })
      .limit(10)
    return NextResponse.json({ ok: true, recent_syncs: lastSync ?? [] })
  }

  // Otherwise: trigger a sync (Vercel Cron path)
  // Build a synthetic POST-like request and call POST
  const syntheticReq = new NextRequest(req.url, {
    method: "POST",
    headers: req.headers,
  })
  return POST(syntheticReq)
}
