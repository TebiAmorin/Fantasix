"use client"

import { useState, useTransition } from "react"
import Image from "next/image"
import { Trophy, Loader2, Radio } from "lucide-react"
import { toast } from "sonner"
import { setMatchResult, setMatchLive } from "@/lib/actions/admin"

interface Team { id: string; name: string; short_name?: string | null; logo_url?: string | null }

interface MatchResultFormProps {
  matchId: string
  teamA: Team
  teamB: Team
  currentStatus: string
  currentWinnerId?: string | null
  currentMapsA?: number
  currentMapsB?: number
  externalUrl?: string | null
  format: string
}

export function MatchResultForm({
  matchId, teamA, teamB,
  currentStatus, currentWinnerId,
  currentMapsA = 0, currentMapsB = 0,
  externalUrl, format,
}: MatchResultFormProps) {
  const [winnerId, setWinnerId] = useState(currentWinnerId ?? "")
  const [mapsA, setMapsA] = useState(currentMapsA)
  const [mapsB, setMapsB] = useState(currentMapsB)
  const [url, setUrl]     = useState(externalUrl ?? "")
  const [isPending, startTransition] = useTransition()
  const [livePending, startLiveTransition] = useTransition()

  const maxMaps = format === "bo5" ? 5 : format === "bo3" ? 3 : 1

  const handleSave = () => {
    if (!winnerId) { toast.error("Select a winner first"); return }

    startTransition(async () => {
      const fd = new FormData()
      fd.set("match_id",           matchId)
      fd.set("winner_id",          winnerId)
      fd.set("team_a_maps_won",    String(mapsA))
      fd.set("team_b_maps_won",    String(mapsB))
      fd.set("external_stats_url", url)

      const result = await setMatchResult(fd)
      if (result.error) toast.error(result.error)
      else toast.success("Match result saved!")
    })
  }

  const handleLive = () => {
    startLiveTransition(async () => {
      await setMatchLive(matchId)
      toast.success("Match set to LIVE")
    })
  }

  if (currentStatus === "completed") {
    return (
      <div className="card-tactical rounded-lg p-4 flex items-center gap-3 accent-gold-top">
        <Trophy className="h-4 w-4 text-gold" />
        <div>
          <p className="text-sm text-text font-medium">
            Winner: <span className="text-gold">
              {currentWinnerId === teamA.id ? (teamA.short_name ?? teamA.name) : (teamB.short_name ?? teamB.name)}
            </span>
            <span className="text-text-muted ml-2 font-stats">{currentMapsA}–{currentMapsB}</span>
          </p>
          <p className="text-xs text-text-muted">Match completed. Edit stats below if needed.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="card-tactical rounded-lg p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base text-text uppercase tracking-wide">Set Result</h3>
        {currentStatus === "scheduled" && (
          <button
            type="button"
            onClick={handleLive}
            disabled={livePending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-live/10 border border-live/30 text-live text-xs hover:bg-live/20 transition-colors disabled:opacity-50"
          >
            <Radio className="h-3.5 w-3.5" />
            {livePending ? "..." : "Set Live"}
          </button>
        )}
      </div>

      {/* Winner selection */}
      <div className="space-y-2">
        <p className="text-xs text-text-muted uppercase tracking-wider">Winner *</p>
        <div className="grid grid-cols-2 gap-3">
          {[teamA, teamB].map((team) => (
            <button
              key={team.id}
              type="button"
              onClick={() => setWinnerId(team.id)}
              className={`flex items-center gap-2 p-3 rounded-lg border transition-colors ${
                winnerId === team.id
                  ? "border-gold/50 bg-gold/10"
                  : "border-white/10 hover:border-white/25 hover:bg-white/3"
              }`}
            >
              {team.logo_url && (
                <Image src={team.logo_url} alt={team.name} width={20} height={20} className="object-contain" />
              )}
              <span className={`text-sm font-medium ${winnerId === team.id ? "text-gold" : "text-text"}`}>
                {team.short_name ?? team.name}
              </span>
              {winnerId === team.id && <Trophy className="h-3.5 w-3.5 text-gold ml-auto" />}
            </button>
          ))}
        </div>
      </div>

      {/* Map score for Bo3/Bo5 */}
      {maxMaps > 1 && (
        <div className="flex items-center gap-4">
          <div className="space-y-1 flex-1">
            <p className="text-xs text-text-muted">{teamA.short_name ?? teamA.name} maps won</p>
            <div className="flex gap-1">
              {Array.from({ length: Math.ceil(maxMaps / 2) + 1 }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setMapsA(i)}
                  className={`w-8 h-8 rounded text-sm font-stats font-bold transition-colors ${
                    mapsA === i ? "bg-gold text-void" : "bg-white/5 text-text-muted hover:bg-white/10"
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>
          <span className="text-text-muted font-stats text-lg mt-4">—</span>
          <div className="space-y-1 flex-1">
            <p className="text-xs text-text-muted">{teamB.short_name ?? teamB.name} maps won</p>
            <div className="flex gap-1">
              {Array.from({ length: Math.ceil(maxMaps / 2) + 1 }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setMapsB(i)}
                  className={`w-8 h-8 rounded text-sm font-stats font-bold transition-colors ${
                    mapsB === i ? "bg-gold text-void" : "bg-white/5 text-text-muted hover:bg-white/10"
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SiegeGG URL */}
      <div className="space-y-1">
        <p className="text-xs text-text-muted">SiegeGG Stats URL</p>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://siege.gg/matches/..."
          className="w-full h-8 rounded border border-white/8 bg-surface px-3 text-xs font-mono text-text focus:outline-none focus:border-purple/50"
        />
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={isPending || !winnerId}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gold text-void text-sm font-medium hover:bg-gold/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trophy className="h-4 w-4" />}
        {isPending ? "Saving..." : "Save Result"}
      </button>
    </div>
  )
}
