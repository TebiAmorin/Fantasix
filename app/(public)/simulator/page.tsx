import { TournamentSimulator } from "@/components/simulator/tournament-simulator"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Tournament Simulator — Fantasix",
  description: "Simulate the full BLAST R6 Major SLC 2026 — Play-In, Swiss Stage, and Playoffs. Bracket simulator with Buchholz scoring and Dutch seeding.",
  openGraph: {
    title: "Tournament Simulator — Fantasix",
    description: "Simulate the full BLAST R6 Major SLC 2026 bracket — Play-In, Swiss, and Playoffs.",
    images: [{ url: "/api/og?title=Tournament+Simulator&sub=BLAST+R6+Major+%C2%B7+SLC+2026", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/api/og?title=Tournament+Simulator&sub=BLAST+R6+Major+%C2%B7+SLC+2026"],
  },
}

export default async function SimulatorPage() {
  const supabase = await createClient()
  const [
    { data: { user } },
    { data: teamRows },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("teams").select("short_name, name, logo_url").not("logo_url", "is", null),
  ])

  // Build shortName → logoUrl map (lowercase keys for case-insensitive lookup)
  const logoMap: Record<string, string> = {}
  for (const t of teamRows ?? []) {
    if (t.logo_url) {
      if (t.short_name) logoMap[t.short_name.toLowerCase()] = t.logo_url
      if (t.name) logoMap[t.name.toLowerCase()] = t.logo_url
    }
  }

  return (
    <div>
      {/* ── Hero ── */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-slc-mesh" />
        <div className="absolute inset-0 slc-slash opacity-100 pointer-events-none" />

        {/* Orbs */}
        <div className="absolute -top-10 -left-6 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: "rgba(196,30,58,0.16)", filter: "blur(90px)" }} />
        <div className="absolute top-0 right-0 w-60 h-60 rounded-full pointer-events-none"
          style={{ background: "rgba(0,212,184,0.08)", filter: "blur(80px)" }} />
        <div className="absolute bottom-0 left-1/3 w-80 h-16 rounded-full pointer-events-none"
          style={{ background: "rgba(196,30,58,0.06)", filter: "blur(50px)" }} />

        {/* Bottom separator */}
        <div className="absolute inset-x-0 bottom-0 h-px pointer-events-none"
          style={{ background: "linear-gradient(to right, transparent, rgba(196,30,58,0.4), rgba(0,212,184,0.3), transparent)" }} />

        <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 pb-12">
          <div className="space-y-4 animate-fade-up">
            {/* Eyebrow */}
            <div
              className="inline-flex items-center gap-2 rounded-full px-3 py-1.5"
              style={{ color: "#C41E3A", border: "1px solid rgba(196,30,58,0.3)", background: "rgba(196,30,58,0.10)" }}
            >
              <svg className="h-2.5 w-2.5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              <span className="text-[10px] font-display font-bold uppercase tracking-[0.2em]">
                BLAST R6 Major SLC 2026
              </span>
            </div>

            <div>
              <h1 className="font-display text-5xl sm:text-6xl text-text leading-none tracking-tight">
                Tournament <span className="text-slc-red" style={{ textShadow: "0 0 30px rgba(196,30,58,0.5)" }}>Simulator</span>
              </h1>
              <p className="text-text-muted text-sm mt-2 tracking-wide">
                Play-In · Swiss · Playoffs ·{" "}
                <span style={{ color: "rgba(0,212,184,0.6)" }}>FORGED THE HARD WAY</span>
              </p>
            </div>

            {/* Info pills */}
            <div className="flex flex-wrap gap-2 pt-1">
              {[
                {
                  label: "20 Teams",
                  icon: (
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                  ),
                },
                {
                  label: "3 Phases",
                  icon: (
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  ),
                },
                {
                  label: "1 Champion",
                  icon: (
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
                      <path d="M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
                      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
                      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
                    </svg>
                  ),
                },
                {
                  label: "Buchholz",
                  icon: (
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                    </svg>
                  ),
                },
              ].map(({ label, icon }) => (
                <div
                  key={label}
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-display uppercase tracking-wider text-text-muted"
                  style={{ background: "rgba(255,255,255,0.04)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)" }}
                >
                  {icon}
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Simulator ── */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
        <TournamentSimulator logoMap={logoMap} />
      </div>

      {/* ── Auth CTA — only for logged-out visitors ── */}
      {!user && (
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pb-16">
          <div
            className="relative rounded-2xl px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-5 overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(196,30,58,0.08) 0%, rgba(13,14,20,0.95) 60%)",
              boxShadow: "inset 0 0 0 1px rgba(196,30,58,0.2), inset 0 1px 0 rgba(255,255,255,0.05)",
            }}
          >
            {/* BG orb */}
            <div className="absolute -left-12 top-1/2 -translate-y-1/2 w-48 h-48 rounded-full pointer-events-none"
              style={{ background: "rgba(196,30,58,0.12)", filter: "blur(60px)" }} />

            <div className="relative">
              <p className="font-display text-sm sm:text-base text-text uppercase tracking-wide">
                Turn your simulation into real picks
              </p>
              <p className="text-xs text-text-muted mt-1 max-w-sm leading-relaxed">
                Sign in and predict match winners on the Pick&apos;Em page — earn points for every correct call.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0 relative">
              <Link
                href="/predictions"
                className="flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-display font-bold uppercase tracking-wider text-text-muted transition-all duration-300 hover:text-text"
                style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)" }}
              >
                View schedule
              </Link>
              <Link
                href="/login?redirect=/predictions"
                className="flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-display font-bold uppercase tracking-wider transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97]"
                style={{
                  background: "linear-gradient(135deg, rgba(196,30,58,0.92) 0%, rgba(170,15,40,1) 100%)",
                  color: "#FFF",
                  boxShadow: "0 0 0 1px rgba(196,30,58,0.35), 0 4px 16px rgba(196,30,58,0.25)",
                }}
              >
                Sign in to pick
                <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
