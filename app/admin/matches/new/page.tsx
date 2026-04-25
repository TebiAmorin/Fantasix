import { createClient } from "@/lib/supabase/server"
import { MatchForm } from "@/components/admin/match-form"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "New Match — Admin" }

export default async function NewMatchPage() {
  const supabase = await createClient()

  const [{ data: teams }, { data: tournaments }] = await Promise.all([
    supabase.from("teams").select("id, name, short_name, logo_url").eq("is_active", true).order("name"),
    supabase.from("tournaments").select("id, name, phases(id, name, order_index)").eq("is_active", true).single(),
  ])

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl text-text">New Match</h1>
        <p className="text-text-muted text-sm mt-0.5">Schedule a match between two teams</p>
      </div>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <MatchForm teams={(teams ?? []) as any} tournament={tournaments as any} />
    </div>
  )
}
