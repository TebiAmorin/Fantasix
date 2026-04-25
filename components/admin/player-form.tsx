"use client"

import { useState } from "react"
import Link from "next/link"
import { upsertPlayer } from "@/lib/actions/admin"
import { ImageUpload } from "@/components/admin/image-upload"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AdminSubmit } from "@/components/admin/admin-submit"
import type { Player, Team } from "@/lib/types/database.types"

const ROLES = ["Hard Breach", "Soft Breach", "Support", "Anchor", "Flex"]
const COST_PRESETS = [6, 8, 10, 12, 15, 18, 20]

interface PlayerFormProps {
  player?: Player
  teams: Team[]
}

export function PlayerForm({ player, teams }: PlayerFormProps) {
  const [avatarUrl, setAvatarUrl] = useState(player?.avatar_url ?? "")
  const [cost, setCost] = useState(player?.fantasy_cost ?? 10)

  return (
    <form action={upsertPlayer} className="card-tactical rounded-lg p-6 space-y-5">
      {player && <input type="hidden" name="id" value={player.id} />}
      <input type="hidden" name="avatar_url" value={avatarUrl} />
      <input type="hidden" name="fantasy_cost" value={cost} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: avatar */}
        <div>
          <ImageUpload
            bucket="player-avatars"
            currentUrl={player?.avatar_url}
            onUpload={setAvatarUrl}
            inputName="_avatar_display"
            label="Player Photo"
          />
        </div>

        {/* Right: fields */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="nickname" className="text-xs text-text-muted uppercase tracking-wider">
                Nickname *
              </Label>
              <Input
                id="nickname"
                name="nickname"
                defaultValue={player?.nickname}
                placeholder="e.g. Beaulo"
                required
                className="bg-surface border-white/8 text-text focus-visible:ring-purple"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="real_name" className="text-xs text-text-muted uppercase tracking-wider">
                Real Name
              </Label>
              <Input
                id="real_name"
                name="real_name"
                defaultValue={player?.real_name ?? ""}
                placeholder="e.g. Jason Doty"
                className="bg-surface border-white/8 text-text focus-visible:ring-purple"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="team_id" className="text-xs text-text-muted uppercase tracking-wider">
                Team
              </Label>
              <select
                id="team_id"
                name="team_id"
                defaultValue={player?.team_id ?? ""}
                className="w-full h-9 rounded-md border border-white/8 bg-surface px-3 text-sm text-text focus:outline-none focus:border-purple/50"
              >
                <option value="">— No team —</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="nationality" className="text-xs text-text-muted uppercase tracking-wider">
                Nationality
              </Label>
              <Input
                id="nationality"
                name="nationality"
                defaultValue={player?.nationality ?? ""}
                placeholder="e.g. French"
                className="bg-surface border-white/8 text-text focus-visible:ring-purple"
              />
            </div>
          </div>

          {/* Role */}
          <div className="space-y-1.5">
            <Label className="text-xs text-text-muted uppercase tracking-wider">Role</Label>
            <div className="flex gap-2 flex-wrap">
              {ROLES.map((r) => (
                <label key={r} className="cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    value={r}
                    defaultChecked={player?.role === r}
                    className="sr-only peer"
                  />
                  <span className="px-3 py-1.5 rounded-md text-xs font-medium border border-white/10 text-text-muted transition-colors peer-checked:border-gold/50 peer-checked:bg-gold/10 peer-checked:text-gold">
                    {r}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Fantasy cost */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-text-muted uppercase tracking-wider">
                Fantasy Cost
              </Label>
              <span className="font-stats text-lg font-bold text-gold">{cost}</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {COST_PRESETS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCost(c)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                    cost === c
                      ? "border-gold/50 bg-gold/10 text-gold"
                      : "border-white/10 text-text-muted hover:text-text"
                  }`}
                >
                  {c}
                </button>
              ))}
              <input
                type="number"
                min={1}
                max={99}
                value={cost}
                onChange={(e) => setCost(parseInt(e.target.value) || 10)}
                className="w-16 h-8 rounded-md border border-white/8 bg-surface px-2 text-xs text-center text-text focus:outline-none focus:border-purple/50"
                placeholder="Custom"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-2 border-t border-white/8">
        <AdminSubmit label={player ? "Save Changes" : "Create Player"} />
        <Link
          href="/admin/players"
          className="px-4 py-2 rounded-lg border border-white/10 text-sm text-text-muted hover:text-text hover:border-white/20 transition-colors"
        >
          Cancel
        </Link>
      </div>
    </form>
  )
}
