"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

// ── Guard ────────────────────────────────────────────────────────────────────

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthenticated")
  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((data as any)?.role !== "admin") throw new Error("Forbidden")
  return supabase
}

// ── TEAMS ────────────────────────────────────────────────────────────────────

export async function upsertTeam(formData: FormData) {
  const supabase = await requireAdmin()

  const id        = formData.get("id") as string | null
  const name      = formData.get("name") as string
  const shortName = formData.get("short_name") as string
  const region    = formData.get("region") as string
  const logoUrl   = formData.get("logo_url") as string | null

  if (!name?.trim()) throw new Error("Team name is required")

  const payload = {
    name:       name.trim(),
    short_name: shortName?.trim() || null,
    region:     region?.trim() || null,
    logo_url:   logoUrl || null,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = id
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? await (supabase as any).from("teams").update(payload).eq("id", id)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    : await (supabase as any).from("teams").insert(payload)

  if (error) throw new Error(error.message)

  revalidatePath("/admin/teams")
  revalidatePath("/fantasy")
  redirect("/admin/teams")
}

export async function deleteTeam(id: string) {
  const supabase = await requireAdmin()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("teams").delete().eq("id", id)
  if (error) return { error: error.message }
  revalidatePath("/admin/teams")
  return { success: true }
}

// ── PLAYERS ──────────────────────────────────────────────────────────────────

export async function upsertPlayer(formData: FormData) {
  const supabase = await requireAdmin()

  const id         = formData.get("id") as string | null
  const nickname   = formData.get("nickname") as string
  const realName   = formData.get("real_name") as string
  const teamId     = formData.get("team_id") as string
  const role       = formData.get("role") as string
  const nationality= formData.get("nationality") as string
  const avatarUrl  = formData.get("avatar_url") as string | null
  const cost       = parseInt(formData.get("fantasy_cost") as string) || 10

  if (!nickname?.trim()) throw new Error("Nickname is required")

  const payload = {
    nickname:     nickname.trim(),
    real_name:    realName?.trim() || null,
    team_id:      teamId || null,
    role:         role || null,
    nationality:  nationality?.trim() || null,
    avatar_url:   avatarUrl || null,
    fantasy_cost: cost,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = id
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? await (supabase as any).from("players").update(payload).eq("id", id)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    : await (supabase as any).from("players").insert(payload)

  if (error) throw new Error(error.message)

  revalidatePath("/admin/players")
  revalidatePath("/fantasy")
  redirect("/admin/players")
}

export async function deletePlayer(id: string) {
  const supabase = await requireAdmin()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("players").delete().eq("id", id)
  if (error) return { error: error.message }
  revalidatePath("/admin/players")
  return { success: true }
}

// ── TOURNAMENTS ───────────────────────────────────────────────────────────────

export async function upsertTournament(formData: FormData) {
  const supabase = await requireAdmin()

  const id        = formData.get("id") as string | null
  const name      = formData.get("name") as string
  const slug      = formData.get("slug") as string
  const startDate = formData.get("start_date") as string
  const endDate   = formData.get("end_date") as string
  const logoUrl   = formData.get("logo_url") as string | null
  const isActive  = formData.get("is_active") === "true"

  if (!name?.trim() || !slug?.trim()) throw new Error("Name and slug are required")

  // If setting active, deactivate others first
  if (isActive) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("tournaments").update({ is_active: false }).neq("id", id ?? "")
  }

  const payload = {
    name:       name.trim(),
    slug:       slug.trim().toLowerCase().replace(/\s+/g, "-"),
    is_active:  isActive,
    start_date: startDate || null,
    end_date:   endDate || null,
    logo_url:   logoUrl || null,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = id
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? await (supabase as any).from("tournaments").update(payload).eq("id", id)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    : await (supabase as any).from("tournaments").insert(payload)

  if (error) throw new Error(error.message)

  revalidatePath("/admin/tournaments")
  redirect("/admin/tournaments")
}

// ── PHASES ────────────────────────────────────────────────────────────────────

export async function upsertPhase(formData: FormData) {
  const supabase = await requireAdmin()

  const id            = formData.get("id") as string | null
  const tournamentId  = formData.get("tournament_id") as string
  const name          = formData.get("name") as string
  const type          = formData.get("type") as string
  const orderIndex    = parseInt(formData.get("order_index") as string) || 1
  const salaryCap     = parseInt(formData.get("salary_cap") as string) || 100
  const isActive      = formData.get("is_active") === "true"
  const draftOpen     = formData.get("draft_open") === "true"

  if (!name?.trim()) throw new Error("Phase name is required")

  // Only one phase active at a time per tournament
  if (isActive) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("phases")
      .update({ is_active: false })
      .eq("tournament_id", tournamentId)
      .neq("id", id ?? "")
  }

  const payload = {
    tournament_id: tournamentId,
    name:          name.trim(),
    type,
    order_index:   orderIndex,
    salary_cap:    salaryCap,
    is_active:     isActive,
    draft_open:    draftOpen,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = id
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? await (supabase as any).from("phases").update(payload).eq("id", id)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    : await (supabase as any).from("phases").insert(payload)

  if (error) throw new Error(error.message)

  revalidatePath("/admin/tournaments")
  revalidatePath("/fantasy")
  redirect("/admin/tournaments")
}

// ── MATCHES ───────────────────────────────────────────────────────────────────

export async function upsertMatch(formData: FormData) {
  const supabase = await requireAdmin()

  const id            = formData.get("id") as string | null
  const tournamentId  = formData.get("tournament_id") as string
  const phaseId       = formData.get("phase_id") as string
  const teamAId       = formData.get("team_a_id") as string
  const teamBId       = formData.get("team_b_id") as string
  const format        = formData.get("format") as string
  const scheduledAt   = formData.get("scheduled_at") as string
  const externalUrl   = formData.get("external_stats_url") as string

  if (!teamAId || !teamBId) throw new Error("Both teams are required")
  if (teamAId === teamBId)  throw new Error("Teams must be different")

  const payload = {
    tournament_id:      tournamentId,
    phase_id:           phaseId || null,
    team_a_id:          teamAId,
    team_b_id:          teamBId,
    format:             format || "bo3",
    scheduled_at:       scheduledAt || null,
    external_stats_url: externalUrl?.trim() || null,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = id
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? await (supabase as any).from("matches").update(payload).eq("id", id)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    : await (supabase as any).from("matches").insert(payload)

  if (error) throw new Error(error.message)

  revalidatePath("/admin/matches")
  redirect("/admin/matches")
}

export async function setMatchResult(formData: FormData) {
  const supabase = await requireAdmin()

  const matchId     = formData.get("match_id") as string
  const winnerId    = formData.get("winner_id") as string
  const teamAMaps   = parseInt(formData.get("team_a_maps_won") as string) || 0
  const teamBMaps   = parseInt(formData.get("team_b_maps_won") as string) || 0
  const externalUrl = formData.get("external_stats_url") as string

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("matches")
    .update({
      winner_id:          winnerId,
      team_a_maps_won:    teamAMaps,
      team_b_maps_won:    teamBMaps,
      status:             "completed",
      external_stats_url: externalUrl?.trim() || null,
    })
    .eq("id", matchId)

  if (error) return { error: error.message }

  revalidatePath("/admin/matches")
  revalidatePath(`/admin/matches/${matchId}`)
  revalidatePath("/fantasy")
  return { success: true }
}

export async function setMatchLive(matchId: string) {
  const supabase = await requireAdmin()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from("matches").update({ status: "live" }).eq("id", matchId)
  revalidatePath("/admin/matches")
  return { success: true }
}

// ── PLAYER MATCH STATS ────────────────────────────────────────────────────────

export async function upsertPlayerStats(formData: FormData) {
  const supabase = await requireAdmin()

  const matchId   = formData.get("match_id") as string
  const playerId  = formData.get("player_id") as string

  const payload = {
    match_id:        matchId,
    player_id:       playerId,
    kills:           parseInt(formData.get("kills") as string) || 0,
    deaths:          parseInt(formData.get("deaths") as string) || 0,
    entry_kills:     parseInt(formData.get("entry_kills") as string) || 0,
    entry_deaths:    parseInt(formData.get("entry_deaths") as string) || 0,
    kost:            parseFloat(formData.get("kost") as string) || 0,
    plants:          parseInt(formData.get("plants") as string) || 0,
    defuses:         parseInt(formData.get("defuses") as string) || 0,
    clutch_1v1:      parseInt(formData.get("clutch_1v1") as string) || 0,
    clutch_1v2:      parseInt(formData.get("clutch_1v2") as string) || 0,
    clutch_1v3:      parseInt(formData.get("clutch_1v3") as string) || 0,
    clutch_1v4:      parseInt(formData.get("clutch_1v4") as string) || 0,
    clutch_1v5:      parseInt(formData.get("clutch_1v5") as string) || 0,
    rounds_survived: parseInt(formData.get("rounds_survived") as string) || 0,
    rounds_played:   parseInt(formData.get("rounds_played") as string) || 0,
  }

  // Upsert (insert or update if stats already exist)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("player_match_stats")
    .upsert(payload, { onConflict: "match_id,player_id" })

  if (error) return { error: error.message }

  revalidatePath(`/admin/matches/${matchId}`)
  return { success: true }
}

// ── SCORING CONFIG ────────────────────────────────────────────────────────────

export async function updateScoringConfig(formData: FormData) {
  const supabase = await requireAdmin()

  const updates: Array<{ stat_key: string; value: number }> = []
  for (const [key, val] of formData.entries()) {
    if (key.startsWith("scoring_")) {
      const statKey = key.replace("scoring_", "")
      const value   = parseFloat(val as string)
      if (!isNaN(value)) updates.push({ stat_key: statKey, value })
    }
  }

  for (const update of updates) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("scoring_config")
      .update({ value: update.value, updated_at: new Date().toISOString() })
      .eq("stat_key", update.stat_key)
    if (error) return { error: error.message }
  }

  revalidatePath("/admin/scoring")
  return { success: true }
}

// ── PANDASCORE SYNC ───────────────────────────────────────────────────────────

export async function triggerSync(): Promise<{
  ok: boolean
  matches_created?: number
  matches_updated?: number
  warning?: string
  error?: string
  duration_ms?: number
}> {
  await requireAdmin()

  const secret = process.env.SYNC_SECRET
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

  if (!secret) return { ok: false, error: "SYNC_SECRET not configured" }
  if (!process.env.PANDASCORE_TOKEN) return { ok: false, error: "PANDASCORE_TOKEN not configured" }

  try {
    const res = await fetch(`${appUrl}/api/sync/pandascore`, {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}` },
      cache: "no-store",
    })
    const data = await res.json()
    revalidatePath("/admin/sync")
    revalidatePath("/predictions")
    return data
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

export async function getSyncLogs() {
  await requireAdmin()
  const supabase = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("sync_logs")
    .select("id, status, matches_created, matches_updated, error_message, duration_ms, triggered_by, synced_at")
    .order("synced_at", { ascending: false })
    .limit(20)
  return (data ?? []) as Array<{
    id: string
    status: string
    matches_created: number
    matches_updated: number
    error_message: string | null
    duration_ms: number | null
    triggered_by: string
    synced_at: string
  }>
}
