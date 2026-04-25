import { createClient } from "@/lib/supabase/server"
import { ScoringConfigForm } from "@/components/admin/scoring-config-form"
import { Info } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Scoring Config — Admin" }

interface ScoringRow {
  stat_key: string
  label: string
  value: number
  description: string | null
  updated_at: string
}

export default async function ScoringPage() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("scoring_config")
    .select("stat_key, label, value, description, updated_at")
    .order("stat_key")

  const rows = (data ?? []) as ScoringRow[]

  const lastUpdated = rows.reduce<string | null>((latest, r) => {
    if (!latest || r.updated_at > latest) return r.updated_at
    return latest
  }, null)

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-text">Scoring Config</h1>
          <p className="text-text-muted text-sm mt-0.5">
            Adjust fantasy point values for each stat. Postgres trigger
            recalculates on next stat save.
          </p>
        </div>
        {lastUpdated && (
          <p className="text-[10px] text-text-muted shrink-0 mt-1 whitespace-nowrap">
            Last saved{" "}
            {new Date(lastUpdated).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          Failed to load scoring config: {error.message}
        </div>
      )}

      {/* Formula reference */}
      <div className="card-tactical rounded-lg p-4 flex gap-3">
        <Info className="h-4 w-4 text-purple shrink-0 mt-0.5" />
        <div className="space-y-1.5 text-xs text-text-muted leading-relaxed">
          <p className="text-text font-medium text-sm">Points formula (per player per match)</p>
          <p>
            <span className="text-gold font-stats">Kills × kill</span>
            {" + "}
            <span className="text-gold font-stats">Deaths × death</span>
            {" + "}
            <span className="text-gold font-stats">EntryKills × entry_kill_bonus</span>
            {" + "}
            <span className="text-gold font-stats">EntryDeaths × entry_death_penalty</span>
          </p>
          <p>
            {"+ "}
            <span className="text-purple font-stats">Plants × plant</span>
            {" + "}
            <span className="text-purple font-stats">Defuses × defuse</span>
            {" + "}
            <span className="text-purple font-stats">RoundsSurvived × survival</span>
          </p>
          <p>
            {"+ "}
            <span className="text-text font-stats">KOST × kost_multiplier</span>
            {" + "}
            <span className="text-text font-stats">
              Σ(clutch_1vN × N) × clutch_per_enemy
            </span>
          </p>
          <p className="text-text-muted/60 italic">
            Entry kills stack with regular kills (e.g. entry kill = kill + entry_kill_bonus).
          </p>
        </div>
      </div>

      <ScoringConfigForm rows={rows.map((r) => ({ ...r, value: Number(r.value) }))} />
    </div>
  )
}
