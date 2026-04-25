import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import Image from "next/image"
import { Plus, Pencil, Globe } from "lucide-react"
import { DeleteButton } from "@/components/admin/delete-button"
import { deleteTeam } from "@/lib/actions/admin"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Teams — Admin" }

const REGION_COLORS: Record<string, string> = {
  EU:    "text-blue-400 bg-blue-400/10 border-blue-400/20",
  NA:    "text-red-400 bg-red-400/10 border-red-400/20",
  LATAM: "text-green-400 bg-green-400/10 border-green-400/20",
  APAC:  "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
}

export default async function TeamsPage() {
  const supabase = await createClient()
  const { data: teams } = await supabase
    .from("teams")
    .select("*, players(count)")
    .order("name")

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-text">Teams</h1>
          <p className="text-text-muted text-sm mt-0.5">{teams?.length ?? 0} teams total</p>
        </div>
        <Link
          href="/admin/teams/new"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gold text-void text-sm font-medium hover:bg-gold/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Team
        </Link>
      </div>

      <div className="card-tactical rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/8">
              <th className="text-left py-3 px-4 text-xs text-text-muted font-medium uppercase tracking-wider">Team</th>
              <th className="text-left py-3 px-4 text-xs text-text-muted font-medium uppercase tracking-wider hidden sm:table-cell">Region</th>
              <th className="text-left py-3 px-4 text-xs text-text-muted font-medium uppercase tracking-wider hidden md:table-cell">Players</th>
              <th className="py-3 px-4 w-24"></th>
            </tr>
          </thead>
          <tbody>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(teams as any[] ?? []).map((team) => (
              <tr key={team.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    {team.logo_url ? (
                      <div className="relative h-8 w-8 shrink-0">
                        <Image
                          src={team.logo_url}
                          alt={team.name}
                          fill
                          className="object-contain"
                          sizes="32px"
                         
                        />
                      </div>
                    ) : (
                      <div className="h-8 w-8 rounded bg-purple/20 border border-purple/20 flex items-center justify-center shrink-0">
                        <Globe className="h-4 w-4 text-purple" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-text">{team.name}</p>
                      {team.short_name && (
                        <p className="text-xs text-text-muted">{team.short_name}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 hidden sm:table-cell">
                  {team.region ? (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border font-medium ${REGION_COLORS[team.region] ?? "text-text-muted border-white/10"}`}>
                      {team.region}
                    </span>
                  ) : (
                    <span className="text-text-muted text-xs">—</span>
                  )}
                </td>
                <td className="py-3 px-4 hidden md:table-cell">
                  <span className="font-stats text-sm text-text-muted">
                    {team.players?.[0]?.count ?? 0}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/teams/${team.id}/edit`}
                      className="p-1.5 rounded-md text-text-muted hover:text-text hover:bg-white/5 transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Link>
                    <DeleteButton id={team.id} action={deleteTeam} label="team" />
                  </div>
                </td>
              </tr>
            ))}
            {(!teams || teams.length === 0) && (
              <tr>
                <td colSpan={4} className="py-12 text-center text-text-muted text-sm">
                  No teams yet. <Link href="/admin/teams/new" className="text-purple hover:underline">Add your first team →</Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
