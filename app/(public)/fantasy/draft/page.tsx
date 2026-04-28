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
      <div className="mx-auto max-w-7xl px-4 py-24 text-center space-y-3">
        <div className="font-display text-5xl text-text-muted/20 tracking-widest">NO ACTIVE PHASE</div>
        <p className="text-text-muted text-sm">Check back when the next phase opens.</p>
      </div>
    )
  }

  if (!activePhase.draft_open) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 text-center space-y-3">
        <div className="font-display text-5xl text-text-muted/20 tracking-widest">DRAFT CLOSED</div>
        <p className="text-text-muted text-sm">
          The draft window for <span className="text-text">{activePhase.name}</span> is not open yet.
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
    <div>
      {/* ── Hero ─────────────────────────────────────────── */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0" style={{background:'radial-gradient(ellipse 70% 60% at 50% 0%, rgba(157,111,255,0.14) 0%, transparent 70%), radial-gradient(ellipse 40% 50% at 90% 60%, rgba(245,200,66,0.07) 0%, transparent 55%), #07080D'}} />
        <div className="absolute inset-0 grid-fine opacity-30" />
        <div className="absolute top-0 right-1/3 w-64 h-64 rounded-full bg-purple/8 blur-[90px] pointer-events-none animate-glow-pulse" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-10 pb-12">
          <div className="space-y-3 animate-fade-up">
            <div className="badge-eyebrow" style={{color:'#F5C842', borderColor:'rgba(245,200,66,0.25)', backgroundColor:'rgba(245,200,66,0.08)'}}>
              <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              Draft · {tournament?.name}
            </div>
            <h1 className="font-display text-4xl sm:text-5xl text-text leading-none">
              {existingRoster
                ? <span>Edit <span className="text-glow-purple">Your Roster</span></span>
                : <span>Build <span className="text-glow-gold">Your Roster</span></span>
              }
            </h1>
            <p className="text-text-muted text-sm tracking-wide">
              {activePhase.name} · Pick 5 players within the salary cap of{" "}
              <span className="text-gold font-stats font-bold">{activePhase.salary_cap} pts</span>
            </p>
          </div>
        </div>
      </div>

      {/* ── Draft board ──────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <DraftBoard
          players={players}
          existingRoster={existingRoster}
          salaryCap={activePhase.salary_cap}
          phaseId={activePhase.id}
          tournamentId={tournament!.id}
          userId={user.id}
        />
      </div>
    </div>
  )
}
