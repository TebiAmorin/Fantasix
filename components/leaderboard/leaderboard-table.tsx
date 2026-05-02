"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { CrownIcon, SilverMedalIcon, BronzeMedalIcon, StreakIcon } from "@/components/icons/rank-icons"

interface PickemRow {
  user_id: string
  username: string
  avatar_url: string | null
  total_points: number
  correct_picks: number
  resolved_picks: number
  accuracy_pct: number
  current_streak: number
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <CrownIcon className="h-6 w-6 text-gold" />
  if (rank === 2) return <SilverMedalIcon className="h-6 w-6 text-[#C0C0C0]" />
  if (rank === 3) return <BronzeMedalIcon className="h-6 w-6 text-[#CD7F32]" />
  return <span className="inline-flex h-6 w-6 items-center justify-center text-[11px] font-stats text-text-dim">{rank}</span>
}

function Avatar({ username, avatarUrl }: { username: string; avatarUrl: string | null }) {
  return (
    <div className="h-7 w-7 rounded-full overflow-hidden shrink-0 bg-red/10 border border-red/20 flex items-center justify-center">
      {avatarUrl ? (
        <Image src={avatarUrl} alt={username} width={28} height={28} className="object-cover" />
      ) : (
        <span className="font-display text-red text-[9px] font-bold">{username.slice(0, 2).toUpperCase()}</span>
      )}
    </div>
  )
}

