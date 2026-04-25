"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

interface SaveDraftInput {
  phaseId: string
  tournamentId: string
  playerIds: string[]     // exactly 5
  budgetSpent: number
  existingRosterId?: string
}

export async function saveDraft(input: SaveDraftInput): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (!user || authError) return { success: false, error: "Not authenticated" }

  if (input.playerIds.length !== 5) {
    return { success: false, error: "Must pick exactly 5 players" }
  }

  // Verify draft is still open
  const { data: phaseData } = await supabase
    .from("phases")
    .select("draft_open, salary_cap")
    .eq("id", input.phaseId)
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const phase = phaseData as any
  if (!phase?.draft_open) return { success: false, error: "Draft window is closed" }

  // Verify budget
  const { data: playersData } = await supabase
    .from("players")
    .select("id, fantasy_cost")
    .in("id", input.playerIds)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const players = (playersData ?? []) as Array<{ id: string; fantasy_cost: number }>
  const totalCost = players.reduce((sum, p) => sum + p.fantasy_cost, 0)
  if (totalCost > phase.salary_cap) {
    return { success: false, error: `Budget exceeded: ${totalCost} > ${phase.salary_cap}` }
  }

  try {
    if (input.existingRosterId) {
      // Replace picks
      const { error: deleteErr } = await supabase
        .from("fantasy_picks")
        .delete()
        .eq("roster_id", input.existingRosterId)
      if (deleteErr) throw deleteErr

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateErr } = await (supabase as any)
        .from("fantasy_rosters")
        .update({ budget_spent: totalCost, updated_at: new Date().toISOString() })
        .eq("id", input.existingRosterId)
      if (updateErr) throw updateErr

      const picks = input.playerIds.map((playerId) => ({
        roster_id: input.existingRosterId,
        player_id: playerId,
      }))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: picksErr } = await supabase.from("fantasy_picks").insert(picks as any)
      if (picksErr) throw picksErr

    } else {
      // New roster
      const { data: rosterData, error: rosterErr } = await supabase
        .from("fantasy_rosters")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .insert({
          user_id: user.id,
          tournament_id: input.tournamentId,
          phase_id: input.phaseId,
          budget_spent: totalCost,
        } as any)
        .select("id")
        .single()
      if (rosterErr) throw rosterErr

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const roster = rosterData as any
      const picks = input.playerIds.map((playerId) => ({
        roster_id: roster.id,
        player_id: playerId,
      }))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: picksErr } = await supabase.from("fantasy_picks").insert(picks as any)
      if (picksErr) throw picksErr
    }

    revalidatePath("/fantasy")
    revalidatePath("/fantasy/draft")
    return { success: true }

  } catch (err) {
    console.error("saveDraft error:", err)
    return { success: false, error: "Database error — please try again" }
  }
}
