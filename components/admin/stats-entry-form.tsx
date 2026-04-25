"use client"

import { useState, useTransition } from "react"
import Image from "next/image"
import { CheckCircle2, Loader2, ChevronDown, ChevronUp } from "lucide-react"
import { toast } from "sonner"
import { upsertPlayerStats } from "@/lib/actions/admin"

interface StatField {
  key: string
  label: string
  min?: number
  max?: number
  step?: number
  type?: "number" | "decimal"
  description?: string
}

const STAT_FIELDS: StatField[] = [
  { key: "rounds_played",   label: "Rounds Played",  min: 0, max: 200, description: "Total rounds in the match" },
  { key: "kills",           label: "Kills",           min: 0, max: 100 },
  { key: "deaths",          label: "Deaths",          min: 0, max: 100 },
  { key: "entry_kills",     label: "Entry Kills",     min: 0, max: 50,  description: "+2 bonus (stacks with Kill)" },
  { key: "entry_deaths",    label: "Entry Deaths",    min: 0, max: 50,  description: "-1 penalty (stacks with Death)" },
  { key: "kost",            label: "KOST",            min: 0, max: 1, step: 0.001, type: "decimal", description: "0.000 – 1.000 (e.g. 0.850)" },
  { key: "plants",          label: "Plants",          min: 0, max: 50 },
  { key: "defuses",         label: "Defuses",         min: 0, max: 50 },
  { key: "rounds_survived", label: "Rounds Survived", min: 0, max: 200 },
  { key: "clutch_1v1",      label: "1v1 Clutches",    min: 0, max: 20 },
  { key: "clutch_1v2",      label: "1v2 Clutches",    min: 0, max: 10 },
  { key: "clutch_1v3",      label: "1v3 Clutches",    min: 0, max: 5 },
  { key: "clutch_1v4",      label: "1v4 Clutches",    min: 0, max: 3 },
  { key: "clutch_1v5",      label: "1v5 Clutches",    min: 0, max: 2 },
]

interface StatsEntryFormProps {
  matchId: string
  player: {
    id: string
    nickname: string
    real_name?: string | null
    avatar_url?: string | null
    role?: string | null
  }
  existingStats?: Record<string, number> | null
}

export function StatsEntryForm({ matchId, player, existingStats }: StatsEntryFormProps) {
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(!!existingStats)
  const [expanded, setExpanded] = useState(!existingStats)

  // Local state for each stat field
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    STAT_FIELDS.forEach((f) => {
      const existing = existingStats?.[f.key]
      init[f.key] = existing !== undefined ? String(existing) : "0"
    })
    return init
  })

  const handleSave = () => {
    startTransition(async () => {
      const fd = new FormData()
      fd.set("match_id",  matchId)
      fd.set("player_id", player.id)
      Object.entries(values).forEach(([k, v]) => fd.set(k, v))

      const result = await upsertPlayerStats(fd)
      if (result.error) {
        toast.error(`${player.nickname}: ${result.error}`)
      } else {
        setSaved(true)
        setExpanded(false)
        toast.success(`${player.nickname} stats saved`)
      }
    })
  }

  // Quick preview of key stats
  const k  = parseFloat(values.kills  ?? "0")
  const d  = parseFloat(values.deaths ?? "0")
  const kd = d > 0 ? (k / d).toFixed(2) : k > 0 ? "∞" : "—"

  return (
    <div className={`rounded-lg border transition-colors overflow-hidden ${
      saved ? "border-white/10 bg-white/2" : "border-purple/20 bg-purple/3"
    }`}>
      {/* Collapsed header */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/3 transition-colors text-left"
      >
        {player.avatar_url ? (
          <div className="relative h-8 w-8 rounded overflow-hidden shrink-0">
            <Image src={player.avatar_url} alt={player.nickname} fill className="object-cover" sizes="32px" />
          </div>
        ) : (
          <div className="h-8 w-8 rounded bg-purple/20 border border-purple/20 flex items-center justify-center shrink-0">
            <span className="font-display text-purple text-xs">{player.nickname.slice(0,2).toUpperCase()}</span>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text">{player.nickname}</p>
          <p className="text-xs text-text-muted">{player.role ?? "—"}</p>
        </div>

        {/* Quick stats preview */}
        {saved && (
          <div className="hidden sm:flex items-center gap-4 text-xs mr-2">
            <span className="text-text-muted">K <span className="text-text font-stats font-bold">{values.kills}</span></span>
            <span className="text-text-muted">D <span className="text-text font-stats font-bold">{values.deaths}</span></span>
            <span className="text-text-muted">K/D <span className="text-gold font-stats font-bold">{kd}</span></span>
            <span className="text-text-muted">KOST <span className="text-purple font-stats font-bold">{(parseFloat(values.kost ?? "0") * 100).toFixed(0)}%</span></span>
          </div>
        )}

        {saved && <CheckCircle2 className="h-4 w-4 text-success shrink-0" />}
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-text-muted shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-text-muted shrink-0" />
        )}
      </button>

      {/* Expanded form */}
      {expanded && (
        <div className="border-t border-white/8 px-4 py-4 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3">
            {STAT_FIELDS.map((field) => (
              <div key={field.key} className="space-y-1">
                <label className="text-[10px] text-text-muted uppercase tracking-wider block">
                  {field.label}
                  {field.description && (
                    <span className="ml-1 text-purple opacity-70">({field.description})</span>
                  )}
                </label>
                <input
                  type="number"
                  value={values[field.key] ?? "0"}
                  onChange={(e) => setValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  min={field.min ?? 0}
                  max={field.max}
                  step={field.step ?? 1}
                  className="w-full h-8 rounded border border-white/8 bg-surface px-2 text-sm font-stats text-center text-text focus:outline-none focus:border-purple/50 hover:border-white/20"
                />
              </div>
            ))}
          </div>

          {/* Live K/D preview */}
          <div className="flex items-center gap-4 px-1 text-xs text-text-muted border-t border-white/8 pt-3">
            <span>K/D: <strong className="text-gold font-stats">{kd}</strong></span>
            <span>KOST: <strong className="text-purple font-stats">{(parseFloat(values.kost ?? "0") * 100).toFixed(1)}%</strong></span>
            <span>Clutches: <strong className="text-text font-stats">
              {[1,2,3,4,5].reduce((sum, n) => sum + (parseInt(values[`clutch_1v${n}`] ?? "0") || 0), 0)}
            </strong></span>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gold text-void text-sm font-medium hover:bg-gold/90 transition-colors disabled:opacity-50"
          >
            {isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
            ) : (
              <>Save {player.nickname}&apos;s Stats</>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
