"use client"

import { useState } from "react"
import Link from "next/link"
import { upsertTeam } from "@/lib/actions/admin"
import { ImageUpload } from "@/components/admin/image-upload"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AdminSubmit } from "@/components/admin/admin-submit"
import type { Team } from "@/lib/types/database.types"

const REGIONS = ["EU", "NA", "LATAM", "APAC", "BR"]

interface TeamFormProps {
  team?: Team
}

export function TeamForm({ team }: TeamFormProps) {
  const [logoUrl, setLogoUrl] = useState(team?.logo_url ?? "")

  return (
    <form action={upsertTeam} className="card-tactical rounded-lg p-6 space-y-5">
      {team && <input type="hidden" name="id" value={team.id} />}
      <input type="hidden" name="logo_url" value={logoUrl} />

      <ImageUpload
        bucket="team-logos"
        currentUrl={team?.logo_url}
        onUpload={setLogoUrl}
        inputName="_logo_display"
        label="Team Logo"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-xs text-text-muted uppercase tracking-wider">
            Team Name *
          </Label>
          <Input
            id="name"
            name="name"
            defaultValue={team?.name}
            placeholder="e.g. Team Vitality"
            required
            className="bg-surface border-white/8 text-text focus-visible:ring-purple"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="short_name" className="text-xs text-text-muted uppercase tracking-wider">
            Short Name / Tag
          </Label>
          <Input
            id="short_name"
            name="short_name"
            defaultValue={team?.short_name ?? ""}
            placeholder="e.g. VIT"
            maxLength={6}
            className="bg-surface border-white/8 text-text focus-visible:ring-purple"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-text-muted uppercase tracking-wider">Region</Label>
        <div className="flex gap-2 flex-wrap">
          {REGIONS.map((r) => (
            <label key={r} className="cursor-pointer">
              <input
                type="radio"
                name="region"
                value={r}
                defaultChecked={team?.region === r}
                className="sr-only peer"
              />
              <span className="px-3 py-1.5 rounded-md text-xs font-medium border border-white/10 text-text-muted transition-colors peer-checked:border-purple/50 peer-checked:bg-purple/15 peer-checked:text-purple">
                {r}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <AdminSubmit label={team ? "Save Changes" : "Create Team"} />
        <Link
          href="/admin/teams"
          className="px-4 py-2 rounded-lg border border-white/10 text-sm text-text-muted hover:text-text hover:border-white/20 transition-colors"
        >
          Cancel
        </Link>
      </div>
    </form>
  )
}
