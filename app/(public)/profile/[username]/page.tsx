import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { User } from "lucide-react"
import { PickCorrectIcon, PickWrongIcon, TargetIcon, StreakIcon } from "@/components/icons/rank-icons"
import type { Metadata } from "next"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>
}): Promise<Metadata> {
  const { username } = await params
  return {
    title: `${username} — Fantasix`,
    description: `${username}'s Pick'Em stats and predictions at BLAST R6 Major SLC 2026.`,
    openGraph: {
      title: `${username} on Fantasix`,
      description: `${username}'s Pick'Em stats at BLAST R6 Major SLC 2026.`,
      type: "profile",
      images: [{ url: `/picks/${username}/opengraph-image`, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${username} on Fantasix`,
      images: [`/picks/${username}/opengraph-image`],
    },
  }
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const supabase = await createClient()

  // Load profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, avatar_url, created_at")
    .eq("username", username)
    .single()

  if (!profile) notFound()

  const { data: { user } } = await supabase.auth.getUser()
  const isOwn = user?.id === profile.id

  // Pick'Em stats
  const { data: pickemStats } = await supabase
    .from("pickem_leaderboard")
    .select("total_points, correct_picks, resolved_picks, accuracy_pct, current_streak")
    .eq("user_id", profile.id)
    .single()

  // Pick'Em rank — count how many users score strictly higher
  let pickemRank: number | null = null
  if (pickemStats) {
    const { count } = await supabase
      .from("pickem_leaderboard")
      .select("*", { count: "exact", head: true })
      .gt("total_points", pickemStats.total_points)
    pickemRank = (count ?? 0) + 1
  }

  // Phase breakdown (all resolved picks grouped by phase)
  type PhaseBreakdown = { id: string; name: string; order_index: number; correct: number; total: number }
  const { data: rawPhaseData } = await supabase
    .from("match_predictions")
    .select(`
      is_correct,
      match:matches(
        phase:phases(id, name, order_index)
      )
    `)
    .eq("user_id", profile.id)
    .not("is_correct", "is", null) as unknown as {
      data: Array<{
        is_correct: boolean
        match: { phase: { id: string; name: string; order_index: number } | null } | null
      }> | null
    }

  const phaseMap = new Map<string, PhaseBreakdown>()
  for (const pred of rawPhaseData ?? []) {
    const phase = pred.match?.phase
    if (!phase) continue
    const existing = phaseMap.get(phase.id)
    if (existing) {
      existing.total++
      if (pred.is_correct) existing.correct++
    } else {
      phaseMap.set(phase.id, {
        id: phase.id,
        name: phase.name,
        order_index: phase.order_index,
        correct: pred.is_correct ? 1 : 0,
        total: 1,
      })
    }
  }
  const phaseBreakdown = Array.from(phaseMap.values())
    .sort((a, b) => a.order_index - b.order_index)

  // Recent predictions (last 10 resolved)
  type PredRow = {
    id: string; is_correct: boolean | null; points_earned: number
    predicted_winner: { short_name: string; logo_url: string | null } | null
    matches: {
      status: string; format: string; team_a_maps_won: number; team_b_maps_won: number
      team_a: { short_name: string; logo_url: string | null } | null
      team_b: { short_name: string; logo_url: string | null } | null
      winner: { short_name: string } | null
    } | null
  }
  const { data: rawPredictions } = await supabase
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
    .limit(10) as unknown as { data: PredRow[] | null }

  const predictions = rawPredictions ?? []

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────── */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-slc-mesh" />
        <div className="absolute inset-0 slc-slash opacity-100 pointer-events-none" />
        <div className="absolute -top-12 left-0 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: "rgba(196,30,58,0.10)", filter: "blur(90px)" }} />
        <div className="absolute -top-8 right-0 w-56 h-56 rounded-full pointer-events-none"
          style={{ background: "rgba(0,212,184,0.06)", filter: "blur(70px)" }} />
        <div className="absolute inset-x-0 bottom-0 h-px"
          style={{ background: "linear-gradient(to right, transparent, rgba(196,30,58,0.3), rgba(0,212,184,0.15), transparent)" }} />

        <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-8 pb-12">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-[10px] text-text-dim mb-6" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-text-muted transition-colors">Home</Link>
            <span>/</span>
            <Link href="/leaderboard" className="hover:text-text-muted transition-colors">Leaderboard</Link>
            <span>/</span>
            <span className="text-text-muted">{profile.username}</span>
          </nav>

          <div className="flex items-center gap-6 animate-fade-up">
            {/* Avatar */}
            <div className="p-px shrink-0" style={{ background: "linear-gradient(135deg, rgba(196,30,58,0.45) 0%, rgba(196,30,58,0.05) 100%)", borderRadius: 4 }}>
              <div className="relative h-20 w-20 overflow-hidden bg-red/8" style={{ borderRadius: 3 }}>
                {profile.avatar_url ? (
                  <Image src={profile.avatar_url} alt={profile.username} fill className="object-cover" sizes="80px" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <User className="h-9 w-9 text-red" />
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
              <Link
                href={`/picks/${profile.username}`}
                className="inline-flex items-center gap-1.5 text-[10px] text-text-dim hover:text-text-muted transition-colors mt-1"
              >
                <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                  <polyline points="16 6 12 2 8 6"/>
                  <line x1="12" y1="2" x2="12" y2="15"/>
                </svg>
                {isOwn ? "Share my picks" : "View pick card"}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────── */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Stats row */}
        <div
          className="rounded-2xl overflow-hidden animate-fade-up"
          style={{
            background: "rgba(255,255,255,0.025)",
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.07), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 divide-x-0 sm:divide-x divide-white/6">
            {[
              {
                value: pickemRank ? `#${pickemRank}` : "—",
                label: "Rank",
                color: "text-gold",
                glow: pickemRank === 1,
              },
              {
                value: String(pickemStats?.total_points ?? 0),
                label: "Points",
                color: "text-gold",
              },
              {
                value: pickemStats ? `${pickemStats.accuracy_pct ?? 0}%` : "—",
                label: "Accuracy",
                color: (pickemStats?.accuracy_pct ?? 0) >= 60 ? "text-success" : "text-text",
              },
              {
                value: String(pickemStats?.current_streak ?? 0),
                label: "Streak",
                color: (pickemStats?.current_streak ?? 0) >= 2 ? "text-gold" : "text-text-muted",
                streak: (pickemStats?.current_streak ?? 0) >= 2,
              },
            ].map(({ value, label, color, glow, streak }, i) => (
              <div
                key={label}
                className={`relative flex flex-col items-center justify-center gap-1.5 py-5 px-4 ${
                  i % 2 === 0 ? "border-r border-white/6 sm:border-r-0" : ""
                }`}
                style={
                  glow
                    ? { background: "radial-gradient(ellipse 60% 80% at 50% 100%, rgba(245,200,66,0.06) 0%, transparent 100%)" }
                    : streak
                    ? { background: "radial-gradient(ellipse 60% 80% at 50% 100%, rgba(245,200,66,0.04) 0%, transparent 100%)" }
                    : {}
                }
              >
                <div className="flex items-center gap-1.5">
                  {streak && <StreakIcon className="h-4 w-4 text-gold" />}
                  <p className={`font-stats text-2xl font-bold tabular-nums leading-none ${color}`}>{value}</p>
                </div>
                <p className="text-[9px] text-text-muted uppercase tracking-[0.2em] font-display">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Phase breakdown */}
        {phaseBreakdown.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-display text-sm text-text uppercase tracking-wide flex items-center gap-2">
              <svg className="h-3.5 w-3.5 text-text-muted" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M3 3h18v18H3z" opacity=".1" fill="currentColor" stroke="none"/>
                <path d="M9 3v18M15 3v18M3 9h18M3 15h18"/>
              </svg>
              Phase Breakdown
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {phaseBreakdown.map(phase => {
                const accuracy = phase.total > 0 ? Math.round((phase.correct / phase.total) * 100) : 0
                const barColor = accuracy >= 75
                  ? "from-success/80 to-success/40"
                  : accuracy >= 50
                  ? "from-gold/70 to-gold/30"
                  : "from-text-dim/60 to-text-dim/30"
                return (
                  <div
                    key={phase.id}
                    className="rounded-xl p-4 space-y-3"
                    style={{ background: "rgba(255,255,255,0.025)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.07)" }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-display text-xs text-text uppercase tracking-wide">{phase.name}</span>
                      <span className="font-stats text-xs text-text-muted tabular-nums">
                        {phase.correct}/{phase.total}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-700`}
                          style={{ width: `${accuracy}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] font-stats">
                        <span className="text-text-dim">{accuracy}% accuracy</span>
                        <span className={`flex items-center gap-0.5 ${accuracy >= 75 ? "text-success" : accuracy >= 50 ? "text-gold/70" : "text-text-dim"}`}>
                          {accuracy >= 75 && (
                            <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.66 11.2c-.23-.3-.51-.56-.77-.82-.67-.6-1.43-1.03-2.07-1.66C13.33 7.26 13 4.85 13.95 3c-.95.23-1.78.75-2.49 1.32-2.59 2.08-3.61 5.75-2.39 8.9.04.1.08.2.08.33 0 .22-.15.42-.35.5-.23.1-.47.04-.66-.12a.58.58 0 0 1-.14-.17c-1.13-1.43-1.31-3.48-.55-5.12C5.78 10 4.87 12.3 5 14.47c.06.5.12 1 .29 1.5.14.6.41 1.2.71 1.73 1.08 1.73 2.95 2.97 4.96 3.22 2.14.27 4.43-.12 6.07-1.6 1.83-1.66 2.47-4.32 1.53-6.6l-.13-.26c-.21-.46-.77-1.26-.77-1.26m-3.16 6.3c-.28.24-.74.5-1.1.6-1.12.4-2.24-.16-2.9-.82 1.19-.28 1.9-1.16 2.11-2.05.17-.8-.15-1.46-.28-2.23-.12-.74-.1-1.37.17-2.06.19.38.39.76.63 1.06.77 1 1.98 1.44 2.24 2.8.04.14.06.28.06.43.03.82-.33 1.72-.93 2.27z"/></svg>
                          )}
                          {accuracy >= 75 ? "Hot" : accuracy >= 50 ? "Solid" : "Rough"}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Recent predictions */}
        <div className="space-y-4">
          <h2 className="font-display text-sm text-text uppercase tracking-wide flex items-center gap-2">
            <TargetIcon className="h-4 w-4 text-text-muted" />
            Recent Predictions
          </h2>

          {predictions.length === 0 && (
            <div
              className="p-8 rounded-2xl text-center space-y-3"
              style={{ background: "rgba(255,255,255,0.02)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)" }}
            >
              <div className="h-10 w-10 rounded-xl mx-auto flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.04)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.07)" }}>
                <svg className="h-5 w-5 text-text-dim" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <p className="text-sm text-text-muted">No resolved predictions yet.</p>
              {isOwn && (
                <Link
                  href="/predictions"
                  className="inline-flex items-center gap-1.5 text-xs text-gold/70 hover:text-gold transition-colors"
                >
                  Make your first pick →
                </Link>
              )}
            </div>
          )}

          {predictions.length > 0 && (
            <div
              className="rounded-2xl overflow-hidden divide-y divide-white/5"
              style={{
                background: "rgba(255,255,255,0.02)",
                boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.07)",
              }}
            >
              {predictions.map((pred) => {
                const m = pred.matches
                const correct = pred.is_correct === true
                return (
                  <div
                    key={pred.id}
                    className={`flex items-center gap-3 px-4 py-3.5 transition-all duration-200 ${
                      correct ? "hover:bg-success/3" : "hover:bg-white/2"
                    }`}
                  >
                    {/* Result indicator */}
                    <div
                      className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${
                        correct ? "bg-success/10" : "bg-danger/8"
                      }`}
                      style={{ boxShadow: `inset 0 0 0 1px ${correct ? "rgba(52,211,153,0.2)" : "rgba(240,90,90,0.15)"}` }}
                    >
                      {correct ? (
                        <PickCorrectIcon className="h-3.5 w-3.5 text-success" />
                      ) : (
                        <PickWrongIcon className="h-3.5 w-3.5 text-danger" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text truncate font-display tracking-wide">
                        {m?.team_a?.short_name}
                        <span className="text-text-dim mx-1.5 text-xs">vs</span>
                        {m?.team_b?.short_name}
                      </p>
                      <p className="text-[11px] text-text-muted mt-0.5">
                        Picked <span className={`font-medium ${correct ? "text-success" : "text-danger"}`}>
                          {pred.predicted_winner?.short_name}
                        </span>
                        {m?.status === "completed" && (
                          <span className="ml-1.5 font-stats text-text-dim">
                            · {m.team_a_maps_won}–{m.team_b_maps_won}
                          </span>
                        )}
                      </p>
                    </div>

                    <div
                      className={`font-stats text-sm font-bold shrink-0 tabular-nums px-2.5 py-1 rounded-lg ${
                        correct ? "text-gold" : "text-text-dim"
                      }`}
                      style={{
                        background: correct ? "rgba(245,200,66,0.08)" : "rgba(255,255,255,0.03)",
                        boxShadow: `inset 0 0 0 1px ${correct ? "rgba(245,200,66,0.15)" : "rgba(255,255,255,0.05)"}`,
                      }}
                    >
                      {correct ? "+1" : "0"}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {pickemStats && (pickemStats.resolved_picks ?? 0) > 0 && (
            <div
              className="rounded-xl px-4 py-3 flex items-center justify-between text-xs"
              style={{ background: "rgba(255,255,255,0.02)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)" }}
            >
              <span className="text-text-muted">
                {pickemStats.correct_picks ?? 0}/{pickemStats.resolved_picks ?? 0} correct
              </span>
              <Link
                href={`/picks/${profile.username}`}
                className="font-stats font-bold text-gold hover:text-gold/80 transition-colors flex items-center gap-1"
              >
                View all picks
                <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
