import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Trophy, Target, CheckCircle2, XCircle, User } from "lucide-react"
import type { Metadata } from "next"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>
}): Promise<Metadata> {
  const { username } = await params
  return { title: `${username} — Fantasix` }
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const supabase = await createClient()

  // Load profile
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from("profiles")
    .select("id, username, avatar_url, created_at")
    .eq("username", username)
    .single() as { data: { id: string; username: string; avatar_url: string | null; created_at: string } | null }

  if (!profile) notFound()

  const { data: { user } } = await supabase.auth.getUser()
  const isOwn = user?.id === profile.id

  // Active tournament
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: tournament } = await (supabase as any)
    .from("tournaments")
    .select("id, name, phases(id, name, order_index, is_active)")
    .eq("is_active", true)
    .single() as { data: { id: string; name: string; phases: Array<{ id: string; name: string; order_index: number; is_active: boolean }> } | null }

  // Fantasy stats (leaderboard view)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: fantasyStats } = await (supabase as any)
    .from("fantasy_leaderboard")
    .select("total_points, phases_played")
    .eq("user_id", profile.id)
    .single() as { data: { total_points: number; phases_played: number } | null }

  // Pick'Em stats
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: pickemStats } = await (supabase as any)
    .from("pickem_leaderboard")
    .select("total_points, correct_picks, resolved_picks, accuracy_pct")
    .eq("user_id", profile.id)
    .single() as { data: { total_points: number; correct_picks: number; resolved_picks: number; accuracy_pct: number } | null }

  // Fantasy roster for active phase
  const activePhase = tournament?.phases?.find((p) => p.is_active) ?? null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rawRoster } = activePhase ? await (supabase as any)
    .from("fantasy_rosters")
    .select("id, budget_spent, total_points, fantasy_picks(player_id, points_earned, players(nickname, avatar_url, role, fantasy_cost, teams(short_name, logo_url)))")
    .eq("user_id", profile.id)
    .eq("phase_id", activePhase.id)
    .single() : { data: null }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const roster = rawRoster as any

  // Recent predictions (last 10 resolved)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rawPredictions } = await (supabase as any)
    .from("match_predictions")
    .select(`
      id, is_correct, points_earned,
      predicted_winner:teams!match_predictions_predicted_winner_id_fkey(short_name, logo_url),
      matches(status, format, team_a_maps_won, team_b_maps_won,
        team_a:teams!matches_team_a_id_fkey(short_name, logo_url),
        team_b:teams!matches_team_b_id_fkey(short_name, logo_url),
        winner:teams!matches_winner_id_fkey(short_name))
    `)
    .eq("user_id", profile.id)
    .not("is_correct", "is", null)
    .order("created_at", { ascending: false })
    .limit(10) as { data: any[] | null }

  const predictions = rawPredictions ?? []

  // Fantasy rank — limit to 500 to avoid full table scan in JS
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rankData } = await (supabase as any)
    .from("fantasy_leaderboard")
    .select("user_id, total_points")
    .order("total_points", { ascending: false })
    .limit(500) as { data: Array<{ user_id: string; total_points: number }> | null }

  const fantasyRank = rankData ? rankData.findIndex((r) => r.user_id === profile.id) + 1 : null

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">

      {/* Profile header */}
      <div className="flex items-center gap-5">
        <div className="relative h-16 w-16 rounded-full overflow-hidden border-2 border-purple/30 shrink-0">
          {profile.avatar_url ? (
            <Image src={profile.avatar_url} alt={profile.username} fill className="object-cover" sizes="64px" />
          ) : (
            <div className="h-full w-full bg-purple/20 flex items-center justify-center">
              <User className="h-8 w-8 text-purple" />
            </div>
          )}
        </div>
        <div>
          <h1 className="font-display text-2xl text-text">{profile.username}</h1>
          <p className="text-xs text-text-muted mt-0.5">
            Member since {new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </p>
          {isOwn && (
            <span className="mt-1 inline-block text-[10px] text-gold border border-gold/30 bg-gold/10 rounded px-1.5 py-0.5">
              Your profile
            </span>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Fantasy Rank",
            value: fantasyRank ? `#${fantasyRank}` : "—",
            icon: Trophy, color: "text-gold",
          },
          {
            label: "Fantasy Pts",
            value: fantasyStats?.total_points ?? 0,
            icon: Trophy, color: "text-gold",
          },
          {
            label: "Pick'Em Pts",
            value: pickemStats?.total_points ?? 0,
            icon: Target, color: "text-purple",
          },
          {
            label: "Pick Accuracy",
            value: pickemStats
              ? `${pickemStats.accuracy_pct ?? 0}%`
              : "—",
            icon: Target, color: "text-purple",
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card-tactical rounded-lg p-4 space-y-2">
            <Icon className={`h-4 w-4 ${color}`} />
            <div>
              <p className={`font-stats text-xl font-bold ${color}`}>{value}</p>
              <p className="text-[10px] text-text-muted uppercase tracking-wider mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Active roster */}
        <div className="space-y-4">
          <h2 className="font-display text-base text-text uppercase tracking-wide flex items-center gap-2">
            <Trophy className="h-4 w-4 text-gold" />
            {activePhase ? `Roster — ${activePhase.name}` : "Fantasy Roster"}
          </h2>

          {!activePhase && (
            <p className="text-sm text-text-muted p-4 border border-dashed border-white/10 rounded-lg text-center">
              No active phase right now.
            </p>
          )}

          {activePhase && !roster && (
            <div className="p-4 border border-dashed border-white/10 rounded-lg text-center space-y-2">
              <p className="text-sm text-text-muted">No roster drafted yet.</p>
              {isOwn && (
                <Link href="/fantasy/draft" className="text-xs text-gold hover:underline">
                  Draft your team →
                </Link>
              )}
            </div>
          )}

          {roster && (
            <div className="card-tactical rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-white/8 flex items-center justify-between">
                <p className="text-xs text-text-muted">
                  Budget: <span className="text-text font-stats font-bold">{roster.budget_spent}</span> pts spent
                </p>
                <p className="text-xs font-stats font-bold text-gold">
                  {roster.total_points} pts total
                </p>
              </div>
              <div className="divide-y divide-white/5">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(roster.fantasy_picks ?? []).map((pick: any) => {
                  const p = pick.players
                  return (
                    <div key={pick.player_id} className="flex items-center gap-3 px-4 py-3">
                      <div className="h-8 w-8 rounded overflow-hidden bg-purple/20 border border-purple/20 shrink-0 flex items-center justify-center">
                        {p?.avatar_url ? (
                          <Image src={p.avatar_url} alt={p.nickname} width={32} height={32} className="object-cover" />
                        ) : (
                          <span className="font-display text-purple text-xs">{p?.nickname?.slice(0,2).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text truncate">{p?.nickname}</p>
                        <p className="text-xs text-text-muted">
                          {p?.teams?.short_name ?? "—"}
                          {p?.role ? ` · ${p.role}` : ""}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-stats text-sm font-bold text-gold">{pick.points_earned} pts</p>
                        <p className="text-[10px] text-text-muted">{p?.fantasy_cost}c</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Recent predictions */}
        <div className="space-y-4">
          <h2 className="font-display text-base text-text uppercase tracking-wide flex items-center gap-2">
            <Target className="h-4 w-4 text-purple" />
            Recent Predictions
          </h2>

          {predictions.length === 0 && (
            <div className="p-4 border border-dashed border-white/10 rounded-lg text-center space-y-2">
              <p className="text-sm text-text-muted">No resolved predictions yet.</p>
              {isOwn && (
                <Link href="/predictions" className="text-xs text-purple hover:underline">
                  Make predictions →
                </Link>
              )}
            </div>
          )}

          {predictions.length > 0 && (
            <div className="card-tactical rounded-lg divide-y divide-white/5 overflow-hidden">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {predictions.map((pred: any) => {
                const m = pred.matches
                const correct = pred.is_correct === true
                return (
                  <div key={pred.id} className="flex items-center gap-3 px-4 py-3">
                    {correct ? (
                      <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-danger shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text truncate">
                        <span className="text-text-muted">{m?.team_a?.short_name}</span>
                        <span className="text-text-muted mx-1 font-stats">vs</span>
                        <span className="text-text-muted">{m?.team_b?.short_name}</span>
                      </p>
                      <p className="text-xs text-text-muted">
                        Pick: <span className={correct ? "text-success" : "text-danger"}>
                          {pred.predicted_winner?.short_name}
                        </span>
                        {m?.status === "completed" && (
                          <span className="ml-1 font-stats">
                            · {m.team_a_maps_won}–{m.team_b_maps_won}
                          </span>
                        )}
                      </p>
                    </div>
                    <span className={`font-stats text-sm font-bold shrink-0 ${correct ? "text-gold" : "text-text-muted"}`}>
                      {correct ? "+1" : "0"}
                    </span>
                  </div>
                )
              })}
            </div>
          )}

          {pickemStats && pickemStats.resolved_picks > 0 && (
            <div className="card-tactical rounded-lg px-4 py-3 flex items-center justify-between text-xs">
              <span className="text-text-muted">
                {pickemStats.correct_picks}/{pickemStats.resolved_picks} correct
              </span>
              <span className="font-stats font-bold text-purple">
                {pickemStats.accuracy_pct ?? 0}% accuracy
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
