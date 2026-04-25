"use client"

import { useState } from "react"
import Link from "next/link"
import { upsertPhase } from "@/lib/actions/admin"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AdminSubmit } from "@/components/admin/admin-submit"
import type { Phase } from "@/lib/types/database.types"

const PHASE_TYPES = [
  { value: "double_elimination", label: "Double Elimination" },
  { value: "swiss",              label: "Swiss Stage" },
  { value: "playoffs",           label: "Playoffs" },
  { value: "groups",             label: "Group Stage" },
]

interface PhaseFormProps {
  tournamentId: string
  phase?: Phase
}

export function PhaseForm({ tournamentId, phase }: PhaseFormProps) {
  const [salaryCap, setSalaryCap] = useState(phase?.salary_cap ?? 100)
  const [draftOpen, setDraftOpen] = useState(phase?.draft_open ?? false)
  const [isActive, setIsActive] = useState(phase?.is_active ?? false)

  return (
    <form action={upsertPhase} className="card-tactical rounded-lg p-6 space-y-5">
      <input type="hidden" name="tournament_id" value={tournamentId} />
      <input type="hidden" name="salary_cap"    value={salaryCap} />
      <input type="hidden" name="draft_open"    value={String(draftOpen)} />
      <input type="hidden" name="is_active"     value={String(isActive)} />
      {phase && <input type="hidden" name="id" value={phase.id} />}

      <div className="space-y-1.5">
        <Label htmlFor="name" className="text-xs text-text-muted uppercase tracking-wider">
          Phase Name *
        </Label>
        <Input
          id="name"
          name="name"
          defaultValue={phase?.name}
          placeholder="e.g. Double Elimination Stage"
          required
          className="bg-surface border-white/8 text-text focus-visible:ring-purple"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-text-muted uppercase tracking-wider">Phase Type</Label>
        <div className="grid grid-cols-2 gap-2">
          {PHASE_TYPES.map(({ value, label }) => (
            <label key={value} className="cursor-pointer">
              <input
                type="radio"
                name="type"
                value={value}
                defaultChecked={phase?.type === value || (!phase && value === "swiss")}
                className="sr-only peer"
              />
              <span className="block px-3 py-2 rounded-md text-sm border border-white/10 text-text-muted text-center transition-colors peer-checked:border-purple/50 peer-checked:bg-purple/15 peer-checked:text-purple">
                {label}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="order_index" className="text-xs text-text-muted uppercase tracking-wider">
            Order (1=first)
          </Label>
          <Input
            id="order_index"
            name="order_index"
            type="number"
            min={1}
            max={10}
            defaultValue={phase?.order_index ?? 1}
            className="bg-surface border-white/8 text-text focus-visible:ring-purple"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-text-muted uppercase tracking-wider">
            Salary Cap — <span className="text-gold font-stats">{salaryCap}</span>
          </Label>
          <Input
            type="number"
            min={10}
            max={999}
            value={salaryCap}
            onChange={(e) => setSalaryCap(parseInt(e.target.value) || 100)}
            className="bg-surface border-white/8 text-text focus-visible:ring-purple"
          />
        </div>
      </div>

      {/* Toggles */}
      <div className="space-y-3">
        <label className="flex items-center gap-3 cursor-pointer">
          <div
            onClick={() => setIsActive(!isActive)}
            className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${isActive ? "bg-gold/40" : "bg-white/10"}`}
          >
            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white/60 transition-transform ${isActive ? "translate-x-5" : "translate-x-0.5"}`} />
          </div>
          <span className="text-sm text-text-muted">
            <span className="text-gold">Active phase</span>{" "}
            <span className="text-xs">(players earn points)</span>
          </span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <div
            onClick={() => setDraftOpen(!draftOpen)}
            className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${draftOpen ? "bg-success/40" : "bg-white/10"}`}
          >
            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white/60 transition-transform ${draftOpen ? "translate-x-5" : "translate-x-0.5"}`} />
          </div>
          <span className="text-sm text-text-muted">
            <span className="text-success">Draft open</span>{" "}
            <span className="text-xs">(users can pick players)</span>
          </span>
        </label>
      </div>

      <div className="flex gap-3 pt-2">
        <AdminSubmit label={phase ? "Save Phase" : "Create Phase"} />
        <Link href="/admin/tournaments" className="px-4 py-2 rounded-lg border border-white/10 text-sm text-text-muted hover:text-text transition-colors">
          Cancel
        </Link>
      </div>
    </form>
  )
}
