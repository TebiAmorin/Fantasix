// ── Fantasix — central constants ─────────────────────────────────────────────
// Single source of truth for event dates, scoring, and shared config.
// Import from here instead of hardcoding values in components.

/** BLAST R6 Major Salt Lake City 2026 — event dates */
export const EVENT_START = new Date("2026-05-08T18:00:00Z") // Play-In day 1, 18:00 UTC
export const EVENT_END   = new Date("2026-05-17T23:59:00Z") // Grand Final ends

/** Human-readable date range shown in the UI */
export const EVENT_DATE_RANGE = "May 8–17, 2026"
export const EVENT_DATE_SHORT = "May 8–17"

/** Event marketing copy */
export const EVENT_NAME      = "BLAST R6 Major · Salt Lake City 2026"
export const EVENT_TAGLINE   = "FORGED THE HARD WAY"
export const EVENT_PRIZE_FALLBACK = "$750K"

/** Pick'Em scoring */
export const POINTS_PER_CORRECT_PICK = 1

/** Revalidation intervals (seconds) */
export const REVALIDATE_FAST   = 30   // live match pages
export const REVALIDATE_NORMAL = 60   // schedule, predictions
export const REVALIDATE_SLOW   = 300  // leaderboard, profile
