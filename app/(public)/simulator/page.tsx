import { TournamentSimulator } from "@/components/simulator/tournament-simulator"
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

export default function SimulatorPage() {
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
                { label: "20 Teams",    icon: "👥" },
                { label: "3 Phases",    icon: "🔄" },
                { label: "1 Champion",  icon: "🏆" },
                { label: "Buchholz",    icon: "📊" },
              ].map(({ label, icon }) => (
                <div
                  key={label}
                  className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-display uppercase tracking-wider text-text-muted"
                  style={{ background: "rgba(255,255,255,0.04)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)" }}
                >
                  <span>{icon}</span>
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Simulator ── */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
        <TournamentSimulator />
      </div>
    </div>
  )
}
