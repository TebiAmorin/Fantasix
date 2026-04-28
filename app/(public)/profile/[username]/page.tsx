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
    <div>
      {/* ── Hero ─────────────────────────────────────────── */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0" style={{background:'radial-gradient(ellipse 60% 80% at 20% 50%, rgba(157,111,255,0.12) 0%, transparent 60%), radial-gradient(ellipse 40% 60% at 80% 30%, rgba(245,200,66,0.06) 0%, transparent 55%), #07080D'}} />
        <div className="absolute inset-0 grid-fine opacity-30" />
        <div className="absolute top-0 left-1/3 w-64 h-64 rounded-full bg-purple/8 blur-[100px] pointer-events-none animate-glow-pulse" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-purple/20 to-transparent" />

        <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-10 pb-12">
          <div className="flex items-center gap-6 animate-fade-up">
            {/* Avatar — double-bezel */}
            <div className="rounded-[20px] p-px shrink-0" style={{background:'linear-gradient(135deg, rgba(157,111,255,0.4) 0%, rgba(157,111,255,0.05) 100%)'}}>
              <div className="relative h-20 w-20 rounded-[19px] overflow-hidden bg-purple/10">
                {profile.avatar_url ? (
                  <Image src={profile.avatar_url} alt={profile.username} fill className="object-cover" sizes="80px" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <User className="h-9 w-9 text-purple" />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              {isOwn && (
                <div className="badge-eyebrow text-[9px]">
                  <svg className="h-2 w-2" fill="currentColor" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  Your Profile
                </div>
              )}
              <h1 className="font-display text-4xl sm:text-5xl text-text leading-none">
                {profile.username}
              </h1>
              <p className="text-xs text-text-muted tracking-wide">
                Member since {new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────── */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fade-up">
          {[
            { label: "Fantasy Rank",  value: fantasyRank ? `#${fantasyRank}` : "—", color: "text-gold" },
            { label: "Fantasy Pts",   value: fantasyStats?.total_points ?? 0,        color: "text-gold" },
            { label: "Pick'Em Pts",   value: pickemStats?.total_points ?? 0,         color: "text-purple" },
            { label: "Pick Accuracy", value: pickemStats ? `${pickemStats.accuracy_pct ?? 0}%` : "—", color: "text-purple" },
          ].map(({ label, value, color }) => (
            <div key={label} className="card-tactical rounded-xl p-4 space-y-2 text-center">
              <p className={`font-stats text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-[9px] text-text-muted uppercase tracking-[0.2em]">{label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Active roster */}
          <div className="space-y-4">
            <h2 className="font-display text-sm text-text uppercase tracking-wide flex items-center gap-2">
              <Trophy className="h-4 w-4 text-gold" />
              {activePhase ? `Roster — ${activePhase.name}` : "Fantasy Roster"}
            </h2>

            {!activePhase && (
              <p className="text-sm text-text-muted p-6 border border-dashed border-white/8 rounded-xl text-center">
                No active phase right now.
              </p>
            )}

            {activePhase && !roster && (
              <div className="p-6 border border-dashed border-white/8 rounded-xl text-center space-y-3">
                <p className="text-sm text-text-muted">No roster drafted yet.</p>
                {isOwn && (
                  <Link href="/fantasy/draft" className="text-xs text-gold hover:underline">
                    Draft your team →
                  </Link>
                )}
              </div>
            )}

            {roster && (
              <div className="card-tactical rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-white/6 flex items-center justify-between">
                  <p className="text-xs text-text-muted">
                    Budget: <span className="text-text font-stats font-bold">{roster.budget_spent}</span> pts spent
                  </p>
                  <p className="text-xs font-stats font-bold text-gold">{roster.total_points} pts total</p>
                </div>
                <div className="divide-y divide-white/5">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {(roster.fantasy_picks ?? []).map((pick: any) => {
                    const p = pick.players
                    return (
                      <div key={pick.player_id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/2 transition-colors">
                        <div className="h-8 w-8 rounded-lg overflow-hidden bg-purple/15 border border-purple/20 shrink-0 flex items-center justify-center">
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
            <h2 className="font-display text-sm text-text uppercase tracking-wide flex items-center gap-2">
              <Target className="h-4 w-4 text-purple" />
              Recent Predictions
            </h2>

            {predictions.length === 0 && (
              <div className="p-6 border border-dashed border-white/8 rounded-xl text-center space-y-3">
                <p className="text-sm text-text-muted">No resolved predictions yet.</p>
                {isOwn && (
                  <Link href="/predictions" className="text-xs text-purple hover:underline">
                    Make predictions →
                  </Link>
                )}
              </div>
            )}

            {predictions.length > 0 && (
              <div className="card-tactical rounded-xl divide-y divide-white/5 overflow-hidden">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {predictions.map((pred: any) => {
                  const m = pred.matches
                  const correct = pred.is_correct === true
                  return (
                    <div key={pred.id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/2 transition-colors">
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
              <div className="card-tactical rounded-xl px-4 py-3 flex items-center justify-between text-xs">
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
    </div>
  )
}
