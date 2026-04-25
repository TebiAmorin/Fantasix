"use client"

import { useState, useMemo } from "react"
import Image from "next/image"
import { Search, SlidersHorizontal, Coins } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { PlayerWithTeam } from "@/lib/types/database.types"

const REGIONS = ["All", "EML", "NAL", "SAL", "APL", "CNL"]
const ROLES = ["All", "Entry", "IGL", "Support", "Flex"]

interface PlayerGridProps {
  players: PlayerWithTeam[]
  userPicks: string[]         // player IDs already picked
  salaryCap: number
  draftOpen: boolean
}

export function PlayerGrid({ players, userPicks, salaryCap, draftOpen }: PlayerGridProps) {
  const [search, setSearch] = useState("")
  const [regionFilter, setRegionFilter] = useState("All")
  const [roleFilter, setRoleFilter] = useState("All")
  const [sortBy, setSortBy] = useState<"cost" | "nickname">("cost")

  const filtered = useMemo(() => {
    return players
      .filter((p) => {
        const matchesSearch =
          p.nickname.toLowerCase().includes(search.toLowerCase()) ||
          (p.real_name?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
          (p.teams?.name?.toLowerCase().includes(search.toLowerCase()) ?? false)

        const matchesRegion =
          regionFilter === "All" || p.teams?.region === regionFilter

        const matchesRole =
          roleFilter === "All" || p.role === roleFilter

        return matchesSearch && matchesRegion && matchesRole
      })
      .sort((a, b) => {
        if (sortBy === "cost") return b.fantasy_cost - a.fantasy_cost
        return a.nickname.localeCompare(b.nickname)
      })
  }, [players, search, regionFilter, roleFilter, sortBy])

  return (
    <div className="space-y-4">
      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <Input
            placeholder="Search player or team..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-surface border-white/8 text-text placeholder:text-text-muted focus-visible:ring-purple"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {/* Region filter */}
          {REGIONS.map((r) => (
            <button
              key={r}
              onClick={() => setRegionFilter(r)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-colors border",
                regionFilter === r
                  ? "bg-purple/20 border-purple/40 text-purple"
                  : "bg-surface border-white/8 text-text-muted hover:text-text hover:border-white/20"
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Role filter */}
      <div className="flex gap-2 flex-wrap">
        {ROLES.map((r) => (
          <button
            key={r}
            onClick={() => setRoleFilter(r)}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-medium transition-colors border",
              roleFilter === r
                ? "bg-gold/15 border-gold/40 text-gold"
                : "bg-surface border-white/8 text-text-muted hover:text-text hover:border-white/20"
            )}
          >
            {r}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 text-xs text-text-muted">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <button
            onClick={() => setSortBy(sortBy === "cost" ? "nickname" : "cost")}
            className="hover:text-text transition-colors"
          >
            Sort: {sortBy === "cost" ? "Cost ↓" : "A-Z"}
          </button>
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs text-text-muted">
        {filtered.length} players
        {draftOpen && (
          <span className="ml-2 text-gold">· Draft open — Salary cap: {salaryCap}</span>
        )}
      </p>

      {/* Player cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {filtered.map((player) => {
          const isPicked = userPicks.includes(player.id)
          return (
            <PlayerCard
              key={player.id}
              player={player}
              isPicked={isPicked}
              draftOpen={draftOpen}
              salaryCap={salaryCap}
            />
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-text-muted text-sm">
          No players found for this search.
        </div>
      )}
    </div>
  )
}

function PlayerCard({
  player,
  isPicked,
  draftOpen,
}: {
  player: PlayerWithTeam
  isPicked: boolean
  draftOpen: boolean
  salaryCap: number
}) {
  return (
    <div
      className={cn(
        "card-tactical rounded-lg p-4 flex flex-col gap-3 border transition-all duration-150",
        isPicked
          ? "border-gold/30 bg-gold/5"
          : "border-white/8 hover:border-white/20"
      )}
    >
      {/* Header: avatar + cost */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {player.avatar_url ? (
            <div className="relative h-10 w-10 rounded-md overflow-hidden border border-white/10 shrink-0">
              <Image
                src={player.avatar_url}
                alt={player.nickname}
                fill
                className="object-cover"
                sizes="40px"
              />
            </div>
          ) : (
            <div className="h-10 w-10 rounded-md bg-purple/20 border border-purple/20 flex items-center justify-center shrink-0">
              <span className="font-display text-purple text-sm">
                {player.nickname.slice(0, 2).toUpperCase()}
              </span>
            </div>
          )}
          <div className="min-w-0">
            <p className="font-medium text-text text-sm truncate">{player.nickname}</p>
            {player.real_name && (
              <p className="text-xs text-text-muted truncate">{player.real_name}</p>
            )}
          </div>
        </div>

        {/* Cost badge */}
        <div className="flex items-center gap-1 bg-gold/10 border border-gold/20 rounded px-2 py-1 shrink-0">
          <Coins className="h-3 w-3 text-gold" />
          <span className="font-stats text-xs font-bold text-gold">{player.fantasy_cost}</span>
        </div>
      </div>

      {/* Team + role */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {player.teams?.logo_url ? (
            <Image
              src={player.teams.logo_url}
              alt={player.teams.name}
              width={16}
              height={16}
              className="rounded-sm object-contain"
            />
          ) : null}
          <span className="text-xs text-text-muted">
            {player.teams?.short_name ?? player.teams?.name ?? "Free Agent"}
          </span>
        </div>
        {player.role && (
          <Badge
            variant="outline"
            className="text-[10px] border-white/10 text-text-muted py-0 h-4"
          >
            {player.role}
          </Badge>
        )}
      </div>

      {/* Pick status */}
      {draftOpen && (
        <div className={cn(
          "text-center text-[10px] font-medium py-1 rounded border",
          isPicked
            ? "bg-gold/10 border-gold/30 text-gold"
            : "border-white/8 text-text-muted"
        )}>
          {isPicked ? "✓ In your roster" : "Go to Draft to pick"}
        </div>
      )}
    </div>
  )
}
