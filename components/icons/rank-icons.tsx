/**
 * Fantasix UI Icons — SVG inline components
 * All icons use currentColor unless they have their own brand colors.
 * Usage: <CrownIcon className="h-5 w-5 text-gold" />
 */

interface IconProps {
  className?: string
}

// ── Rank 1 — Crown ─────────────────────────────────────────────────────────────
// Geometric military crown. Use with text-gold.
export function CrownIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Rank 1">
      {/* Crown silhouette */}
      <path d="M3 18L5.5 8.5L9 13L12 4.5L15 13L18.5 8.5L21 18H3Z" fill="currentColor" opacity="0.92" />
      {/* Base bar */}
      <rect x="3" y="19" width="18" height="2.5" rx="1.25" fill="currentColor" opacity="0.85" />
      {/* Dark inner plane — makes it feel hollow/machined */}
      <path d="M6.5 16L8 10.5L10.5 14.5L12 9L13.5 14.5L16 10.5L17.5 16H6.5Z" fill="black" opacity="0.4" />
      {/* Three gems */}
      <circle cx="8"  cy="16.5" r="0.9" fill="currentColor" />
      <circle cx="12" cy="16"   r="0.9" fill="currentColor" />
      <circle cx="16" cy="16.5" r="0.9" fill="currentColor" />
    </svg>
  )
}

// ── Rank 2 — Silver Medal ──────────────────────────────────────────────────────
export function SilverMedalIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Rank 2">
      <rect x="10" y="2" width="4" height="5.5" rx="1" fill="currentColor" opacity="0.65" />
      <path d="M10 6L12 9L14 6" fill="currentColor" opacity="0.45" />
      <circle cx="12" cy="15.5" r="6.5" fill="currentColor" opacity="0.10" />
      <circle cx="12" cy="15.5" r="6.5" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
      <circle cx="12" cy="15.5" r="4.5" stroke="currentColor" strokeWidth="0.75" opacity="0.2" />
      {/* Numeral 2 path */}
      <path d="M10 13.5C10 12.4 10.9 11.5 12 11.5C13.1 11.5 14 12.4 14 13.5C14 14.8 12 16 12 16H14"
            stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
    </svg>
  )
}

// ── Rank 3 — Bronze Medal ──────────────────────────────────────────────────────
export function BronzeMedalIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Rank 3">
      <rect x="10" y="2" width="4" height="5.5" rx="1" fill="currentColor" opacity="0.65" />
      <path d="M10 6L12 9L14 6" fill="currentColor" opacity="0.45" />
      <circle cx="12" cy="15.5" r="6.5" fill="currentColor" opacity="0.10" />
      <circle cx="12" cy="15.5" r="6.5" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
      <circle cx="12" cy="15.5" r="4.5" stroke="currentColor" strokeWidth="0.75" opacity="0.2" />
      {/* Numeral 3 path — two arcs stacked */}
      <path d="M10 12.5C10 12.5 14 12.5 12.5 14.5C14 14.5 14 18.5 10 17.5"
            stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
    </svg>
  )
}

// ── Streak — Lightning Bolt ────────────────────────────────────────────────────
// Used in profile / hero stats to show consecutive correct picks.
// Use with text-gold or text-live.
export function StreakIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-label="Streak">
      <path d="M13.5 2L4 13.5H11.5L10.5 22L20 10H12.5L13.5 2Z" opacity="0.95" />
      {/* Inner highlight plane */}
      <path d="M13 4.5L6.5 12.5H12L11 19.5L17.5 11H12L13 4.5Z" fill="black" opacity="0.28" />
    </svg>
  )
}

// ── Pick Correct ───────────────────────────────────────────────────────────────
// Circled checkmark. Use with text-success.
export function PickCorrectIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Correct">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1" opacity="0.3" />
      <circle cx="12" cy="12" r="8.5" fill="currentColor" opacity="0.10" />
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.5" opacity="0.7" />
      <path d="M7.5 12L10.5 15L16.5 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ── Pick Wrong ─────────────────────────────────────────────────────────────────
// Circled X. Use with text-danger.
export function PickWrongIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Incorrect">
      <circle cx="12" cy="12" r="8.5" fill="currentColor" opacity="0.08" />
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      <path d="M9 9L15 15M15 9L9 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

// ── Picks Locked ───────────────────────────────────────────────────────────────
// Padlock. Use with text-text-muted or text-live.
export function LockedIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Locked">
      <path d="M8 11V7C8 4.79 9.79 3 12 3C14.21 3 16 4.79 16 7V11"
            stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <rect x="5" y="11" width="14" height="10" rx="2.5" fill="currentColor" opacity="0.12" />
      <rect x="5" y="11" width="14" height="10" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="16" r="1.5" fill="currentColor" opacity="0.7" />
      <rect x="11.25" y="16" width="1.5" height="2.5" rx="0.75" fill="currentColor" opacity="0.7" />
    </svg>
  )
}

// ── Target / Pick'Em ───────────────────────────────────────────────────────────
// Crosshair/target. Use in pick'em badges or CTAs.
export function TargetIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Pick'Em">
      <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.25" opacity="0.5" />
      <circle cx="12" cy="12" r="6"   stroke="currentColor" strokeWidth="1.25" opacity="0.7" />
      <circle cx="12" cy="12" r="2.5" fill="currentColor" opacity="0.85" />
      {/* Cross hairs */}
      <line x1="12" y1="2" x2="12" y2="5.5"  stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" opacity="0.5" />
      <line x1="12" y1="18.5" x2="12" y2="22" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" opacity="0.5" />
      <line x1="2" y1="12" x2="5.5" y2="12"  stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" opacity="0.5" />
      <line x1="18.5" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" opacity="0.5" />
    </svg>
  )
}

// ── Trophy ─────────────────────────────────────────────────────────────────────
// Full trophy cup. Use on leaderboard header or winner banners.
export function TrophyIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Trophy">
      {/* Cup body */}
      <path d="M8 3H16V13C16 15.21 14.21 17 12 17C9.79 17 8 15.21 8 13V3Z"
            fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      {/* Handles */}
      <path d="M8 6H5.5C4.67 6 4 6.67 4 7.5V8.5C4 10.43 5.57 12 7.5 12H8"
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M16 6H18.5C19.33 6 20 6.67 20 7.5V8.5C20 10.43 18.43 12 16.5 12H16"
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      {/* Stem */}
      <path d="M12 17V20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      {/* Base */}
      <rect x="8.5" y="20" width="7" height="1.5" rx="0.75" fill="currentColor" opacity="0.8" />
    </svg>
  )
}
