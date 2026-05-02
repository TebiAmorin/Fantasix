import { createClient } from "@/lib/supabase/server"
import { PhaseTabs } from "@/components/predictions/phase-tabs"
import { LiveRefresh } from "@/components/predictions/live-refresh"
import type { MatchForDisplay, PhaseData, CommunityPicksMap } from "@/components/predictions/phase-tabs"
import { StreakIcon } from "@/components/icons/rank-icons"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Pick'Em — BLAST R6 Major SLC 2026",
  description: "Predict match winners at the BLAST Rainbow Six Major Salt Lake City 2026.",
  openGraph: {
    title: "Pick'Em — BLAST R6 Major SLC 2026",
    description: "Predict match winners at the BLAST Rainbow Six Major Salt Lake City 2026.",
    images: [{ url: "/api/og?title=Pick%27Em&sub=BLAST+R6+Major+%C2%B7+SLC+2026", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/api/og?title=Pick%27Em&sub=BLAST+R6+Major+%C2%B7+SLC+2026"],
  },
}

// ── Phase progress strip ─────────────────────────────────────────────────────

function PhaseProgress({ phases, activePhaseId }: { phases: PhaseData[]; activePhaseId: string | null }) {
  const sorted = [...phases].sort((a, b) => a.order_index - b.order_index)
  if (sorted.length === 0) return null
  const activeIdx = sorted.findIndex(p => p.id === activePhaseId)

  return (
    <div className="flex items-center gap-0">
      {sorted.map((phase, i) => {
        const done    = i < activeIdx
        const current = i === activeIdx

        return (
          <div key={phase.id} className="flex items-center">
            <div className={`relative flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-display font-bold uppercase tracking-widest transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${
              current
                ? "bg-gold/12 text-gold border border-gold/30 shadow-[0_0_12px_rgba(245,200,66,0.2)]"
                : done
                  ? "text-success/50 border border-success/15 bg-success/4"
                  : "text-text-dim/60 border border-white/5 bg-transparent"
            }`}>
              {done ? (
                <svg className="h-2.5 w-2.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              ) : current ? (
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-gold" />
                </span>
              ) : null}
              {phase.name}
            </div>
            {i < sorted.length - 1 && (
              <div className={`w-5 h-px mx-0.5 transition-colors duration-700 ${done ? "bg-success/25" : "bg-white/8"}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────

export default async function PredictionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Active tournament
  const { data: tournament } = await supabase
    .from("tournaments")
    .select("id, name, slug, location, prize_pool, primary_color, phases(id, name, order_index, is_active, description)")
    .eq("is_active", true)
    .single() as unknown as {
      data: {
        id: string; name: string; slug: string
        location: string | null; prize_pool: number | null; primary_color: string | null
        phases: PhaseData[]
      } | null
    }

  const phases: PhaseData[] = (tournament?.phases ?? []).sort((a, b) => a.order_index - b.order_index)
  const activePhase = phases.find(p => p.is_active) ?? null

  // All matches
  const { data: rawMatches } = tournament ? await supabase
    .from("matches")
    .select(`
      id, status, format, scheduled_at,
      team_a_maps_won, team_b_maps_won,
      winner_id, phase_id, round_name,
      team_a:teams!matches_team_a_id_fkey(id, name, short_name, logo_url),
      team_b:teams!matches_team_b_id_fkey(id, name, short_name, logo_url)
    `)
    .eq("tournament_id", tournament.id)
    .neq("status", "cancelled")
    .order("scheduled_at", { ascending: true })
    : { data: null }

  const matches = (rawMatches ?? []) as MatchForDisplay[]

  // User picks
  const picksMap: Record<string, string> = {}
  if (user && matches.length > 0) {
    const { data: picks } = await supabase
      .from("match_predictions")
      .select("match_id, predicted_winner_id")
      .eq("user_id", user.id)
      .in("match_id", matches.map(m => m.id))
    for (const p of picks ?? []) picksMap[p.match_id] = p.predicted_winner_id
  }

  // Community picks aggregate (for % bars on cards)
  const communityPicksMap: CommunityPicksMap = {}
  if (matches.length > 0) {
    const { data: communityRaw } = await supabase
      .from("match_community_picks")
      .select("match_id, predicted_winner_id, pick_count")
      .in("match_id", matches.map(m => m.id))
    for (const row of communityRaw ?? []) {
      if (!communityPicksMap[row.match_id]) communityPicksMap[row.match_id] = {}
      communityPicksMap[row.match_id][row.predicted_winner_id] = row.pick_count
    }
  }

  // User stats
  let userStats: { correct: number; total: number; points: number; streak: number } | null = null
  if (user) {
    const { data: row } = await supabase
      .from("pickem_leaderboard")
      .select("total_points, correct_picks, resolved_picks, current_streak")
      .eq("user_id", user.id)
      .single()
    if (row) userStats = {
      points:  row.total_points   ?? 0,
      correct: row.correct_picks  ?? 0,
      total:   row.resolved_picks ?? 0,
      streak:  row.current_streak ?? 0,
    }
  }

  // Leaderboard
  const { data: leaderboard } = await supabase
    .from("pickem_leaderboard")
    .select("user_id, username, avatar_url, total_points, correct_picks, resolved_picks, accuracy_pct, current_streak")
    .order("total_points", { ascending: false })
    .order("accuracy_pct", { ascending: false })
    .limit(10)

  const liveCount    = matches.filter(m => m.status === "live").length
  const totalPicked  = Object.keys(picksMap).length
  const accuracy     = userStats && userStats.total > 0
    ? Math.round((userStats.correct / userStats.total) * 100)
    : 0

  return (
    <div>
      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden">

        {/* SLC Major atmospheric background */}
        <div className="absolute inset-0 bg-slc-mesh" />

        {/* Diagonal slash texture */}
        <div className="absolute inset-0 slc-slash opacity-100 pointer-events-none" />

        {/* Glowing orbs */}
        <div
          className="absolute -top-16 -left-16 w-96 h-96 rounded-full pointer-events-none animate-event-pulse"
          style={{ background: "rgba(196,30,58,0.18)", filter: "blur(100px)" }}
        />
        <div
          className="absolute -top-8 right-0 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: "rgba(0,212,184,0.10)", filter: "blur(90px)" }}
        />

        {/* Bottom separator line — red to teal */}
        <div className="absolute inset-x-0 bottom-0 h-px"
          style={{ background: "linear-gradient(to right, transparent 0%, rgba(196,30,58,0.5) 25%, rgba(0,212,184,0.35) 75%, transparent 100%)" }} />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 pb-12 sm:pb-14">
          <div className="space-y-5 animate-fade-up">

            {/* Eyebrow row */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Event badge */}
              <div
                className="flex items-center gap-2 rounded-full px-3 py-1.5"
                style={{
                  color: "#C41E3A",
                  borderColor: "rgba(196,30,58,0.3)",
                  background: "rgba(196,30,58,0.10)",
                  border: "1px solid rgba(196,30,58,0.3)",
                }}
              >
                <svg className="h-2.5 w-2.5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                <span className="text-[10px] font-display font-bold uppercase tracking-[0.2em]">
                  BLAST Major · SLC 2026
                </span>
              </div>

              {liveCount > 0 && (
                <span className="flex items-center gap-1.5 text-[10px] font-stats text-live uppercase tracking-widest">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-live opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-live" />
                  </span>
                  {liveCount} live
                </span>
              )}

              <LiveRefresh liveCount={liveCount} intervalSecs={30} />
            </div>

            {/* Heading + subtitle */}
            <div className="space-y-2">
              <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl text-text leading-none tracking-tight">
                Pick<span className="text-gold text-glow-gold">&apos;Em</span>
              </h1>
              <p className="font-display text-sm sm:text-base text-text-muted tracking-wider leading-none">
                <span className="text-[rgba(0,212,184,0.7)]">FORGED THE HARD WAY</span>
                <span className="mx-2 text-white/15">·</span>
                May 8–17, 2026
              </p>
            </div>

            {/* Phase progress strip */}
            {phases.length > 0 && (
              <div className="overflow-x-auto stats-scroll -mx-1 px-1">
                <PhaseProgress phases={phases} activePhaseId={activePhase?.id ?? null} />
              </div>
            )}

            {/* User stats — horizontally scrollable on mobile */}
            {userStats ? (
              <div className="stats-scroll -mx-4 px-4 sm:mx-0 sm:px-0">
                <div
                  className="flex items-center gap-0 rounded-2xl overflow-hidden w-fit"
                  style={{
                    background: "rgba(255,255,255,0.025)",
                    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.07), inset 0 1px 0 rgba(255,255,255,0.05)",
                  }}
                >
                  {[
                    { label: "Points",   value: String(userStats.points),              color: "#F5C842" },
                    { label: "Correct",  value: `${userStats.correct}/${userStats.total}`, color: "#EEF2FF" },
                    { label: "Accuracy", value: `${accuracy}%`,                        color: accuracy >= 60 ? "#34D399" : "rgba(255,255,255,0.45)" },
                    { label: "Streak",   value: String(userStats.streak),              color: userStats.streak >= 2 ? "#F5C842" : "#6B7280", streak: userStats.streak },
                  ].map(({ label, value, color, streak }, i) => (
                    <div key={label} className="flex items-center">
                      {i > 0 && <div className="w-px h-10 bg-white/6 shrink-0" />}
                      <div className="text-center px-5 py-3 min-w-[4.5rem]">
                        <div className="flex items-center justify-center gap-1 font-stats text-lg font-bold tabular-nums leading-none" style={{ color }}>
                          {streak !== undefined && streak >= 2 && (
                            <StreakIcon className="h-3.5 w-3.5 shrink-0" />
                          )}
                          {value}
                        </div>
                        <p className="text-[9px] text-text-muted uppercase tracking-[0.2em] mt-1 font-display">{label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : user ? (
              /* Logged in, zero resolved picks yet */
              <div
                className="flex items-center gap-2.5 rounded-full px-4 py-2.5 w-fit"
                style={{
                  background: "rgba(196,30,58,0.06)",
                  boxShadow: "inset 0 0 0 1px rgba(196,30,58,0.15)",
                }}
              >
                <svg className="h-3 w-3 shrink-0" fill="currentColor" viewBox="0 0 24 24" style={{ color: "rgba(196,30,58,0.7)" }}>
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                <span className="text-xs text-text-muted font-display">
                  {totalPicked > 0
                    ? <><span className="text-gold font-bold font-stats">{totalPicked}</span> pick{totalPicked > 1 ? "s" : ""} locked · waiting for results</>
                    : "Make your first pick to start earning points"}
                </span>
              </div>
            ) : (
              <Link
                href="/login?redirect=/predictions"
                className="group relative flex items-center gap-2.5 rounded-full px-5 py-3 text-xs font-display font-bold uppercase tracking-wider transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97] w-fit touch-target"
                style={{
                  background: "linear-gradient(135deg, rgba(196,30,58,0.92) 0%, rgba(170,15,40,1) 100%)",
                  color: "#FFF",
                  boxShadow: "0 0 0 1px rgba(196,30,58,0.4), 0 4px 20px rgba(196,30,58,0.3)",
                }}
              >
                <svg className="h-3.5 w-3.5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                Sign in to pick
                <div className="h-6 w-6 rounded-full bg-white/15 flex items-center justify-center group-hover:translate-x-0.5 transition-transform duration-300">
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            )}

          </div>
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">

        {!tournament && (
          <div className="py-32 text-center space-y-3">
            <div className="font-display text-5xl text-text-muted/10 tracking-widest">NO TOURNAMENT</div>
            <p className="text-text-muted text-sm">No active tournament found.</p>
          </div>
        )}

        {tournament && (
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_264px] gap-8 items-start">

            {/* Main: phase tabs + match cards */}
            <PhaseTabs
              phases={phases}
              matches={matches}
              picksMap={picksMap}
              isLoggedIn={!!user}
              communityPicksMap={communityPicksMap}
            />

            {/* Sidebar */}
            <aside className="space-y-3 xl:sticky xl:top-8">

              {/* Tournament info */}
              <div
                className="rounded-2xl p-4 space-y-3"
                style={{
                  background: "rgba(255,255,255,0.025)",
                  boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.07), inset 0 1px 0 rgba(255,255,255,0.05)",
                }}
              >
                <p className="text-[9px] text-text-dim uppercase tracking-[0.25em] font-display">Tournament</p>
                <div className="space-y-2.5">
                  {[
                    { label: "Event",     value: tournament.name },
                    { label: "Dates",     value: "May 8–17, 2026" },
                    tournament.location ? { label: "Location", value: tournament.location } : null,
                    tournament.prize_pool ? { label: "Prize Pool", value: `$${tournament.prize_pool.toLocaleString()}`, gold: true } : null,
                    { label: "Matches",   value: String(matches.length) },
                  ].filter(Boolean).map((item) => (
                    <div key={item!.label} className="flex items-start justify-between gap-3 text-xs">
                      <span className="text-text-muted shrink-0">{item!.label}</span>
                      <span className={`text-right leading-tight font-medium ${item!.gold ? "text-gold font-stats font-bold" : "text-text"}`}>
                        {item!.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* How to play */}
              <div
                className="rounded-2xl p-4 space-y-3"
                style={{
                  background: "rgba(245,200,66,0.04)",
                  boxShadow: "inset 0 0 0 1px rgba(245,200,66,0.12)",
                }}
              >
                <p className="text-[9px] text-gold/60 uppercase tracking-[0.25em] font-display">How to Play</p>
                <ul className="space-y-2 text-xs text-text-muted">
                  {[
                    { icon: "01", text: "Pick a winner before match starts" },
                    { icon: "02", text: <><span className="text-gold font-stats font-bold">+1 pt</span> per correct prediction</> },
                    { icon: "03", text: "Picks lock when match goes live" },
                    { icon: "04", text: "Climb the global leaderboard" },
                  ].map(({ icon, text }) => (
                    <li key={icon} className="flex items-start gap-2.5">
                      <span className="font-stats text-[9px] text-gold/40 mt-0.5 tabular-nums shrink-0">{icon}</span>
                      <span>{text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Leaderboard */}
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  background: "rgba(255,255,255,0.025)",
                  boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.07), inset 0 1px 0 rgba(255,255,255,0.05)",
                }}
              >
                <div className="px-4 py-3 flex items-center justify-between border-b border-white/5">
                  <p className="text-[9px] text-text-dim uppercase tracking-[0.25em] font-display">Leaderboard</p>
                  <Link href="/leaderboard" className="text-[10px] text-gold/50 hover:text-gold transition-colors">
                    Full ranking →
                  </Link>
                </div>

                {!leaderboard || leaderboard.length === 0 ? (
                  <div className="px-4 py-8 text-center space-y-1">
                    <p className="text-xs text-text-muted">No picks yet.</p>
                    <Link href="/predictions" className="text-[11px] text-gold/60 hover:text-gold transition-colors">Be first →</Link>
                  </div>
                ) : (
                  <>
                    <ol className="divide-y divide-white/4">
                      {leaderboard.map((entry, i) => {
                        const isMe = entry.user_id === user?.id
                        const rankColor =
                          i === 0 ? "text-gold"
                          : i === 1 ? "text-[#C0C0C0]"
                          : i === 2 ? "text-[#CD7F32]"
                          : "text-text-dim/60"
                        const leftAccent =
                          i === 0 ? "border-l-2 border-gold/40"
                          : i === 1 ? "border-l-2 border-white/20"
                          : i === 2 ? "border-l-2 border-[#CD7F32]/30"
                          : "border-l-2 border-transparent"
                        return (
                          <li
                            key={entry.user_id ?? i}
                            className={`flex items-center gap-2.5 px-4 py-2.5 text-xs transition-all duration-200 ${leftAccent} ${
                              isMe ? "bg-gold/5" : "hover:bg-white/2"
                            }`}
                          >
                            <span className={`font-stats font-bold w-4 text-center shrink-0 text-[11px] tabular-nums ${rankColor}`}>
                              {i + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <p className={`truncate font-medium leading-none ${isMe ? "text-gold" : "text-text"}`}>
                                  {entry.username}
                                  {isMe && <span className="ml-1.5 text-[8px] text-gold/40 font-normal">you</span>}
                                </p>
                                {(entry.current_streak ?? 0) >= 2 && (
                                  <span className="flex items-center gap-0.5 shrink-0">
                                    <StreakIcon className="h-2.5 w-2.5 text-gold/70" />
                                    <span className="font-stats text-[8px] text-gold/60 tabular-nums">{entry.current_streak}</span>
                                  </span>
                                )}
                              </div>
                              <p className="text-[9px] text-text-dim font-stats tabular-nums">
                                {entry.correct_picks ?? 0}/{entry.resolved_picks ?? 0} · {entry.accuracy_pct ?? 0}%
                              </p>
                            </div>
                            <span className={`font-stats font-bold shrink-0 tabular-nums text-[12px] ${i === 0 ? "text-gold" : "text-text-muted"}`}>
                              {entry.total_points ?? 0}
                            </span>
                          </li>
                        )
                      })}
                    </ol>
                    {/* User not in top 10 */}
                    {user && !leaderboard.some(e => e.user_id === user.id) && (
                      <div className="px-4 py-2.5 border-t border-white/5 flex items-center gap-2">
                        <span className="text-[9px] text-text-dim font-stats tabular-nums tracking-widest">···</span>
                        <p className="text-[10px] text-text-muted flex-1">Not ranked yet</p>
                        <Link href="/leaderboard" className="text-[10px] text-gold/50 hover:text-gold transition-colors">
                          See rank →
                        </Link>
                      </div>
                    )}
                  </>
                )}

                {!user && (
                  <div className="px-4 py-3 border-t border-white/5 text-center">
                    <Link
                      href="/login?redirect=/predictions"
                      className="text-[11px] text-gold/70 hover:text-gold transition-colors"
                    >
                      Sign in to make picks →
                    </Link>
                  </div>
                )}
              </div>

            </aside>
          </div>
        )}
      </div>
    </div>
  )
}
