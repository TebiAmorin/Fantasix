"use client"

import { useState, useMemo, useTransition } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Search, Plus, X, Coins, CheckCircle2, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { saveDraft } from "@/lib/actions/fantasy"
import type { PlayerWithTeam } from "@/lib/types/database.types"

const MAX_PICKS = 5
const ROLES = ["All", "Entry", "IGL", "Support", "Flex"]

interface DraftBoardProps {
  players: PlayerWithTeam[]
  existingRoster: {
    id: string
    budget_spent: number
    fantasy_picks: Array<{ player_id: string; players: PlayerWithTeam }>
  } | null
  salaryCap: number
  phaseId: string
  tournamentId: string
  userId: string
}

export function DraftBoard({
  players,
  existingRoster,
  salaryCap,
  phaseId,
  tournamentId,
}: DraftBoardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Initialize picks from existing roster
  const [picks, setPicks] = useState<PlayerWithTeam[]>(() => {
    if (!existingRoster) return []
    return existingRoster.fantasy_picks.map((fp) => fp.players).filter(Boolean)
  })

  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("All")

  const budgetSpent = useMemo(
    () => picks.reduce((sum, p) => sum + p.fantasy_cost, 0),
    [picks]
  )
  const budgetLeft = salaryCap - budgetSpent
  const pickIds = picks.map((p) => p.id)

  const available = useMemo(() => {
    return players
      .filter((p) => {
        if (pickIds.includes(p.id)) return false
        if (roleFilter !== "All" && p.role !== roleFilter) return false
        if (search) {
          const q = search.toLowerCase()
          return (
            p.nickname.toLowerCase().includes(q) ||
            (p.real_name?.toLowerCase().includes(q) ?? false) ||
            (p.teams?.name?.toLowerCase().includes(q) ?? false)
          )
        }
        return true
      })
      .sort((a, b) => b.fantasy_cost - a.fantasy_cost)
  }, [players, pickIds, roleFilter, search])

  function addPick(player: PlayerWithTeam) {
    if (picks.length >= MAX_PICKS) {
      toast.error("Roster full — remove a player first")
      return
    }
    if (budgetLeft < player.fantasy_cost) {
      toast.error(`Not enough budget (need ${player.fantasy_cost}, have ${budgetLeft})`)
      return
    }
    setPicks((prev) => [...prev, player])
  }

  function removePick(playerId: string) {
    setPicks((prev) => prev.filter((p) => p.id !== playerId))
  }

  function handleSave() {
    if (picks.length !== MAX_PICKS) {
      toast.error(`You need exactly ${MAX_PICKS} players`)
      return
    }

    startTransition(async () => {
      const result = await saveDraft({
        phaseId,
        tournamentId,
        playerIds: picks.map((p) => p.id),
        budgetSpent,
        existingRosterId: existingRoster?.id,
      })

      if (result.success) {
        toast.success("Roster saved!")
        router.push("/fantasy")
        router.refresh()
      } else {
        toast.error(result.error ?? "Failed to save roster")
      }
    })
  }

  const isValid = picks.length === MAX_PICKS

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

      {/* ── Left: Player pool ─────────────────────────────── */}
      <div className="lg:col-span-3 space-y-4">
        <h2 className="font-display text-lg text-text uppercase tracking-wide">Player Pool</h2>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <Input
              placeholder="Search player or team..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-surface border-white/8 text-text placeholder:text-text-muted focus-visible:ring-purple"
            />
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          {ROLES.map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={cn(
                "px-2.5 py-1 rounded text-xs font-medium transition-colors border",
                roleFilter === r
                  ? "bg-gold/15 border-gold/40 text-gold"
                  : "bg-surface border-white/8 text-text-muted hover:text-text"
              )}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Available players list */}
        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
          {available.map((player) => {
            const cantAfford = player.fantasy_cost > budgetLeft
            const full = picks.length >= MAX_PICKS

            return (
              <button
                key={player.id}
                onClick={() => addPick(player)}
                disabled={cantAfford || full}
                className={cn(
                  "w-full card-tactical rounded-lg px-4 py-3 flex items-center gap-3 border text-left transition-all",
                  cantAfford || full
                    ? "opacity-40 cursor-not-allowed"
                    : "hover:border-gold/30 hover:bg-gold/5 cursor-pointer"
                )}
              >
                {/* Avatar */}
                <div className="h-9 w-9 rounded bg-purple/20 border border-purple/20 flex items-center justify-center shrink-0 overflow-hidden">
                  {player.avatar_url ? (
                    <Image src={player.avatar_url} alt={player.nickname} width={36} height={36} className="object-cover" />
                  ) : (
                    <span className="font-display text-purple text-xs">
                      {player.nickname.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text truncate">{player.nickname}</p>
                  <p className="text-xs text-text-muted">
                    {player.teams?.short_name ?? "—"}
                    {player.role && ` · ${player.role}`}
                  </p>
                </div>

                {/* Cost */}
                <div className="flex items-center gap-1 shrink-0">
                  <Coins className="h-3.5 w-3.5 text-gold" />
                  <span className="font-stats text-sm font-bold text-gold">{player.fantasy_cost}</span>
                </div>

                <Plus className="h-4 w-4 text-text-muted shrink-0" />
              </button>
            )
          })}

          {available.length === 0 && (
            <p className="text-center py-8 text-text-muted text-sm">No players found</p>
          )}
        </div>
      </div>

      {/* ── Right: My Roster ──────────────────────────────── */}
      <div className="lg:col-span-2">
        <div className="card-tactical rounded-lg p-5 space-y-4 sticky top-20 accent-gold-top">
          <div>
            <h2 className="font-display text-lg text-text uppercase tracking-wide">My Roster</h2>
            <p className="text-xs text-text-muted mt-0.5">
              {picks.length}/{MAX_PICKS} players
            </p>
          </div>

          {/* Budget bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-text-muted">Budget used</span>
              <span className={cn("font-stats font-bold", budgetLeft < 0 ? "text-danger" : "text-gold")}>
                {budgetSpent} / {salaryCap}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  budgetSpent / salaryCap > 0.9 ? "bg-danger" : "bg-gold"
                )}
                style={{ width: `${Math.min((budgetSpent / salaryCap) * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs text-text-muted">
              {budgetLeft} pts remaining
            </p>
          </div>

          <Separator className="bg-white/8" />

          {/* Pick slots */}
          <div className="space-y-2">
            {Array.from({ length: MAX_PICKS }).map((_, i) => {
              const player = picks[i]
              return (
                <div
                  key={i}
                  className={cn(
                    "flex items-center gap-3 rounded-md border px-3 py-2.5 min-h-[52px]",
                    player
                      ? "border-white/10 bg-white/3"
                      : "border-dashed border-white/8"
                  )}
                >
                  {player ? (
                    <>
                      <div className="h-8 w-8 rounded bg-purple/20 border border-purple/20 flex items-center justify-center shrink-0 overflow-hidden">
                        {player.avatar_url ? (
                          <Image src={player.avatar_url} alt={player.nickname} width={32} height={32} className="object-cover" />
                        ) : (
                          <span className="font-display text-purple text-xs">
                            {player.nickname.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text truncate">{player.nickname}</p>
                        <p className="text-xs text-text-muted">{player.teams?.short_name ?? "—"}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-stats text-xs text-gold">{player.fantasy_cost}</span>
                        <button
                          onClick={() => removePick(player.id)}
                          className="text-text-muted hover:text-danger transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-text-muted italic">
                      Slot {i + 1} — empty
                    </p>
                  )}
                </div>
              )
            })}
          </div>

          {/* Validation status */}
          <div className={cn(
            "flex items-center gap-2 text-xs rounded-md px-3 py-2 border",
            isValid
              ? "bg-success/10 border-success/30 text-success"
              : "bg-white/3 border-white/8 text-text-muted"
          )}>
            {isValid ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            {isValid
              ? "Roster ready to submit!"
              : `Need ${MAX_PICKS - picks.length} more player${MAX_PICKS - picks.length !== 1 ? "s" : ""}`
            }
          </div>

          {/* Save button */}
          <Button
            onClick={handleSave}
            disabled={!isValid || isPending}
            className="w-full bg-gold text-void hover:bg-gold/90 font-medium disabled:opacity-40"
          >
            {isPending ? "Saving..." : existingRoster ? "Update Roster" : "Save Roster"}
          </Button>

          {existingRoster && (
            <p className="text-center text-xs text-text-muted">
              You already have a roster for this phase. Saving will replace it.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
