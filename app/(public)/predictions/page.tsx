import { createClient } from "@/lib/supabase/server"
import { PhaseTabs } from "@/components/predictions/phase-tabs"
import type { MatchForDisplay, PhaseData } from "@/components/predictions/phase-tabs"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Pick'Em — BLAST R6 Major SLC 2026",
  description: "Predict match winners at the BLAST Rainbow Six Major Salt Lake City 2026.",
}

// ── Phase progress indicator (server component) ──────────────────────────────

function PhaseProgress({ phases, activePhaseId }: { phases: PhaseData[]; activePhaseId: string | null }) {
  const sorted = [...phases].sort((a, b) => a.order_index - b.order_index)
  if (sorted.length === 0) return null
  const activeIdx = sorted.findIndex(p => p.id === activePhaseId)

  return (
    <div className="flex items-center gap-0 shrink-0">
      {sorted.map((phase, i) => {
        const done    = i < activeIdx
        const current = i === activeIdx
        const future  = i > activeIdx
        return (
          <div key={phase.id} className="flex items-center">
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-display font-bold uppercase tracking-widest transition-all ${
              current ? "bg-gold/15 text-gold border border-gold/30"
              : done   ? "text-success/60 border border-success/20 bg-success/5"
              : "text-text-dim border border-white/6 bg-white/2"
            }`}>
              {done && (
                <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              )}
              {current && <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />}
              {phase.name}
            </div>
            {i < sorted.length - 1 && (
              <div className={`w-4 h-px mx-0.5 ${done ? "bg-success/30" : "bg-white/8"}`} />
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: tournament } = await (supabase as any)
    .from("tournaments")
    .select("id, name, slug, location, prize_pool, primary_color, phases(id, name, order_index, is_active, description)")
    .eq("is_active", true)
    .single() as {
      data: {
        id: string; name: string; slug: string
        location: string | null; prize_pool: number | null; primary_color: string | null
        phases: PhaseData[]
      } | null
    }

  const phases: PhaseData[] = (tournament?.phases ?? []).sort((a, b) => a.order_index - b.order_index)
  const activePhase = phases.find(p => p.is_active) ?? null

  // All matches
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rawMatches } = tournament ? await (supabase as any)
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: picks } = await (supabase as any)
      .from("match_predictions")
      .select("match_id, predicted_winner_id")
      .eq("user_id", user.id)
      .in("match_id", matches.map(m => m.id))
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
      userStats = { points: row.total_points ?? 0, correct: row.correct_picks ?? 0, total: row.resolved_picks ?? 0 }
    }
  }

  // Leaderboard top 10
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

  const liveCount = matches.filter(m => m.status === "live").length

  return (
    <div>
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden">
        {/* Layered atmospheric bg — SLC blue + purple + gold */}
        <div
          className="absolute inset-0"
          style={{
            background: [
              "radial-gradient(ellipse 70% 80% at 0% 50%, rgba(0,163,224,0.10) 0%, transparent 60%)",
              "radial-gradient(ellipse 60% 50% at 100% 20%, rgba(157,111,255,0.12) 0%, transparent 55%)",
              "radial-gradient(ellipse 50% 40% at 50% 100%, rgba(245,200,66,0.06) 0%, transparent 50%)",
              "#07080D",
            ].join(", "),
          }}
        />
        <div className="absolute inset-0 grid-fine opacity-30" />
        {/* Blue orb top-left */}
        <div className="absolute -top-16 -left-16 w-80 h-80 rounded-full opacity-20 blur-[100px] pointer-events-none animate-glow-pulse"
          style={{ background: "rgba(0,163,224,0.6)" }} />
        {/* Purple orb right */}
        <div className="absolute top-8 right-1/4 w-64 h-64 rounded-full bg-purple/10 blur-[80px] pointer-events-none" />
        {/* Bottom accent line */}
        <div className="absolute inset-x-0 bottom-0 h-px"
          style={{ background: "linear-gradient(to right, transparent, rgba(0,163,224,0.4), rgba(245,200,66,0.25), transparent)" }} />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-10 pb-14">
          <div className="space-y-5 animate-fade-up">

            {/* Eyebrow */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="badge-eyebrow" style={{color:"#00A3E0", borderColor:"rgba(0,163,224,0.3)", background:"rgba(0,163,224,0.08)"}}>
                <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                BLAST Major · SLC 2026
              </div>
              {liveCount > 0 && (
                <span className="flex items-center gap-1.5 text-[10px] font-stats text-live uppercase tracking-widest">
                  <span className="h-1.5 w-1.5 rounded-full bg-live animate-pulse" />
                  {liveCount} match{liveCount > 1 ? "es" : ""} live
                </span>
              )}
            </div>

            {/* Main heading */}
            <div className="space-y-1">
              <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl text-text leading-none">
                Pick<span className="text-gold text-glow-gold">&apos;Em</span>
              </h1>
              <p className="font-display text-base sm:text-lg text-text-muted tracking-wider leading-none">
                Rainbow Six · {tournament?.location ?? "Salt Lake City"} · May 8–17, 2026
              </p>
            </div>

            {/* Phase progress + user stats */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
              {phases.length > 0 && (
                <PhaseProgress phases={phases} activePhaseId={activePhase?.id ?? null} />
              )}

              {/* User stats pill */}
              {userStats ? (
                <div className="card-glow-border card-premium rounded-2xl px-5 py-3.5 flex items-center gap-5 w-fit">
                  {[
                    { label: "Points", value: userStats.points, color: "text-gold" },
                    { label: "Correct", value: `${userStats.correct}/${userStats.total}`, color: "text-text" },
                    { label: "Accuracy", value: `${userStats.total > 0 ? Math.round((userStats.correct / userStats.total) * 100) : 0}%`, color: "text-purple" },
                  ].map(({ label, value, color }, i) => (
                    <div key={label} className="flex items-center gap-5">
                      {i > 0 && <div className="w-px h-7 bg-white/8" />}
                      <div className="text-center">
                        <p className={`font-stats text-lg font-bold ${color}`}>{value}</p>
                        <p className="text-[9px] text-text-muted uppercase tracking-[0.2em] mt-0.5">{label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : !user ? (
                <Link
                  href="/login?redirect=/predictions"
                  className="btn-primary h-10 px-5 text-xs flex items-center gap-2 w-fit"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  Sign in to pick
                </Link>
              ) : null}
            </div>

          </div>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">

        {!tournament && (
          <div className="py-24 text-center space-y-3">
            <div className="font-display text-5xl text-text-muted/15 tracking-widest">NO TOURNAMENT</div>
            <p className="text-text-muted text-sm">No active tournament found.</p>
          </div>
        )}

        {tournament && (
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-8 items-start">

            {/* ── Main: phase tabs + match cards ── */}
            <PhaseTabs
              phases={phases}
              matches={matches}
              picksMap={picksMap}
              isLoggedIn={!!user}
            />

            {/* ── Sidebar ── */}
            <aside className="space-y-4 xl:sticky xl:top-8">

              {/* Tournament info card */}
              <div className="card-tactical rounded-xl p-4 space-y-3">
                <p className="text-[9px] text-text-muted uppercase tracking-[0.2em] font-display">Tournament</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-muted">Event</span>
                    <span className="text-text font-medium text-right leading-tight max-w-[160px]">{tournament.name}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-muted">Dates</span>
                    <span className="text-text font-stats">May 8–17, 2026</span>
                  </div>
                  {tournament.location && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-text-muted">Location</span>
                      <span className="text-text">{tournament.location}</span>
                    </div>
                  )}
                  {tournament.prize_pool && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-text-muted">Prize Pool</span>
                      <span className="font-stats font-bold text-gold">${tournament.prize_pool.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-muted">Matches</span>
                    <span className="font-stats text-text">{matches.length}</span>
                  </div>
                </div>
              </div>

              {/* How to play */}
              <div className="rounded-xl p-4 border border-gold/15 bg-gold/4 space-y-2">
                <p className="text-[9px] text-gold/70 uppercase tracking-[0.2em] font-display">How to Play</p>
                <ul className="space-y-1.5 text-xs text-text-muted">
                  <li className="flex items-start gap-2">
                    <span className="text-gold mt-0.5">→</span>
                    Pick a winner before match starts
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gold mt-0.5">→</span>
                    <span><span className="text-gold font-stats font-bold">+1 pt</span> per correct prediction</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gold mt-0.5">→</span>
                    Climb the global leaderboard
                  </li>
                </ul>
              </div>

              {/* Leaderboard */}
              <div className="card-tactical rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[9px] text-text-muted uppercase tracking-[0.2em] font-display">Leaderboard</p>
                  <svg className="h-3 w-3 text-gold" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>

                {!leaderboard || leaderboard.length === 0 ? (
                  <p className="text-xs text-text-muted text-center py-4">
                    No picks yet. Be first!
                  </p>
                ) : (
                  <ol className="space-y-1">
                    {leaderboard.map((entry, i) => {
                      const isMe = entry.user_id === user?.id
                      const medal = i === 0 ? "text-gold" : i === 1 ? "text-[#C0C0C0]" : i === 2 ? "text-[#CD7F32]" : "text-text-dim"
                      return (
                        <li
                          key={entry.user_id ?? i}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors text-xs ${
                            isMe ? "bg-gold/8 border border-gold/20" : "hover:bg-white/3"
                          }`}
                        >
                          <span className={`font-stats font-bold w-4 text-center shrink-0 ${medal}`}>
                            {i + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className={`truncate font-medium ${isMe ? "text-gold" : "text-text"}`}>
                              {entry.username}
                              {isMe && <span className="ml-1 text-[9px] text-gold/60">you</span>}
                            </p>
                            <p className="text-[10px] text-text-dim font-stats">
                              {entry.correct_picks ?? 0}/{entry.resolved_picks ?? 0}
                              {" · "}{entry.accuracy_pct ?? 0}%
                            </p>
                          </div>
                          <span className="font-stats font-bold text-gold shrink-0">
                            {entry.total_points ?? 0}
                          </span>
                        </li>
                      )
                    })}
                  </ol>
                )}

                {!user && (
                  <div className="pt-2 border-t border-white/6 text-center">
                    <Link
                      href="/login?redirect=/predictions"
                      className="text-xs text-gold hover:underline transition-colors"
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
