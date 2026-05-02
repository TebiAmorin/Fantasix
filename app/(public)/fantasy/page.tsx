import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Fantasy League — Coming Soon · Fantasix",
  description: "Fantasy draft for BLAST R6 Major. Pick your 5 players, set your roster, earn points from real in-game stats.",
}

const FEATURES = [
  {
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    title: "Draft 5 Players",
    desc: "Build your roster within a salary cap. Every player has a cost — spend wisely.",
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
    title: "Real Stats, Real Points",
    desc: "Kills, clutches, plants, defuses. Every action on the server earns your fantasy team points.",
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>
    ),
    title: "3 Phases, 3 Drafts",
    desc: "Full redraft before Playins, Swiss and Playoffs. Adapt your roster as teams get eliminated.",
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
        <path d="M8 21h8M12 17v4"/>
      </svg>
    ),
    title: "Global Leaderboard",
    desc: "Points accumulate across all phases. The top manager after the Grand Final wins.",
  },
]

const SCORING = [
  { pts: "+2", stat: "Kill" },
  { pts: "−1", stat: "Death" },
  { pts: "+4", stat: "Entry kill" },
  { pts: "+4", stat: "Plant / Defuse" },
  { pts: "+3×", stat: "Clutch (per enemy)" },
  { pts: "+10×", stat: "KOST rating" },
]

