import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "404 — Page not found · Fantasix",
}

export default function NotFound() {
  return (
    <div className="relative min-h-[100dvh] flex flex-col items-center justify-center overflow-hidden bg-void">

      {/* Atmospheric background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: [
            "radial-gradient(ellipse 60% 60% at 50% 40%, rgba(157,111,255,0.09) 0%, transparent 60%)",
            "radial-gradient(ellipse 40% 40% at 20% 80%, rgba(245,200,66,0.05) 0%, transparent 55%)",
            "#07080D",
          ].join(", "),
        }}
      />
      <div className="absolute inset-0 grid-fine opacity-[0.12] pointer-events-none" />

      {/* Glowing orb */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full blur-[130px] pointer-events-none opacity-[0.10] animate-glow-pulse"
        style={{ background: "rgba(157,111,255,1)" }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8 px-4 text-center">

        {/* Glitchy 404 */}
        <div className="relative select-none">
          <span
            className="font-display text-[clamp(6rem,20vw,12rem)] leading-none font-bold tracking-tighter"
            style={{
              color: "transparent",
              WebkitTextStroke: "1px rgba(157,111,255,0.25)",
              textShadow: "0 0 80px rgba(157,111,255,0.15)",
            }}
          >
            404
          </span>
          {/* Overlaid coloured version */}
          <span
            className="absolute inset-0 font-display text-[clamp(6rem,20vw,12rem)] leading-none font-bold tracking-tighter text-text/8"
            aria-hidden
          >
            404
          </span>
        </div>

        {/* Copy */}
        <div className="space-y-3 max-w-sm">
          <h1 className="font-display text-2xl text-text tracking-wide">
            Page not found
          </h1>
          <p className="text-sm text-text-muted leading-relaxed">
            This page has gone dark. It may have been moved, deleted, or never existed in the first place.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Link
            href="/predictions"
            className="group relative flex items-center gap-2.5 rounded-full px-6 py-3 text-sm font-display font-bold uppercase tracking-wider transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97]"
            style={{
              background: "linear-gradient(135deg, rgba(245,200,66,0.95) 0%, rgba(245,180,40,1) 100%)",
              color: "#07080D",
              boxShadow: "0 0 0 1px rgba(245,200,66,0.4), 0 4px 20px rgba(245,200,66,0.22)",
            }}
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            Make Predictions
            <div className="h-6 w-6 rounded-full bg-black/12 flex items-center justify-center group-hover:translate-x-0.5 group-hover:-translate-y-px transition-transform duration-300">
              <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          <Link
            href="/"
            className="flex items-center gap-2 rounded-full px-5 py-3 text-sm text-text-muted hover:text-text transition-all duration-300"
            style={{
              background: "rgba(255,255,255,0.03)",
              boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)",
            }}
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Back to home
          </Link>
        </div>

        {/* Nav shortcuts */}
        <div className="flex items-center gap-4 pt-2">
          {[
            { href: "/leaderboard", label: "Leaderboard" },
            { href: "/fantasy",     label: "Fantasy" },
            { href: "/login",       label: "Sign in" },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-[11px] text-text-dim hover:text-text-muted transition-colors uppercase tracking-[0.15em] font-display"
            >
              {label}
            </Link>
          ))}
        </div>

      </div>

      {/* Bottom separator */}
      <div
        className="absolute inset-x-0 bottom-0 h-px pointer-events-none"
        style={{ background: "linear-gradient(to right, transparent, rgba(157,111,255,0.2), transparent)" }}
      />
    </div>
  )
}
