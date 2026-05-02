import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import Image from "next/image"
import { CountdownHero } from "@/components/home/countdown-hero"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Fantasix — BLAST R6 Major Pick'Em SLC 2026",
  description: "Predict match winners and climb the global leaderboard at the BLAST Rainbow Six Major Salt Lake City 2026. May 8–17.",
}

export const revalidate = 60

// ── Team logo grid (static for now, populated once logos are uploaded) ────────
const REGIONS = [
  { label: "Europe",      teams: ["G2",  "VP",  "5F"]  },
  { label: "North Am.",   teams: ["WC",  "DZ",  "SHO", "ELV"] },
  { label: "Brazil",      teams: ["FUR", "NIP", "FAZE"] },
  { label: "LATAM/MENA",  teams: ["LOS", "FAL"] },
  { label: "APAC",        teams: ["WBG", "DAY", "CAG", "ENT"] },
  { label: "China",       teams: ["AG",  "EDG", "4AM", "WLV"] },
]

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: tournament } = await (supabase as any)
    .from("tournaments")
    .select("id, name, prize_pool, location")
    .eq("is_active", true)
    .single() as { data: { id: string; name: string; prize_pool: number | null; location: string | null } | null }

  const [
    { data: teams },
    { data: topPicks },
    { data: liveMatches },
  ] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("teams")
      .select("id, short_name, name, logo_url, region")
      .eq("is_active", true)
      .order("region")
      .order("name") as Promise<{ data: Array<{ id: string; short_name: string; name: string; logo_url: string | null; region: string }> | null }>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("pickem_leaderboard")
      .select("user_id, username, avatar_url, total_points, correct_picks, resolved_picks, accuracy_pct")
      .order("total_points", { ascending: false })
      .limit(5) as Promise<{ data: Array<{ user_id: string; username: string; avatar_url: string | null; total_points: number; correct_picks: number; resolved_picks: number; accuracy_pct: number }> | null }>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tournament ? (supabase as any)
      .from("matches")
      .select("id")
      .eq("status", "live")
      .limit(10) as Promise<{ data: Array<{ id: string }> | null }>
      : Promise.resolve({ data: null }),
  ])

  const teamList   = teams ?? []
  const leaderRows = topPicks ?? []
  const liveCount  = liveMatches?.length ?? 0
  const prizePool  = tournament?.prize_pool

  return (
    <div className="overflow-hidden">

      {/* ═══════════════════════════════════════════════════════
          HERO
      ═══════════════════════════════════════════════════════ */}
      <section className="relative min-h-[100dvh] flex flex-col justify-center">

        {/* SLC Major atmospheric layers */}
        <div className="absolute inset-0 bg-slc-mesh" />
        <div className="absolute inset-0 slc-slash pointer-events-none" />

        {/* Orbs */}
        <div
          className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full pointer-events-none animate-event-pulse"
          style={{ background: "rgba(196,30,58,0.16)", filter: "blur(140px)" }}
        />
        <div
          className="absolute top-1/4 right-0 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: "rgba(0,212,184,0.09)", filter: "blur(120px)" }}
        />
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-32 pointer-events-none"
          style={{ background: "rgba(245,200,66,0.07)", filter: "blur(60px)" }}
        />

        {/* Bottom border — red to teal */}
        <div className="absolute inset-x-0 bottom-0 h-px"
          style={{ background: "linear-gradient(to right, transparent 0%, rgba(196,30,58,0.5) 30%, rgba(0,212,184,0.35) 70%, transparent 100%)" }} />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 flex flex-col gap-12">

          {/* Live badge */}
          {liveCount > 0 && (
            <div className="flex justify-center lg:justify-start">
              <Link href="/predictions" className="flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-stats text-live border border-live/25 bg-live/6 hover:bg-live/10 transition-colors">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-live opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-live" />
                </span>
                {liveCount} match{liveCount > 1 ? "es" : ""} live right now — make your picks
                <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          )}

          {/* Main hero layout */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-12 lg:gap-20 items-center">

            {/* Left: copy */}
            <div className="space-y-8 animate-fade-up text-center lg:text-left">

              {/* Eyebrow */}
              <div className="flex justify-center lg:justify-start">
                <div
                  className="inline-flex items-center gap-2 rounded-full px-3 py-1.5"
                  style={{ color: "#C41E3A", border: "1px solid rgba(196,30,58,0.3)", background: "rgba(196,30,58,0.10)" }}
                >
                  <svg className="h-2.5 w-2.5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  <span className="text-[10px] font-display font-bold uppercase tracking-[0.2em]">BLAST R6 Major · Salt Lake City 2026</span>
                </div>
              </div>

              {/* Headline */}
              <div className="space-y-3">
                <h1 className="font-display leading-[0.9] tracking-tight">
                  <span className="block text-[clamp(3rem,10vw,7rem)] text-text">Predict.</span>
                  <span className="block text-[clamp(3rem,10vw,7rem)] text-text">Compete.</span>
                  <span className="block text-[clamp(3rem,10vw,7rem)]">
                    <span className="text-gold text-glow-gold">Dominate.</span>
                  </span>
                </h1>
                <p className="text-text-muted text-sm sm:text-base max-w-xl mx-auto lg:mx-0 leading-relaxed">
                  Pick match winners. Climb the global leaderboard. Compete across 20 teams and 3 phases at the BLAST Major SLC 2026.
                </p>
                <p className="font-display text-xs tracking-[0.25em] text-center lg:text-left" style={{ color: "rgba(0,212,184,0.5)" }}>
                  FORGED THE HARD WAY · MAY 8–17
                </p>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Link
                  href="/predictions"
                  className="group relative flex items-center justify-center gap-2.5 rounded-full px-6 py-3.5 text-sm font-display font-bold uppercase tracking-wider transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97]"
                  style={{
                    background: "linear-gradient(135deg, rgba(245,200,66,0.95) 0%, rgba(245,180,40,1) 100%)",
                    color: "#07080D",
                    boxShadow: "0 0 0 1px rgba(245,200,66,0.4), 0 4px 24px rgba(245,200,66,0.28)",
                  }}
                >
                  <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  Make Predictions
                  <div className="h-7 w-7 rounded-full bg-black/12 flex items-center justify-center group-hover:translate-x-0.5 group-hover:-translate-y-px transition-transform duration-300">
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>

                <Link
                  href="/leaderboard"
                  className="flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-display font-bold uppercase tracking-wider text-text-muted hover:text-text transition-all duration-500"
                  style={{
                    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.1)",
                    background: "rgba(255,255,255,0.04)",
                  }}
                >
                  View Leaderboard
                </Link>
              </div>

              {/* Event stats strip */}
              <div className="flex flex-wrap gap-x-8 gap-y-3 justify-center lg:justify-start pt-2">
                {[
                  { label: "Teams",      value: `${teamList.length || 20}` },
                  { label: "Matches",    value: "60+" },
                  { label: "Prize Pool", value: prizePool ? `$${(prizePool / 1000).toFixed(0)}K` : "$750K" },
                  { label: "Dates",      value: "May 8–17" },
                ].map(({ label, value }) => (
                  <div key={label} className="text-center lg:text-left">
                    <p className="font-stats text-xl font-bold text-text tabular-nums">{value}</p>
                    <p className="text-[9px] text-text-dim uppercase tracking-[0.2em] mt-0.5 font-display">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: countdown + leaderboard */}
            <div className="flex flex-col gap-4 items-center lg:items-end animate-fade-up" style={{ animationDelay: "150ms" }}>

              {/* Countdown card */}
              <div
                className="rounded-2xl p-5 space-y-3 w-full max-w-xs"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.06), 0 20px 60px rgba(0,0,0,0.4)",
                }}
              >
                <p className="text-[9px] text-text-dim uppercase tracking-[0.3em] font-display text-center">
                  {liveCount > 0 ? "Event is live" : "Picks open in"}
                </p>
                <div className="flex justify-center">
                  <CountdownHero />
                </div>
                <p className="text-[10px] text-text-muted text-center font-display tracking-wider">
                  May 8 · Playins start
                </p>
              </div>

              {/* Mini leaderboard */}
              {leaderRows.length > 0 && (
                <div
                  className="rounded-2xl overflow-hidden w-full max-w-xs"
                  style={{
                    background: "rgba(255,255,255,0.025)",
                    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.07)",
                  }}
                >
                  <div className="px-4 py-2.5 border-b border-white/5 flex items-center justify-between">
                    <p className="text-[9px] text-text-dim uppercase tracking-[0.25em] font-display">Top Predictors</p>
                    <Link href="/leaderboard" className="text-[10px] text-gold/50 hover:text-gold transition-colors">
                      Full ranking →
                    </Link>
                  </div>
                  <div className="divide-y divide-white/4">
                    {leaderRows.map((row, i) => {
                      const medals = ["text-gold", "text-[#C0C0C0]", "text-[#CD7F32]"]
                      const isMe = row.user_id === user?.id
                      return (
                        <div key={row.user_id} className={`flex items-center gap-3 px-4 py-2.5 ${isMe ? "bg-gold/5" : ""}`}>
                          <span className={`font-stats text-xs font-bold w-4 text-center shrink-0 ${medals[i] ?? "text-text-dim"}`}>
                            {i + 1}
                          </span>
                          <div className="h-6 w-6 rounded-full bg-purple/15 border border-purple/20 overflow-hidden shrink-0 flex items-center justify-center">
                            {row.avatar_url ? (
                              <Image src={row.avatar_url} alt={row.username} width={24} height={24} className="object-cover" />
                            ) : (
                              <span className="font-display text-purple text-[8px] font-bold">{row.username.slice(0, 2).toUpperCase()}</span>
                            )}
                          </div>
                          <span className={`text-xs flex-1 truncate font-medium ${isMe ? "text-gold" : "text-text"}`}>
                            {row.username}
                          </span>
                          <span className="font-stats text-xs font-bold text-gold tabular-nums shrink-0">{row.total_points} pts</span>
                        </div>
                      )
                    })}
                  </div>
                  {!user && (
                    <div className="px-4 py-3 border-t border-white/5 text-center">
                      <Link href="/login" className="text-[11px] text-gold/60 hover:text-gold transition-colors">
                        Sign in to join →
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* If no picks yet, show sign-up CTA */}
              {leaderRows.length === 0 && !user && (
                <div
                  className="rounded-2xl p-5 space-y-3 text-center w-full max-w-xs"
                  style={{ background: "rgba(255,255,255,0.025)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.07)" }}
                >
                  <p className="text-xs text-text-muted">Be first on the leaderboard</p>
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-display font-bold uppercase tracking-wider transition-all duration-300"
                    style={{ background: "rgba(245,200,66,0.12)", color: "#F5C842", boxShadow: "inset 0 0 0 1px rgba(245,200,66,0.25)" }}
                  >
                    Create account
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          HOW IT WORKS
      ═══════════════════════════════════════════════════════ */}
      <section className="relative py-28">
        <div className="absolute inset-0 grid-fine opacity-[0.12]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-14">

          <div className="text-center space-y-3">
            <div className="badge-eyebrow mx-auto w-fit">How it works</div>
            <h2 className="font-display text-4xl sm:text-5xl text-text tracking-tight leading-tight">
              Pick. Compete. <span className="text-gold">Win.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                step: "01",
                title: "Make your picks",
                desc: "Predict the winner of every match before it starts. Picks lock the moment a match goes live.",
                icon: (
                  <svg className="h-5 w-5 text-gold" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                ),
              },
              {
                step: "02",
                title: "Earn points",
                desc: "Every correct match prediction earns you +1 point. Across 3 phases — Playins, Swiss, Playoffs.",
                icon: (
                  <svg className="h-5 w-5 text-gold" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                  </svg>
                ),
              },
              {
                step: "03",
                title: "Climb the leaderboard",
                desc: "Points accumulate across all phases. The best predictor after the Grand Final wins.",
                icon: (
                  <svg className="h-5 w-5 text-gold" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
                  </svg>
                ),
              },
            ].map(({ step, title, desc, icon }) => (
              <div
                key={step}
                className="relative rounded-[24px] p-1.5"
                style={{ background: "linear-gradient(135deg, rgba(245,200,66,0.15) 0%, rgba(245,200,66,0.02) 60%, transparent 100%)" }}
              >
                <div
                  className="rounded-[18px] p-7 h-full space-y-5 relative overflow-hidden"
                  style={{ background: "rgba(13,14,20,0.98)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)" }}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-[0.05] blur-[50px] pointer-events-none"
                    style={{ background: "rgba(245,200,66,1)", transform: "translate(30%, -30%)" }} />
                  <div className="flex items-center justify-between">
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center"
                      style={{ background: "rgba(245,200,66,0.1)", boxShadow: "inset 0 0 0 1px rgba(245,200,66,0.18)" }}>
                      {icon}
                    </div>
                    <span className="font-stats text-[11px] text-gold/25 font-bold tracking-widest">{step}</span>
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="font-display text-lg text-text tracking-tight">{title}</h3>
                    <p className="text-text-muted text-sm leading-relaxed">{desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center">
            <Link
              href="/predictions"
              className="group inline-flex items-center gap-2.5 rounded-full px-7 py-3.5 text-sm font-display font-bold uppercase tracking-wider transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97]"
              style={{
                background: "linear-gradient(135deg, rgba(245,200,66,0.95) 0%, rgba(245,180,40,1) 100%)",
                color: "#07080D",
                boxShadow: "0 0 0 1px rgba(245,200,66,0.4), 0 4px 20px rgba(245,200,66,0.2)",
              }}
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              Start making picks
              <div className="h-6 w-6 rounded-full bg-black/12 flex items-center justify-center group-hover:translate-x-0.5 group-hover:-translate-y-px transition-transform duration-300">
                <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          20 TEAMS
      ═══════════════════════════════════════════════════════ */}
      <section className="relative py-24 border-t border-white/4">
        <div className="absolute inset-x-0 top-0 h-px"
          style={{ background: "linear-gradient(to right, transparent, rgba(157,111,255,0.2), transparent)" }} />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">

          <div className="text-center space-y-2">
            <div className="badge-eyebrow mx-auto w-fit">The field</div>
            <h2 className="font-display text-3xl sm:text-4xl text-text tracking-tight">
              20 Teams. 6 Regions.
            </h2>
          </div>

          <div className="space-y-8">
            {REGIONS.map(({ label, teams: regionTeams }) => {
              const dbTeams = teamList.filter(t =>
                regionTeams.some(s => t.short_name.toUpperCase() === s.toUpperCase())
              )
              const display = dbTeams.length > 0 ? dbTeams : regionTeams.map(s => ({ id: s, short_name: s, name: s, logo_url: null, region: label }))

              return (
                <div key={label} className="space-y-3">
                  <p className="text-[9px] text-text-dim uppercase tracking-[0.3em] font-display pl-1">{label}</p>
                  <div className="flex flex-wrap gap-2">
                    {display.map(team => (
                      <div
                        key={team.id}
                        className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 transition-all duration-300 hover:bg-white/6"
                        style={{ background: "rgba(255,255,255,0.03)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)" }}
                      >
                        {team.logo_url ? (
                          <Image
                            src={team.logo_url} alt={team.short_name}
                            width={22} height={22}
                            className="object-contain"
                          />
                        ) : (
                          <div className="h-5 w-5 rounded bg-purple/15 border border-purple/20 flex items-center justify-center">
                            <span className="font-display text-purple text-[7px] font-bold leading-none">
                              {team.short_name.slice(0, 2).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <span className="font-display text-xs text-text-muted tracking-wide">{team.short_name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          FINAL CTA
      ═══════════════════════════════════════════════════════ */}
      {!user && (
        <section className="relative py-28 border-t border-white/4">
          <div className="absolute inset-0" style={{
            background: "radial-gradient(ellipse 60% 80% at 50% 50%, rgba(245,200,66,0.05) 0%, transparent 70%), #07080D",
          }} />
          <div className="relative mx-auto max-w-2xl px-4 text-center space-y-8">
            <h2 className="font-display text-4xl sm:text-5xl text-text tracking-tight leading-tight">
              Ready to <span className="text-gold text-glow-gold">compete?</span>
            </h2>
            <p className="text-text-muted text-base">
              Create your free account and start predicting before May 8.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-3 rounded-full px-8 py-4 text-sm font-display font-bold uppercase tracking-wider transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97]"
              style={{
                background: "linear-gradient(135deg, rgba(245,200,66,0.95) 0%, rgba(245,180,40,1) 100%)",
                color: "#07080D",
                boxShadow: "0 0 0 1px rgba(245,200,66,0.4), 0 8px 32px rgba(245,200,66,0.3)",
              }}
            >
              Join for free
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <p className="text-xs text-text-muted/50">No credit card · Free forever</p>
          </div>
        </section>
      )}

    </div>
  )
}
