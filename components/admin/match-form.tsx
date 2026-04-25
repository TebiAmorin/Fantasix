"use client"

import Link from "next/link"
import { upsertMatch } from "@/lib/actions/admin"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AdminSubmit } from "@/components/admin/admin-submit"

interface Team { id: string; name: string; short_name?: string | null }
interface Phase { id: string; name: string; order_index: number }
interface Tournament { id: string; name: string; phases: Phase[] }

interface MatchFormProps {
  teams: Team[]
  tournament: Tournament | null
  match?: {
    id: string
    team_a_id: string
    team_b_id: string
    phase_id?: string | null
    format: string
    scheduled_at?: string | null
    external_stats_url?: string | null
  }
}

const FORMATS = ["bo1", "bo3", "bo5"]

export function MatchForm({ teams, tournament, match }: MatchFormProps) {
  const phases = tournament?.phases?.sort((a, b) => a.order_index - b.order_index) ?? []

  return (
    <form action={upsertMatch} className="card-tactical rounded-lg p-6 space-y-5">
      {match && <input type="hidden" name="id" value={match.id} />}
      <input type="hidden" name="tournament_id" value={tournament?.id ?? ""} />

      {/* Teams */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="team_a_id" className="text-xs text-text-muted uppercase tracking-wider">
            Team A *
          </Label>
          <select
            id="team_a_id"
            name="team_a_id"
            defaultValue={match?.team_a_id ?? ""}
            required
            className="w-full h-9 rounded-md border border-white/8 bg-surface px-3 text-sm text-text focus:outline-none focus:border-purple/50"
          >
            <option value="">— Select team —</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.short_name ?? t.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="team_b_id" className="text-xs text-text-muted uppercase tracking-wider">
            Team B *
          </Label>
          <select
            id="team_b_id"
            name="team_b_id"
            defaultValue={match?.team_b_id ?? ""}
            required
            className="w-full h-9 rounded-md border border-white/8 bg-surface px-3 text-sm text-text focus:outline-none focus:border-purple/50"
          >
            <option value="">— Select team —</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.short_name ?? t.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Format */}
      <div className="space-y-1.5">
        <Label className="text-xs text-text-muted uppercase tracking-wider">Format</Label>
        <div className="flex gap-2">
          {FORMATS.map((f) => (
            <label key={f} className="cursor-pointer">
              <input
                type="radio"
                name="format"
                value={f}
                defaultChecked={match?.format === f || (!match && f === "bo3")}
                className="sr-only peer"
              />
              <span className="px-4 py-2 rounded-md text-sm font-medium border border-white/10 text-text-muted uppercase transition-colors peer-checked:border-gold/50 peer-checked:bg-gold/10 peer-checked:text-gold">
                {f}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Phase */}
      {phases.length > 0 && (
        <div className="space-y-1.5">
          <Label htmlFor="phase_id" className="text-xs text-text-muted uppercase tracking-wider">
            Phase
          </Label>
          <select
            id="phase_id"
            name="phase_id"
            defaultValue={match?.phase_id ?? ""}
            className="w-full h-9 rounded-md border border-white/8 bg-surface px-3 text-sm text-text focus:outline-none focus:border-purple/50"
          >
            <option value="">— No phase —</option>
            {phases.map((p) => (
              <option key={p.id} value={p.id}>{p.order_index}. {p.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Date */}
      <div className="space-y-1.5">
        <Label htmlFor="scheduled_at" className="text-xs text-text-muted uppercase tracking-wider">
          Scheduled Date/Time
        </Label>
        <Input
          id="scheduled_at"
          name="scheduled_at"
          type="datetime-local"
          defaultValue={match?.scheduled_at ? match.scheduled_at.slice(0, 16) : ""}
          className="bg-surface border-white/8 text-text focus-visible:ring-purple"
        />
      </div>

      {/* SiegeGG URL */}
      <div className="space-y-1.5">
        <Label htmlFor="external_stats_url" className="text-xs text-text-muted uppercase tracking-wider">
          SiegeGG Stats URL
        </Label>
        <Input
          id="external_stats_url"
          name="external_stats_url"
          type="url"
          defaultValue={match?.external_stats_url ?? ""}
          placeholder="https://siege.gg/matches/..."
          className="bg-surface border-white/8 text-text font-mono text-xs focus-visible:ring-purple"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <AdminSubmit label={match ? "Save Match" : "Create Match"} />
        <Link href="/admin/matches" className="px-4 py-2 rounded-lg border border-white/10 text-sm text-text-muted hover:text-text transition-colors">
          Cancel
        </Link>
      </div>
    </form>
  )
}
