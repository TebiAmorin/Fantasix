"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// ── PREDICTIONS ───────────────────────────────────────────────────────────────

export async function submitPrediction(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const matchId   = formData.get("match_id")   as string
  const winnerId  = formData.get("winner_id")   as string

  if (!matchId || !winnerId) return { error: "Missing fields" }

  // Verify match still scheduled (RLS also enforces this, but give clear error)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: match } = await (supabase as any)
    .from("matches")
    .select("status")
    .eq("id", matchId)
    .single() as { data: { status: string } | null }

  if (!match) return { error: "Match not found" }
  if (match.status !== "scheduled") return { error: "Match already locked" }

  // Upsert — user can change pick while match is scheduled
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("match_predictions")
    .upsert(
      {
        user_id:              user.id,
        match_id:             matchId,
        predicted_winner_id:  winnerId,
        is_correct:           null,
        points_earned:        0,
      },
      { onConflict: "user_id,match_id" }
    )

  if (error) return { error: error.message }

  revalidatePath("/predictions")
  return { success: true }
}