export default function FantasyComingSoonPage() {
  return (
    <div className="overflow-hidden">

      {/* ── Hero ── */}
      <section className="relative min-h-[100dvh] flex flex-col justify-center">

        {/* Background */}
        <div className="absolute inset-0" style={{
          background: [
            "radial-gradient(ellipse 70% 80% at 0% 50%, rgba(157,111,255,0.13) 0%, transparent 55%)",
            "radial-gradient(ellipse 50% 60% at 100% 20%, rgba(245,200,66,0.07) 0%, transparent 50%)",
            "radial-gradient(ellipse 60% 40% at 50% 110%, rgba(157,111,255,0.06) 0%, transparent 55%)",
            "#07080D",
          ].join(", "),
        }} />
        <div className="absolute inset-0 grid-fine opacity-[0.15]" />

        {/* Orbs */}
        <div className="absolute -top-20 -left-20 w-[450px] h-[450px] rounded-full opacity-[0.11] blur-[130px] pointer-events-none animate-glow-pulse"
          style={{ background: "rgba(157,111,255,1)" }} />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full opacity-[0.07] blur-[100px] pointer-events-none"
          style={{ background: "rgba(245,200,66,0.9)" }} />

        {/* Bottom line */}
        <div className="absolute inset-x-0 bottom-0 h-px"
          style={{ background: "linear-gradient(to right, transparent, rgba(157,111,255,0.35), rgba(245,200,66,0.2), transparent)" }} />

        <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-24 text-center space-y-10">

          {/* Badge */}
          <div className="flex justify-center">
            <div
              className="flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-display font-bold uppercase tracking-[0.2em]"
              style={{ color: "#9D6FFF", borderColor: "rgba(157,111,255,0.25)", background: "rgba(157,111,255,0.09)", boxShadow: "inset 0 0 0 1px rgba(157,111,255,0.2)" }}
            >
              <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
              </svg>
              Coming for the next Major
            </div>
          </div>

          {/* Headline */}
          <div className="space-y-4">
            <h1 className="font-display text-[clamp(3rem,10vw,6.5rem)] leading-[0.9] tracking-tight">
              <span className="text-text">Fantasy</span>
              <br />
              <span className="text-purple" style={{ textShadow: "0 0 60px rgba(157,111,255,0.4)" }}>League</span>
            </h1>
            <p className="text-text-muted text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
              Draft 5 R6 Siege pros. Score points from their real in-game performance.
              Compete across all 3 phases of the Major.
            </p>
          </div>

          {/* Constructing pill */}
          <div className="flex justify-center">
            <div
              className="inline-flex items-center gap-3 rounded-2xl px-6 py-4"
              style={{
                background: "rgba(255,255,255,0.03)",
                boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.05)",
              }}
            >
              {/* Animated construction dots */}
              <div className="flex gap-1">
                {[0, 150, 300].map((delay) => (
                  <span
                    key={delay}
                    className="h-1.5 w-1.5 rounded-full bg-purple animate-pulse"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </div>
              <span className="font-display text-sm text-text-muted tracking-wider">
                We&apos;re building it
              </span>
              <span className="text-[10px] text-text-dim font-stats border border-white/8 rounded-full px-2 py-0.5">
                Next Major
              </span>
            </div>
          </div>

          {/* CTA back to picks */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link
              href="/predictions"
              className="group inline-flex items-center justify-center gap-2.5 rounded-full px-6 py-3.5 text-sm font-display font-bold uppercase tracking-wider transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97]"
              style={{
                background: "linear-gradient(135deg, rgba(245,200,66,0.95) 0%, rgba(245,180,40,1) 100%)",
                color: "#07080D",
                boxShadow: "0 0 0 1px rgba(245,200,66,0.4), 0 4px 24px rgba(245,200,66,0.25)",
              }}
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              Play Pick&apos;Em instead
              <div className="h-7 w-7 rounded-full bg-black/12 flex items-center justify-center group-hover:translate-x-0.5 group-hover:-translate-y-px transition-transform duration-300">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
            <Link
              href="/leaderboard"
              className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-display font-bold uppercase tracking-wider text-text-muted hover:text-text transition-all duration-500"
              style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)" }}
            >
              View Leaderboard
            </Link>
          </div>
        </div>
      </section>

      {/* ── What's coming ── */}
      <section className="relative py-24 border-t border-white/5">
        <div className="absolute inset-x-0 top-0 h-px"
          style={{ background: "linear-gradient(to right, transparent, rgba(157,111,255,0.2), transparent)" }} />

        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-2">
            <div
              className="badge-eyebrow mx-auto w-fit"
              style={{ color: "#9D6FFF", borderColor: "rgba(157,111,255,0.25)", background: "rgba(157,111,255,0.08)" }}
            >
              What&apos;s coming
            </div>
            <h2 className="font-display text-3xl sm:text-4xl text-text tracking-tight">
              How Fantasy will work
            </h2>
          </div>

          {/* Feature cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FEATURES.map(({ icon, title, desc }) => (
              <div
                key={title}
                className="rounded-2xl p-6 space-y-4"
                style={{
                  background: "rgba(255,255,255,0.025)",
                  boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.07), inset 0 1px 0 rgba(255,255,255,0.05)",
                }}
              >
                <div
                  className="h-10 w-10 rounded-xl flex items-center justify-center text-purple"
                  style={{ background: "rgba(157,111,255,0.1)", boxShadow: "inset 0 0 0 1px rgba(157,111,255,0.2)" }}
                >
                  {icon}
                </div>
                <div className="space-y-1">
                  <h3 className="font-display text-base text-text tracking-wide">{title}</h3>
                  <p className="text-sm text-text-muted leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Scoring preview */}
          <div
            className="rounded-2xl p-6 space-y-5"
            style={{
              background: "rgba(157,111,255,0.04)",
              boxShadow: "inset 0 0 0 1px rgba(157,111,255,0.1)",
            }}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm text-purple/70 uppercase tracking-[0.2em]">Scoring preview</h3>
              <span className="text-[10px] text-text-dim border border-white/8 rounded-full px-2 py-0.5 font-stats">
                subject to change
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {SCORING.map(({ pts, stat }) => (
                <div
                  key={stat}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                  style={{ background: "rgba(255,255,255,0.03)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)" }}
                >
                  <span className={`font-stats font-bold text-sm tabular-nums shrink-0 ${pts.startsWith("+") ? "text-purple" : "text-danger"}`}>
                    {pts}
                  </span>
                  <span className="text-xs text-text-muted">{stat}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
