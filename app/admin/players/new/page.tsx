import { createClient } from "@/lib/supabase/server"
import { PlayerForm } from "@/components/admin/player-form"
import type { Metadata } from "next"
import type { Team } from "@/lib/types/database.types"

export const metadata: Metadata = { title: "New Player — Admin" }

export default async function NewPlayerPage() {
  const supabase = await createClient()
  const { data: teams } = await supabase.from("teams").select("*").eq("is_active", true).order("name")

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl text-text">Add Player</h1>
        <p className="text-text-muted text-sm mt-0.5">Register a new player for the tournament roster</p>
      </div>
      <PlayerForm teams={(teams ?? []) as Team[]} />
    </div>
  )
}
