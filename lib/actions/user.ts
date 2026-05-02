"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

// ── PREDICTIONS ───────────────────────────────────────────────────────────────

export async function submitPrediction(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const matchId   = formData.get("match_id")   as string
  const winnerId  = formData.get("winner_id")   as string

  if (!matchId || !winnerId) return { error: "Missing fields" }

  const { data: match } = await supabase
    .from("matches")
    .select("status")
    .eq("id", matchId)
    .single()

  if (!match) return { error: "Match not found" }
  if (match.status !== "scheduled") return { error: "Match already locked" }

  const { error } = await supabase
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

// ── PROFILE SETUP (first-login onboarding) ────────────────────────────────────

export async function setupProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const username  = (formData.get("username") as string ?? "").trim()
  const next      = (formData.get("redirect")  as string ?? "/predictions")
  const safeNext  = next.startsWith("/") ? next : "/predictions"

  // Validate
  if (!username || !/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
    redirect(`/setup?redirect=${encodeURIComponent(safeNext)}&error=invalid`)
  }

  // Check uniqueness (case-insensitive)
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .ilike("username", username)
    .neq("id", user.id)
    .maybeSingle()

  if (existing) {
    redirect(`/setup?redirect=${encodeURIComponent(safeNext)}&error=taken`)
  }

  const { error } = await supabase
    .from("profiles")
    .update({ username, setup_complete: true, updated_at: new Date().toISOString() })
    .eq("id", user.id)

  if (error) redirect(`/setup?redirect=${encodeURIComponent(safeNext)}&error=invalid`)

  revalidatePath(`/profile/${username}`)
  redirect(safeNext)
}

// ── PROFILE SETTINGS ──────────────────────────────────────────────────────────

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const newUsername = (formData.get("username") as string ?? "").trim()
  const avatarUrl   = (formData.get("avatar_url") as string ?? "").trim() || null

  if (!newUsername || !/^[a-zA-Z0-9_]{3,20}$/.test(newUsername)) {
    return { error: "Username must be 3–20 characters (letters, numbers, underscores only)." }
  }

  // Check uniqueness
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .ilike("username", newUsername)
    .neq("id", user.id)
    .maybeSingle()

  if (existing) return { error: "That username is already taken." }

  const { error } = await supabase
    .from("profiles")
    .update({
      username:   newUsername,
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)

  if (error) return { error: error.message }

  revalidatePath("/settings")
  revalidatePath(`/profile/${newUsername}`)
  revalidatePath("/leaderboard")
  return { success: true, username: newUsername }
}

// ── AVATAR UPLOAD ─────────────────────────────────────────────────────────────

export async function uploadAvatar(formData: FormData): Promise<{ url?: string; error?: string }> {
  const supabase     = await createClient()
  const adminClient  = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const file = formData.get("avatar") as File | null
  if (!file || file.size === 0) return { error: "No file provided" }
  if (file.size > 2 * 1024 * 1024) return { error: "File too large (max 2 MB)" }

  const ext  = file.name.split(".").pop()?.toLowerCase() ?? "jpg"
  const path = `${user.id}/avatar.${ext}`

  const buffer = await file.arrayBuffer()

  const { error: uploadError } = await adminClient
    .storage
    .from("avatars")
    .upload(path, buffer, {
      contentType: file.type,
      upsert: true,
    })

  if (uploadError) return { error: uploadError.message }

  const { data: urlData } = adminClient
    .storage
    .from("avatars")
    .getPublicUrl(path)

  const publicUrl = `${urlData.publicUrl}?v=${Date.now()}`

  // Update profile
  await supabase
    .from("profiles")
    .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
    .eq("id", user.id)

  revalidatePath("/settings")
  return { url: publicUrl }
}
