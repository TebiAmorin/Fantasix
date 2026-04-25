import { createClient } from "@/lib/supabase/server"
import { FantasyLeaderboard } from "@/components/fantasy/fantasy-leaderboard"
import { PlayerGrid } from "@/components/fantasy/player-grid"
import { PhaseSelector } from "@/components/fantasy/phase-selector"
import { DraftCTA } from "@/components/fantasy/draft-cta"
import { Trophy, Users } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Metadata } from "next"
import type { Phase, PlayerWithTeam } from "@/lib/types/database.types"

export const metadata: Metadata = {
  title: "Fantasy League",
  description: "Draft your R6 Siege team and compete for the top of the leaderboard.",
}

export default async function FantasyPage() {
  const supabase = await createClient()

  // Active tournament + phases
  const { data: tournament } = await supabase
    .from("tournaments")
    .select("id, name, slug, phases(*)")
    .eq("is_active", true)
    .single() as { data: { id: string; name: string; slug: string; phases: Phase[] } | null }

  const phases: Phase[] = tournament?.phases ?? []
  const activePhase = phases.find((p) => p.is_active) ?? null

  // Players with team info
  const { data: rawPlayers } = await supabase
    .from("players")
    .select("*, teams(id, name, short_name, logo_url, region)")
    .eq("is_active", true)
    .order("fantasy_cost", { ascending: false })

  const players = (rawPlayers ?? []) as PlayerWithTeam[]

  // Global leaderboard top 50
  const { data: leaderboard } = await supabase
    .from("fantasy_leaderboard")
    .select("*")
    .limit(50) as {
      data: Array<{
        user_id: string
        username: string
        avatar_url: string | null
        total_points: number
        phases_played: number
      }> | null
    }

  // Current user
  const { data: { user } } = await supabase.auth.getUser()

  let userRoster: { fantasy_picks: Array<{ player_id: string }> } | null = null
  if (user && activePhase) {
    const { data } = await supabase
      .from("fantasy_rosters")
      .select("id, fantasy_picks(player_id)")
      .eq("user_id", user.id)
      .eq("phase_id", activePhase.id)
      .maybeSingle()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    userRoster = data as any
  }

  return (
    <div>
      {/* ── Hero section ──────────────────────────────────── */}
      <div className="relative overflow-hidden">
        {/* Hero atmospheric mesh */}
        <div className="absolute inset-0 bg-hero-mesh" />
        <div className="absolute inset-0 grid-fine opacity-40" />

        {/* Glow orbs */}
        <div className="absolute top-0 left-1/4 w-72 h-72 rounded-full bg-purple/12 blur-[100px] pointer-events-none animate-glow-pulse" />
        <div className="absolute bottom-0 right-1/3 w-48 h-48 rounded-full bg-gold/8 blur-[80px] pointer-events-none" />

        {/* Horizontal accent lines */}
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-purple/30 to-transparent" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-10 pb-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="space-y-3 animate-fade-up">
              <div className="badge-eyebrow">
                <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                Fantasy League
              </div>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-text leading-none">
                {tournament?.name
                  ? <span className="text-glow-purple">{tournament.name}</span>
                  : <span className="text-text-muted">No Active Tournament</span>
                }
              </h1>
              {activePhase && (
                <div className="flex items-center gap-3">
                  <span className="font-display text-sm text-text-muted tracking-widest">
                    PHASE · <span className="text-text">{activePhase.name}</span>
                  </span>
                  {activePhase.draft_open && (
                    <span className="badge-eyebrow text-gold border-gold/25 bg-gold/8" style={{color:'#F5C842'}}>
                      Draft Open
                    </span>
                  )}
                </div>
              )}
            </div>

            {activePhase?.draft_open && (
              <div className="animate-fade-up-2 shrink-0">
                <DraftCTA
                  user={user}
                  hasRoster={!!userRoster}
                  phaseId={activePhase.id}
                  salaryCap={activePhase.salary_cap}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Main content ──────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {phases.length > 1 && (
          <PhaseSelector phases={phases} activePhaseid={activePhase?.id} />
        )}

        <Tabs defaultValue="leaderboard" className="space-y-6">
          <TabsList className="bg-surface/80 border border-purple/10 p-1 backdrop-blur-sm rounded-xl h-10">
            <TabsTrigger
              value="leaderboard"
              className="rounded-lg data-[state=active]:bg-gold/12 data-[state=active]:text-gold data-[state=active]:shadow-none gap-2 text-xs uppercase tracking-wider font-display transition-all duration-500"
            >
              <Trophy className="h-3 w-3" />
              Leaderboard
            </TabsTrigger>
            <TabsTrigger
              value="players"
              className="rounded-lg data-[state=active]:bg-gold/12 data-[state=active]:text-gold data-[state=active]:shadow-none gap-2 text-xs uppercase tracking-wider font-display transition-all duration-500"
            >
              <Users className="h-3 w-3" />
              Players
            </TabsTrigger>
          </TabsList>

          <TabsContent value="leaderboard" className="mt-0 animate-fade-up">
            <FantasyLeaderboard
              entries={leaderboard ?? []}
              currentUserId={user?.id}
              phases={phases}
            />
          </TabsContent>

          <TabsContent value="players" className="mt-0 animate-fade-up">
            <PlayerGrid
              players={players}
              userPicks={userRoster?.fantasy_picks?.map((p) => p.player_id) ?? []}
              salaryCap={activePhase?.salary_cap ?? 100}
              draftOpen={activePhase?.draft_open ?? false}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