function AccuracyBar({ pct }: { pct: number }) {
  const color = pct >= 75
    ? "from-success/80 to-success/40"
    : pct >= 50 ? "from-gold/70 to-gold/30"
    : "from-text-dim/60 to-text-dim/30"
  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <div className="flex-1 h-1 rounded-full bg-white/5 overflow-hidden">
        <div className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-700`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className={`font-stats text-[10px] tabular-nums w-7 text-right ${pct >= 75 ? "text-success/80" : pct >= 50 ? "text-gold/70" : "text-text-dim"}`}>{pct}%</span>
    </div>
  )
}

export function LeaderboardTable({
  rows,
  currentUserId,
}: {
  rows: PickemRow[]
  currentUserId: string | null
}) {
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(r => r.username.toLowerCase().includes(q))
  }, [rows, query])

  // The user's true rank in the full dataset (not filtered)
  const myTrueRank = currentUserId
    ? rows.findIndex(r => r.user_id === currentUserId) + 1
    : 0

  const myRowVisible = currentUserId
    ? filtered.some(r => r.user_id === currentUserId)
    : false

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-dim pointer-events-none" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search player..."
          className="w-full h-9 pl-8 pr-3 rounded-xl text-xs text-text bg-transparent border border-white/8 focus:border-red/30 focus:outline-none placeholder:text-text-dim transition-colors duration-300"
        />
        {query && (
          <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-text transition-colors">
            <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        )}
      </div>

      {/* My rank pill (when filtered out) */}
      {currentUserId && myTrueRank > 0 && query && !myRowVisible && (
        <div
          className="flex items-center justify-between rounded-xl px-4 py-2.5 text-xs"
          style={{ background: "rgba(245,200,66,0.06)", boxShadow: "inset 0 0 0 1px rgba(245,200,66,0.15)" }}
        >
          <span className="text-text-muted">Your rank is</span>
          <span className="font-stats font-bold text-gold">#{myTrueRank}</span>
          <button onClick={() => setQuery("")} className="text-gold/60 hover:text-gold transition-colors text-[10px] uppercase tracking-wider">
            Show me →
          </button>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="py-10 text-center">
          <p className="text-sm text-text-muted">No player found for &ldquo;{query}&rdquo;</p>
        </div>
      )}

      {filtered.length > 0 && (
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.025)",
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.07), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}
        >
          {/* Header — responsive: 3 cols mobile, 5 cols desktop */}
          <div className="grid grid-cols-[32px_1fr_52px] sm:grid-cols-[40px_1fr_80px_96px_72px] gap-2 sm:gap-3 px-3 sm:px-5 py-3 border-b border-white/6">
            {[
              { label: "#",        cls: "" },
              { label: "Player",   cls: "" },
              { label: "Pts",      cls: "" },
              { label: "Accuracy", cls: "hidden sm:block" },
              { label: "Picks",    cls: "hidden sm:block" },
            ].map(({ label, cls }) => (
              <span key={label} className={`text-[9px] text-text-dim uppercase tracking-[0.25em] font-display ${cls}`}>{label}</span>
            ))}
          </div>

          {/* Rows */}
          <div className="divide-y divide-white/4">
            {filtered.map(row => {
              const trueRank = rows.findIndex(r => r.user_id === row.user_id) + 1
              const isMe = row.user_id === currentUserId
              const podiumClass = trueRank === 1 ? "lb-row-gold" : trueRank === 2 ? "lb-row-silver" : trueRank === 3 ? "lb-row-bronze" : ""

              return (
                <Link
                  key={row.user_id}
                  href={`/profile/${row.username}`}
                  className={`grid grid-cols-[32px_1fr_52px] sm:grid-cols-[40px_1fr_80px_96px_72px] gap-2 sm:gap-3 items-center px-3 sm:px-5 py-3 sm:py-3.5 transition-all duration-300 min-h-[52px] ${podiumClass} ${
                    isMe ? "bg-gold/5 hover:bg-gold/8" : "hover:bg-white/3"
                  }`}
                >
                  <RankBadge rank={trueRank} />

                  <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                    <Avatar username={row.username} avatarUrl={row.avatar_url} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <span className={`text-xs sm:text-sm font-medium truncate leading-tight ${isMe ? "text-gold" : "text-text"}`}>
                          {row.username}
                          {isMe && <span className="ml-1 text-[8px] text-gold/50 font-normal">you</span>}
                        </span>
                        {(row.current_streak ?? 0) >= 2 && (
                          <span
                            className="flex items-center gap-0.5 rounded-full px-1 sm:px-1.5 py-0.5 shrink-0"
                            style={{ background: "rgba(245,200,66,0.1)", boxShadow: "inset 0 0 0 1px rgba(245,200,66,0.2)" }}
                            title={`${row.current_streak} correct in a row`}
                          >
                            <StreakIcon className="h-2 w-2 sm:h-2.5 sm:w-2.5 text-gold" />
                            <span className="font-stats text-[8px] sm:text-[9px] text-gold font-bold tabular-nums">{row.current_streak}</span>
                          </span>
                        )}
                      </div>
                      {/* Mobile: show accuracy inline under name */}
                      <p className="sm:hidden text-[9px] text-text-dim font-stats tabular-nums mt-0.5">
                        {row.correct_picks}/{row.resolved_picks} · {row.accuracy_pct ?? 0}%
                      </p>
                      {trueRank <= 3 && (
                        <span className="hidden sm:block text-[8px] font-display uppercase tracking-[0.2em] opacity-45">
                          {trueRank === 1 ? "First Place" : trueRank === 2 ? "Second" : "Third"}
                        </span>
                      )}
                    </div>
                  </div>

                  <span className={`font-stats font-bold tabular-nums text-sm sm:text-base ${trueRank === 1 ? "text-gold" : "text-gold"}`}>
                    {row.total_points}
                  </span>

                  {/* Desktop-only columns */}
                  <div className="hidden sm:block">
                    <AccuracyBar pct={row.accuracy_pct ?? 0} />
                  </div>
                  <span className="hidden sm:block font-stats text-xs text-text-muted tabular-nums">
                    {row.correct_picks}/{row.resolved_picks}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {!query && rows.length >= 100 && (
        <p className="text-center text-[10px] text-text-dim">Showing top 100 · Use search to find any player</p>
      )}
    </div>
  )
}
