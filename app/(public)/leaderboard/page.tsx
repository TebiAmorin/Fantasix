import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import Image from "next/image"
import { LeaderboardTable } from "@/components/leaderboard/leaderboard-table"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Leaderboard — Fantasix",
  description: "Pick'Em rankings for the BLAST R6 Major SLC 2026.",
  openGraph: {
    title: "Leaderboard — Fantasix",
    description: "Pick'Em rankings for the BLAST R6 Major SLC 2026.",
    images: [{ url: "/api/og?title=Leaderboard&sub=BLAST+R6+Major+%C2%B7+SLC+2026", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/api/og?title=Leaderboard&sub=BLAST+R6+Major+%C2%B7+SLC+2026"],
  },
}

export const revalidate = 60

// ── Podium card for top-3 ─────────────────────────────────────────────────────

interface PodiumRow {
  user_id: string
  username: string
  avatar_url: string | null
  total_points: number
  correct_picks: number
  resolved_picks: number
  accuracy_pct: number
}

function PodiumCard({
  row,
  rank,
  isMe,
  style,
}: {
  row: PodiumRow
  rank: 1 | 2 | 3
  isMe: boolean
  style: {
    glow: string
    ring: string
    bg: string
    label: string
    labelColor: string
    height: string
    crown?: boolean
  }
}) {
  const accuracy = row.resolved_picks > 0
    ? Math.round((row.correct_picks / row.resolved_picks) * 100)
    : 0

  return (
    <Link
      href={`/profile/${row.username}`}
      className={`group relative flex flex-col items-center gap-3 rounded-[20px] px-5 py-6 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 ${style.height}`}
      style={{
        background: style.bg,
        boxShadow: `inset 0 0 0 1px ${style.ring}, 0 20px 60px rgba(0,0,0,0.4), 0 4px 20px ${style.glow}`,
      }}
    >
      {/* Crown / rank badge */}
      {style.crown ? (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
          <div
            className="h-8 w-8 rounded-full flex items-center justify-center"
            style={{ background: "rgba(245,200,66,0.15)", boxShadow: `0 0 20px rgba(245,200,66,0.5), inset 0 0 0 1px rgba(245,200,66,0.35)` }}
          >
            <svg className="h-4 w-4 text-gold" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2 20h20v2H2v-2zM4 17l4-8 4 4 4-6 4 10H4z"/>
            </svg>
          </div>
        </div>
      ) : (
        <div
          className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 h-6 w-6 rounded-full flex items-center justify-center"
          style={{
            background: rank === 2 ? "rgba(192,192,192,0.15)" : "rgba(205,127,50,0.15)",
            boxShadow: `inset 0 0 0 1px ${rank === 2 ? "rgba(192,192,192,0.3)" : "rgba(205,127,50,0.3)"}`,
          }}
        >
          <span className={`font-stats text-[10px] font-bold ${rank === 2 ? "text-[#C0C0C0]" : "text-[#CD7F32]"}`}>{rank}</span>
        </div>
      )}

      {/* Avatar */}
      <div
        className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-full overflow-hidden flex items-center justify-center shrink-0"
        style={{
          background: "rgba(255,255,255,0.05)",
          boxShadow: `0 0 0 2px ${style.ring}, 0 0 20px ${style.glow}`,
        }}
      >
        {row.avatar_url ? (
          <Image src={row.avatar_url} alt={row.username} fill className="object-cover" />
        ) : (
          <span
            className="font-display font-bold text-xl"
            style={{ color: style.labelColor }}
          >
            {row.username.slice(0, 2).toUpperCase()}
          </span>
        )}
      </div>

      {/* Name */}
      <div className="text-center min-w-0 w-full">
        <p
          className={`font-display text-sm sm:text-base font-bold truncate tracking-wide ${isMe ? "" : ""}`}
          style={{ color: style.labelColor }}
        >
          {row.username}
          {isMe && <span className="ml-1.5 text-[10px] opacity-50 font-normal">(you)</span>}
        </p>
        <p className="text-[10px] text-text-dim font-display uppercase tracking-[0.15em] mt-0.5">{style.label}</p>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 w-full justify-center">
        <div className="text-center">
          <p className="font-stats font-bold text-lg tabular-nums leading-none" style={{ color: style.labelColor }}>
            {row.total_points}
          </p>
          <p className="text-[9px] text-text-dim uppercase tracking-[0.15em] mt-0.5">pts</p>
        </div>
        <div className="h-6 w-px bg-white/8" />
        <div className="text-center">
          <p className="font-stats font-bold text-base tabular-nums leading-none text-text-muted">
            {accuracy}%
          </p>
          <p className="text-[9px] text-text-dim uppercase tracking-[0.15em] mt-0.5">acc</p>
        </div>
      </div>
    </Link>
  )
}

export default async function LeaderboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [
    { data: pickem },
    { data: tournament },
  ] = await Promise.all([
    supabase
      .from("pickem_leaderboard")
      .select("user_id, username, avatar_url, total_points, correct_picks, resolved_picks, accuracy_pct, current_streak")
      .order("total_points", { ascending: false })
      .order("accuracy_pct", { ascending: false })
      .limit(100),
    supabase
      .from("tournaments")
      .select("name")
      .eq("is_active", true)
      .single(),
  ])

  // Coerce nullable view fields to non-null with fallbacks for the component
  const pickemRows = (pickem ?? []).map(r => ({
    user_id:        r.user_id        ?? "",
    username:       r.username       ?? "",
    avatar_url:     r.avatar_url,
    total_points:   r.total_points   ?? 0,
    correct_picks:  r.correct_picks  ?? 0,
    resolved_picks: r.resolved_picks ?? 0,
    accuracy_pct:   r.accuracy_pct   ?? 0,
    current_streak: r.current_streak ?? 0,
  }))
  const myPickemRank = pickemRows.findIndex(r => r.user_id === user?.id) + 1

  const top3 = pickemRows.slice(0, 3)

  const podiumStyles: Record<1 | 2 | 3, Parameters<typeof PodiumCard>[0]["style"]> = {
    1: {
      glow:       "rgba(245,200,66,0.18)",
      ring:       "rgba(245,200,66,0.22)",
      bg:         "linear-gradient(160deg, rgba(245,200,66,0.09) 0%, rgba(245,200,66,0.03) 60%, rgba(13,14,20,0.95) 100%)",
      label:      "1st place",
      labelColor: "#F5C842",
      height:     "sm:pt-10",
      crown:      true,
    },
    2: {
      glow:       "rgba(192,192,192,0.10)",
      ring:       "rgba(192,192,192,0.18)",
      bg:         "linear-gradient(160deg, rgba(192,192,192,0.06) 0%, rgba(13,14,20,0.95) 100%)",
      label:      "2nd place",
      labelColor: "#C0C0C0",
      height:     "",
    },
    3: {
      glow:       "rgba(205,127,50,0.10)",
      ring:       "rgba(205,127,50,0.18)",
      bg:         "linear-gradient(160deg, rgba(205,127,50,0.06) 0%, rgba(13,14,20,0.95) 100%)",
      label:      "3rd place",
      labelColor: "#CD7F32",
      height:     "",
    },
  }

  return (
    <div>
      {/* ── Hero ── */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-slc-mesh" />
        <div className="absolute inset-0 slc-slash opacity-100 pointer-events-none" />
        <div className="absolute -top-12 -left-8 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: "rgba(196,30,58,0.14)", filter: "blur(100px)" }} />
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: "rgba(0,212,184,0.07)", filter: "blur(80px)" }} />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-20 rounded-full pointer-events-none"
          style={{ background: "rgba(245,200,66,0.07)", filter: "blur(60px)" }} />
        <div className="absolute inset-x-0 bottom-0 h-px"
          style={{ background: "linear-gradient(to right, transparent, rgba(196,30,58,0.4), rgba(245,200,66,0.3), rgba(0,212,184,0.2), transparent)" }} />

        <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 pb-12">
          <div className="space-y-4 animate-fade-up">
            <div
              className="inline-flex items-center gap-2 rounded-full px-3 py-1.5"
              style={{ color: "#C41E3A", border: "1px solid rgba(196,30,58,0.3)", background: "rgba(196,30,58,0.10)" }}
            >
              <svg className="h-2.5 w-2.5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              <span className="text-[10px] font-display font-bold uppercase tracking-[0.2em]">
                {tournament?.name ?? "BLAST R6 Major SLC 2026"}
              </span>
            </div>

            <div>
              <h1 className="font-display text-5xl sm:text-6xl text-text leading-none tracking-tight">
                Leader<span className="text-gold text-glow-gold">board</span>
              </h1>
              <p className="text-text-muted text-sm mt-2 tracking-wide">
                Pick&apos;Em rankings ·{" "}
                <span style={{ color: "rgba(0,212,184,0.6)" }}>FORGED THE HARD WAY</span>
              </p>
            </div>

            {/* My rank pill */}
            {user && myPickemRank > 0 && (
              <div className="flex flex-wrap gap-3 pt-1">
                <div
                  className="flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-stats"
                  style={{ background: "rgba(245,200,66,0.08)", boxShadow: "inset 0 0 0 1px rgba(245,200,66,0.2)" }}
                >
                  <span className="text-gold font-bold">#{myPickemRank}</span>
                  <span className="text-text-muted">Your rank</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Top-3 Podium ── */}
      {top3.length >= 2 && (
        <div className="relative border-b border-white/5">
          {/* Subtle gold radial glow behind podium */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse 60% 100% at 50% 100%, rgba(245,200,66,0.05) 0%, transparent 70%)" }} />

          <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
            {/* Section label */}
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="h-px flex-1 max-w-[80px]" style={{ background: "linear-gradient(to right, transparent, rgba(245,200,66,0.2))" }} />
              <span className="text-[9px] font-display text-gold/50 uppercase tracking-[0.35em]">Top Predictors</span>
              <div className="h-px flex-1 max-w-[80px]" style={{ background: "linear-gradient(to left, transparent, rgba(245,200,66,0.2))" }} />
            </div>

            {/* Podium layout: 2 | 1 | 3 */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 items-end max-w-lg mx-auto">
              {/* 2nd place — left */}
              {top3[1] && (
                <div className="mt-6">
                  <PodiumCard
                    row={top3[1]}
                    rank={2}
                    isMe={top3[1].user_id === user?.id}
                    style={podiumStyles[2]}
                  />
                </div>
              )}
              {/* 1st place — center, elevated */}
              {top3[0] && (
                <PodiumCard
                  row={top3[0]}
                  rank={1}
                  isMe={top3[0].user_id === user?.id}
                  style={podiumStyles[1]}
                />
              )}
              {/* 3rd place — right */}
              {top3[2] && (
                <div className="mt-10">
                  <PodiumCard
                    row={top3[2]}
                    rank={3}
                    isMe={top3[2].user_id === user?.id}
                    style={podiumStyles[3]}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Table ── */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 space-y-10">

        {/* ── Pick'Em ── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h2 className="font-display text-lg text-text uppercase tracking-wide">Pick&apos;Em</h2>
              <p className="text-xs text-text-muted">1 point per correct match prediction</p>
            </div>
            <Link href="/predictions" className="text-xs text-text-muted hover:text-text transition-colors">
              Make picks →
            </Link>
          </div>

          <LeaderboardTable rows={pickemRows} currentUserId={user?.id ?? null} />
        </section>

        {/* ── How scoring works ── */}
        <section
          className="rounded-2xl overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.025)",
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.07)",
          }}
        >
          {/* Section header */}
          <div className="px-5 py-4 border-b border-white/5 flex items-center gap-3">
            <div
              className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(245,200,66,0.1)", boxShadow: "inset 0 0 0 1px rgba(245,200,66,0.18)" }}
            >
              <svg className="h-4 w-4 text-gold" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
              </svg>
            </div>
            <h3 className="font-display text-sm text-text uppercase tracking-wide">How scoring works</h3>
          </div>

          {/* Rules grid */}
          <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                icon: (
                  <svg className="h-4 w-4 text-gold" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                ),
                value: "+1 pt",
                valueColor: "#F5C842",
                label: "Correct match winner prediction",
              },
              {
                icon: (
                  <svg className="h-4 w-4 text-text-dim" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10"/><path d="M8 12h8"/>
                  </svg>
                ),
                value: "0 pts",
                valueColor: "rgba(255,255,255,0.25)",
                label: "Wrong prediction or no pick",
              },
              {
                icon: (
                  <svg className="h-4 w-4 text-danger" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                ),
                value: "Locks",
                valueColor: "rgba(240,90,90,0.8)",
                label: "Picks lock when match goes live",
              },
            ].map(({ icon, value, valueColor, label }) => (
              <div
                key={value}
                className="rounded-xl p-4 space-y-2.5"
                style={{ background: "rgba(255,255,255,0.025)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)" }}
              >
                <div className="h-8 w-8 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.04)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.07)" }}>
                  {icon}
                </div>
                <p className="font-stats font-bold text-xl tabular-nums leading-none" style={{ color: valueColor }}>{value}</p>
                <p className="text-[11px] text-text-muted leading-relaxed">{label}</p>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  )
}
