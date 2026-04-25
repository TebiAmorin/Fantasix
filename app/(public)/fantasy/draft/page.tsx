import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DraftBoard } from "@/components/fantasy/draft-board"
import type { Metadata } from "next"
import type { Phase, PlayerWithTeam } from "@/lib/types/database.types"

export const metadata: Metadata = {
  title: "Draft — Fantasy League",
}

export default async function DraftPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login?redirect=/fantasy/draft")

  // Active tournament + phases
  const { data: tournament } = await supabase
    .from("tournaments")
    .select("id, name, phases(*)")
    .eq("is_active", true)
    .single() as { data: { id: string; name: string; phases: Phase[] } | null }

  const phases: Phase[] = tournament?.phases ?? []
  const activePhase = phases.find((p) => p.is_active) ?? null

  if (!activePhase) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <p className="text-text-muted text-sm">No active phase right now.</p>
      </div>
    )
  }

  if (!activePhase.draft_open) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center space-y-2">
        <h2 className="font-display text-2xl text-text">Draft is closed</h2>
        <p className="text-text-muted text-sm">
          The draft window for <strong>{activePhase.name}</strong> is not open yet.
        </p>
      </div>
    )
  }

  // Players
  const { data: rawPlayers } = await supabase
    .from("players")
    .select("*, teams(id, name, short_name, logo_url, region)")
    .eq("is_active", true)
    .order("fantasy_cost", { ascending: false })

  const players = (rawPlayers ?? []) as PlayerWithTeam[]

  // Existing roster for this phase
  const { data: rawRoster } = await supabase
    .from("fantasy_rosters")
    .select("id, budget_spent, fantasy_picks(player_id, players(*, teams(id, name, short_name, logo_url, region)))")
    .eq("user_id", user.id)
    .eq("phase_id", activePhase.id)
    .maybeSingle()

  const existingRoster = rawRoster as {
    id: string
    budget_spent: number
    fantasy_picks: Array<{ player_id: string; players: PlayerWithTeam }>
  } | null

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <p className="text-xs text-purple font-medium uppercase tracking-widest mb-1">
          {tournament?.name} · {activePhase.name}
        </p>
        <h1 className="font-display text-3xl text-text">
          {existingRoster ? "Edit Your Roster" : "Build Your Roster"}
        </h1>
        <p className="text-text-muted text-sm mt-1">
          Pick 5 players within the salary cap of{" "}
          <span className="text-gold font-medium">{activePhase.salary_cap} pts</span>
        </p>
      </div>

      <DraftBoard
        players={players}
        existingRoster={existingRoster}
        salaryCap={activePhase.salary_cap}
        phaseId={activePhase.id}
        tournamentId={tournament!.id}
        userId={user.id}
      />
    </div>
  )
}
