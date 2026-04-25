import { createClient } from "@/lib/supabase/server"
import { MatchForm } from "@/components/admin/match-form"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Edit Match — Admin" }

export default async function EditMatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: rawMatch }, { data: teams }, { data: tournaments }] = await Promise.all([
    supabase
      .from("matches")
      .select("id, team_a_id, team_b_id, phase_id, format, scheduled_at, external_stats_url, tournament_id")
      .eq("id", id)
      .single(),
    supabase.from("teams").select("id, name, short_name, logo_url").eq("is_active", true).order("name"),
    supabase.from("tournaments").select("id, name, phases(id, name, order_index)").eq("is_active", true).single(),
  ])

  if (!rawMatch) notFound()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const match = rawMatch as any

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link
          href={`/admin/matches/${id}`}
          className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text transition-colors mb-4"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to match
        </Link>
        <h1 className="font-display text-2xl text-text">Edit Match</h1>
        <p className="text-text-muted text-sm mt-0.5">Change teams, date, format or phase</p>
      </div>

      <MatchForm
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        teams={(teams ?? []) as any}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tournament={tournaments as any}
        match={{
          id:                 match.id,
          team_a_id:          match.team_a_id,
          team_b_id:          match.team_b_id,
          phase_id:           match.phase_id,
          format:             match.format,
          scheduled_at:       match.scheduled_at,
          external_stats_url: match.external_stats_url,
        }}
      />
    </div>
  )
}
