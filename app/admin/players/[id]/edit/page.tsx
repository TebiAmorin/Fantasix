import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { PlayerForm } from "@/components/admin/player-form"
import type { Metadata } from "next"
import type { Player, Team } from "@/lib/types/database.types"

export const metadata: Metadata = { title: "Edit Player — Admin" }

export default async function EditPlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: player }, { data: teams }] = await Promise.all([
    supabase.from("players").select("*").eq("id", id).single(),
    supabase.from("teams").select("*").eq("is_active", true).order("name"),
  ])

  if (!player) notFound()

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl text-text">Edit Player</h1>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <p className="text-text-muted text-sm mt-0.5">{(player as any).nickname}</p>
      </div>
      <PlayerForm player={player as Player} teams={(teams ?? []) as Team[]} />
    </div>
  )
}
