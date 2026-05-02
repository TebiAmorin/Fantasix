"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { Loader2, Settings } from "lucide-react"
import { updateScoringConfig } from "@/lib/actions/admin"

interface ScoringRow {
  stat_key: string
  label: string
  value: number
  description: string | null
}

const GROUPS = [
  {
    title: "Kill / Death",
    keys: ["kill", "death", "entry_kill_bonus", "entry_death_penalty"],
  },
  {
    title: "Objective",
    keys: ["plant", "defuse"],
  },
  {
    title: "Survival & Performance",
    keys: ["survival", "kost_multiplier"],
  },
  {
    title: "Clutches",
    keys: ["clutch_per_enemy"],
  },
  {
    title: "Map Outcome",
    keys: ["map_win_bonus", "map_loss_penalty"],
  },
]

interface ScoringConfigFormProps {
  rows: ScoringRow[]
}

export function ScoringConfigForm({ rows }: ScoringConfigFormProps) {
  const [isPending, startTransition] = useTransition()
  const configMap = Object.fromEntries(rows.map((r) => [r.stat_key, r]))

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await updateScoringConfig(fd)
      if (result?.error) {
        toast.error(result.error as string)
      } else {
        toast.success("Scoring config saved!")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {GROUPS.map((group) => {
        const groupRows = group.keys.map((k) => configMap[k]).filter(Boolean)
        if (groupRows.length === 0) return null

        return (
          <div key={group.title} className="card-tactical rounded-lg p-5 space-y-4">
            <h2 className="font-display text-sm text-text uppercase tracking-wide flex items-center gap-2">
              <Settings className="h-3.5 w-3.5 text-purple" />
              {group.title}
            </h2>

            <div className="divide-y divide-white/5">
              {groupRows.map((row) => (
                <div
                  key={row.stat_key}
                  className="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex-1 min-w-0">
                    <label
                      htmlFor={`scoring_${row.stat_key}`}
                      className="text-sm font-medium text-text block"
                    >
                      {row.label}
                    </label>
                    {row.description && (
                      <p className="text-xs text-text-muted mt-0.5">{row.description}</p>
                    )}
                    <p className="text-[10px] text-text-muted/50 font-mono mt-0.5">
                      {row.stat_key}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      id={`scoring_${row.stat_key}`}
                      name={`scoring_${row.stat_key}`}
                      type="number"
                      defaultValue={Number(row.value)}
                      step="0.01"
                      className="w-24 h-9 rounded-md border border-white/8 bg-surface px-3 text-sm font-stats text-center text-text focus:outline-none focus:border-red/30 hover:border-white/20"
                    />
                    <span className="text-xs text-text-muted w-4">pts</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {/* Ungrouped keys */}
      {(() => {
        const groupedKeys = new Set(GROUPS.flatMap((g) => g.keys))
        const ungrouped = rows.filter((r) => !groupedKeys.has(r.stat_key))
        if (ungrouped.length === 0) return null

        return (
          <div className="card-tactical rounded-lg p-5 space-y-4">
            <h2 className="font-display text-sm text-text uppercase tracking-wide flex items-center gap-2">
              <Settings className="h-3.5 w-3.5 text-purple" />
              Other
            </h2>
            <div className="divide-y divide-white/5">
              {ungrouped.map((row) => (
                <div
                  key={row.stat_key}
                  className="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex-1 min-w-0">
                    <label
                      htmlFor={`scoring_${row.stat_key}`}
                      className="text-sm font-medium text-text block"
                    >
                      {row.label}
                    </label>
                    {row.description && (
                      <p className="text-xs text-text-muted mt-0.5">{row.description}</p>
                    )}
                    <p className="text-[10px] text-text-muted/50 font-mono mt-0.5">
                      {row.stat_key}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      id={`scoring_${row.stat_key}`}
                      name={`scoring_${row.stat_key}`}
                      type="number"
                      defaultValue={Number(row.value)}
                      step="0.01"
                      className="w-24 h-9 rounded-md border border-white/8 bg-surface px-3 text-sm font-stats text-center text-text focus:outline-none focus:border-red/30 hover:border-white/20"
                    />
                    <span className="text-xs text-text-muted w-4">pts</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })()}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gold text-void text-sm font-medium hover:bg-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {isPending ? "Saving..." : "Save Scoring Config"}
        </button>
        <p className="text-xs text-text-muted">
          Changes apply to all future stat saves via Postgres trigger.
        </p>
      </div>
    </form>
  )
}
