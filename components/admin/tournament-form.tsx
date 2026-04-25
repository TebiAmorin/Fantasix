"use client"

import { useState } from "react"
import Link from "next/link"
import { upsertTournament } from "@/lib/actions/admin"
import { ImageUpload } from "@/components/admin/image-upload"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AdminSubmit } from "@/components/admin/admin-submit"

interface TournamentFormProps {
  tournament?: {
    id: string
    name: string
    slug: string
    is_active: boolean
    start_date?: string | null
    end_date?: string | null
    logo_url?: string | null
  }
}

export function TournamentForm({ tournament }: TournamentFormProps) {
  const [logoUrl, setLogoUrl] = useState(tournament?.logo_url ?? "")
  const [name, setName] = useState(tournament?.name ?? "")

  const autoSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 60)

  return (
    <form action={upsertTournament} className="card-tactical rounded-lg p-6 space-y-5">
      {tournament && <input type="hidden" name="id" value={tournament.id} />}
      <input type="hidden" name="logo_url" value={logoUrl} />

      <ImageUpload
        bucket="tournament-logos"
        currentUrl={tournament?.logo_url}
        onUpload={setLogoUrl}
        inputName="_logo_display"
        label="Tournament Logo"
      />

      <div className="space-y-1.5">
        <Label htmlFor="name" className="text-xs text-text-muted uppercase tracking-wider">
          Tournament Name *
        </Label>
        <Input
          id="name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. BLAST R6 Major Salt Lake City 2026"
          required
          className="bg-surface border-white/8 text-text focus-visible:ring-purple"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="slug" className="text-xs text-text-muted uppercase tracking-wider">
          Slug (URL identifier)
        </Label>
        <Input
          id="slug"
          name="slug"
          defaultValue={tournament?.slug ?? autoSlug}
          placeholder="e.g. blast-major-slc-2026"
          required
          className="bg-surface border-white/8 text-text font-mono text-sm focus-visible:ring-purple"
        />
        {!tournament && name && (
          <p className="text-[10px] text-text-muted">Auto-suggested: <code className="text-purple">{autoSlug}</code></p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="start_date" className="text-xs text-text-muted uppercase tracking-wider">
            Start Date
          </Label>
          <Input
            id="start_date"
            name="start_date"
            type="date"
            defaultValue={tournament?.start_date ?? ""}
            className="bg-surface border-white/8 text-text focus-visible:ring-purple"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="end_date" className="text-xs text-text-muted uppercase tracking-wider">
            End Date
          </Label>
          <Input
            id="end_date"
            name="end_date"
            type="date"
            defaultValue={tournament?.end_date ?? ""}
            className="bg-surface border-white/8 text-text focus-visible:ring-purple"
          />
        </div>
      </div>

      {/* Active toggle */}
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          name="is_active"
          value="true"
          defaultChecked={tournament?.is_active ?? false}
          className="sr-only peer"
        />
        <div className="relative w-10 h-5 rounded-full bg-white/10 peer-checked:bg-gold/40 transition-colors">
          <div className="absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white/40 peer-checked:translate-x-5 transition-transform" />
        </div>
        <span className="text-sm text-text-muted">
          Set as <span className="text-gold">active tournament</span>{" "}
          <span className="text-xs">(deactivates others)</span>
        </span>
      </label>

      <div className="flex gap-3 pt-2">
        <AdminSubmit label={tournament ? "Save Changes" : "Create Tournament"} />
        <Link href="/admin/tournaments" className="px-4 py-2 rounded-lg border border-white/10 text-sm text-text-muted hover:text-text transition-colors">
          Cancel
        </Link>
      </div>
    </form>
  )
}
