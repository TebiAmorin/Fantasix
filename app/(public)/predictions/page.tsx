import { createClient } from "@/lib/supabase/server"
import { PredictionCard } from "@/components/predictions/prediction-card"
import { Target, Trophy, TrendingUp } from "lucide-react"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Pick'Em Predictions",
  description: "Predict match winners and climb the Pick'Em leaderboard.",
}

export default async function PredictionsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // Active tournament
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: tournament } = await (supabase as any)
    .from("tournaments")
    .select("id, name, phases(id, name, order_index, is_active)")
    .eq("is_active", true)
    .single() as { data: { id: string; name: string; phases: Array<{ id: string; name: string; order_index: number; is_active: boolean }> } | null }

  // All matches for the tournament (ordered by scheduled date)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rawMatches } = await (supabase as any)
    .from("matches")
    .select(`
      id, status, format, scheduled_at, team_a_maps_won, team_b_maps_won,
      winner_id, phase_id,
      team_a:teams!matches_team_a_id_fkey(id, name, short_name, logo_url),
      team_b:teams!matches_team_b_id_fkey(id, name, short_name, logo_url),
      phases(id, name, order_index)
    `)
    .eq("tournament_id", tournament?.id ?? "")
    .neq("status", "cancelled")
    .order("scheduled_at", { ascending: true })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const matches = (rawMatches ?? []) as any[]

  // User's existing picks
  const picksMap: Record<string, string> = {}
  if (user) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: picks } = await (supabase as any)
      .from("match_predictions")
      .select("match_id, predicted_winner_id")
      .eq("user_id", user.id)
      .in("match_id", matches.map((m) => m.id))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const p of (picks ?? []) as any[]) {
      picksMap[p.match_id] = p.predicted_winner_id
    }
  }

  // User stats
  let userStats: { correct: number; total: number; points: number } | null = null
  if (user) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: row } = await (supabase as any)
      .from("pickem_leaderboard")
      .select("total_points, correct_picks, resolved_picks")
      .eq("user_id", user.id)
      .single() as { data: { total_points: number; correct_picks: number; resolved_picks: number } | null }

    if (row) {
      userStats = {
        points:  row.total_points  ?? 0,
        correct: row.correct_picks ?? 0,
        total:   row.resolved_picks ?? 0,
      }
    }
  }

  // Pick'Em leaderboard top 10
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: leaderboard } = await (supabase as any)
    .from("pickem_leaderboard")
    .select("user_id, username, avatar_url, total_points, correct_picks, resolved_picks, accuracy_pct")
    .limit(10) as {
      data: Array<{
        user_id: string; username: string; avatar_url: string | null
        total_points: number; correct_picks: number; resolved_picks: number; accuracy_pct: number
      }> | null
    }

  // Group matches by phase
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const phases = (tournament?.phases ?? []) as any[]
  const sortedPhases = [...phases].sort((a, b) => a.order_index - b.order_index)

  // Separate live matches first
  const liveMatches      = matches.filter((m) => m.status === "live")
  const scheduledMatches = matches.filter((m) => m.status === "scheduled")
  const completedMatches = matches.filter((m) => m.status === "completed")

  const noMatches = matches.length === 0

  return (
    <div>
      {/* ── Hero ──────────────────────────────────────────── */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0" style={{background:'radial-gradient(ellipse 80% 70% at 80% 40%, rgba(157,111,255,0.15) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 10% 20%, rgba(245,200,66,0.08) 0%, transparent 55%), #07080D'}} />
        <div className="absolute inset-0 grid-fine opacity-35" />
        <div className="absolute top-0 right-1/4 w-72 h-72 rounded-full bg-purple/10 blur-[100px] pointer-events-none animate-glow-pulse" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-purple/25 to-transparent" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-10 pb-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="space-y-3 animate-fade-up">
              <div className="badge-eyebrow">
                <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
                Pick&apos;Em Predictions
              </div>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-text leading-none">
                {tournament?.name
                  ? <span className="text-glow-purple">{tournament.name}</span>
                  : <span className="text-text-muted">No Active Tournament</span>
                }
              </h1>
              <p className="text-text-muted text-sm tracking-wide">
                Predict match winners · <span className="text-gold font-stats">+1 pt</span> per correct pick
              </p>
            </div>

            {/* User stats panel */}
            {userStats && (
              <div className="animate-fade-up-2 shrink-0">
                <div className="card-glow-border card-premium rounded-2xl px-5 py-4 flex items-center gap-5">
                  {[
                    { label: "Points", value: userStats.points, color: "text-gold" },
                    { label: "Correct", value: `${userStats.correct}/${userStats.total}`, color: "text-text" },
                    { label: "Accuracy", value: `${userStats.total > 0 ? Math.round((userStats.correct / userStats.total) * 100) : 0}%`, color: "text-purple" },
                  ].map(({ label, value, color }, i) => (
                    <div key={label} className="flex items-center gap-5">
                      {i > 0 && <div className="w-px h-8 bg-purple/15" />}
                      <div className="text-center">
                        <p className={`font-stats text-xl font-bold ${color}`}>{value}</p>
                        <p className="text-[9px] text-text-muted uppercase tracking-[0.2em] mt-0.5">{label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">

      {!tournament && (
        <div className="py-24 text-center space-y-3">
          <div className="font-display text-5xl text-text-muted/20 tracking-widest">NO TOURNAMENT</div>
          <p className="text-text-muted text-sm">Check back when the next event goes live.</p>
        </div>
      )}

      {tournament && noMatches && (
        <div className="py-24 text-center space-y-3">
          <div className="font-display text-5xl text-text-muted/20 tracking-widest">NO MATCHES</div>
          <p className="text-text-muted text-sm">Matches will appear here once scheduled.</p>
        </div>
      )}

      {tournament && !noMatches && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

          {/* Main — matches */}
          <div className="xl:col-span-2 space-y-8">

            {/* Live */}
            {liveMatches.length > 0 && (
              <section className="space-y-3">
                <h2 className="font-display text-sm text-live uppercase tracking-wide flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-live animate-pulse" />
                  Live Now
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {liveMatches.map((m) => (
                    <PredictionCard
                      key={m.id}
                      matchId={m.id}
                      teamA={m.team_a}
                      teamB={m.team_b}
                      format={m.format}
                      scheduledAt={m.scheduled_at}
                      status={m.status}
                      winnerId={m.winner_id}
                      mapsA={m.team_a_maps_won}
                      mapsB={m.team_b_maps_won}
                      userPickId={picksMap[m.id] ?? null}
                      isLoggedIn={!!user}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Upcoming — grouped by phase */}
            {scheduledMatches.length > 0 && (
              <section className="space-y-6">
                <h2 className="font-display text-sm text-text uppercase tracking-wide flex items-center gap-2">
                  <Target className="h-4 w-4 text-gold" />
                  Upcoming Matches
                </h2>
                {sortedPhases.map((phase) => {
                  const phaseMatches = scheduledMatches.filter((m) => m.phase_id === phase.id)
                  if (phaseMatches.length === 0) return null
                  return (
                    <div key={phase.id} className="space-y-3">
                      <p className="text-xs text-text-muted uppercase tracking-wider px-1">
                        {phase.name}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {phaseMatches.map((m) => (
                          <PredictionCard
                            key={m.id}
                            matchId={m.id}
                            teamA={m.team_a}
                            teamB={m.team_b}
                            format={m.format}
                            scheduledAt={m.scheduled_at}
                            status={m.status}
                            winnerId={m.winner_id}
                            mapsA={m.team_a_maps_won}
                            mapsB={m.team_b_maps_won}
                            userPickId={picksMap[m.id] ?? null}
                            isLoggedIn={!!user}
                          />
                        ))}
                      </div>
                    </div>
                  )
                })}
                {/* Matches without a phase */}
                {(() => {
                  const phaseless = scheduledMatches.filter((m) => !m.phase_id)
                  if (!phaseless.length) return null
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {phaseless.map((m) => (
                        <PredictionCard
                          key={m.id}
                          matchId={m.id}
                          teamA={m.team_a}
                          teamB={m.team_b}
                          format={m.format}
                          scheduledAt={m.scheduled_at}
                          status={m.status}
                          winnerId={m.winner_id}
                          mapsA={m.team_a_maps_won}
                          mapsB={m.team_b_maps_won}
                          userPickId={picksMap[m.id] ?? null}
                          isLoggedIn={!!user}
                        />
                      ))}
                    </div>
                  )
                })()}
              </section>
            )}

            {/* Completed */}
            {completedMatches.length > 0 && (
              <section className="space-y-3">
                <h2 className="font-display text-sm text-text-muted uppercase tracking-wide flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-text-muted" />
                  Results
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {completedMatches.map((m) => (
                    <PredictionCard
                      key={m.id}
                      matchId={m.id}
                      teamA={m.team_a}
                      teamB={m.team_b}
                      format={m.format}
                      scheduledAt={m.scheduled_at}
                      status={m.status}
                      winnerId={m.winner_id}
                      mapsA={m.team_a_maps_won}
                      mapsB={m.team_b_maps_won}
                      userPickId={picksMap[m.id] ?? null}
                      isLoggedIn={!!user}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar — leaderboard */}
          <div className="space-y-4">
            <div className="card-tactical rounded-lg p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-sm text-text uppercase tracking-wide flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-gold" />
                  Leaderboard
                </h2>
              </div>

              {!leaderboard || leaderboard.length === 0 ? (
                <p className="text-sm text-text-muted text-center py-4">
                  No picks yet. Be first!
                </p>
              ) : (
                <ol className="space-y-2">
                  {leaderboard.map((entry, i) => {
                    const isMe = entry.user_id === user?.id
                    return (
                      <li
                        key={entry.user_id ?? i}
                        className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                          isMe ? "bg-gold/8 border border-gold/20" : "hover:bg-white/3"
                        }`}
                      >
                        <span className={`text-xs font-stats font-bold w-5 text-center ${
                          i === 0 ? "text-gold" : i === 1 ? "text-text" : i === 2 ? "text-[#cd7f32]" : "text-text-muted"
                        }`}>
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-text truncate">
                            {entry.username}
                            {isMe && <span className="ml-1 text-gold text-[10px]">you</span>}
                          </p>
                          <p className="text-[10px] text-text-muted">
                            {entry.correct_picks ?? 0}/{entry.resolved_picks ?? 0} correct
                            {" · "}
                            {entry.accuracy_pct ?? 0}%
                          </p>
                        </div>
                        <span className="font-stats text-sm font-bold text-gold shrink-0">
                          {entry.total_points ?? 0}
                        </span>
                      </li>
                    )
                  })}
                </ol>
              )}

              {!user && (
                <div className="pt-2 border-t border-white/8 text-center">
                  <Link
                    href="/login?redirect=/predictions"
                    className="text-xs text-gold hover:underline"
                  >
                    Sign in to make picks →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  )
}
