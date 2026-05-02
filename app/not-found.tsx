import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "404 — Page not found · Fantasix",
}

export default function NotFound() {
  return (
    <div className="relative min-h-[100dvh] flex flex-col items-center justify-center overflow-hidden bg-void">

      {/* Structural diagonal texture */}
      <div className="absolute inset-0 bg-tactical-stripe pointer-events-none" />

      {/* Red top vignette */}
      <div className="absolute inset-0 bg-hero-vignette pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8 px-4 text-center">

        {/* 404 number — red stroke, no glow */}
        <div className="relative select-none">
          <span
            className="font-display text-[clamp(6rem,20vw,12rem)] leading-none tracking-tighter"
            style={{
              color: "transparent",
              WebkitTextStroke: "1px rgba(196,30,58,0.35)",
            }}
          >
            404
          </span>
          {/* Faint filled overlay */}
          <span
            className="absolute inset-0 font-display text-[clamp(6rem,20vw,12rem)] leading-none tracking-tighter"
            style={{ color: "rgba(196,30,58,0.06)" }}
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
          <Link href="/predictions" className="btn-primary">
            <svg className="h-3.5 w-3.5 shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            Make Predictions
          </Link>

          <Link href="/" className="btn-ghost">
            <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden>
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Back to home
          </Link>
        </div>

        {/* Nav shortcuts */}
        <div className="flex items-center gap-6 pt-2">
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

      {/* Bottom border line */}
      <div
        className="absolute inset-x-0 bottom-0 h-px pointer-events-none"
        style={{ background: "linear-gradient(to right, transparent, rgba(196,30,58,0.25), transparent)" }}
      />
    </div>
  )
}
