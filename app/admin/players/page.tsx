import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import Image from "next/image"
import { Plus, Pencil, Coins } from "lucide-react"
import { DeleteButton } from "@/components/admin/delete-button"
import { deletePlayer } from "@/lib/actions/admin"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Players — Admin" }

export default async function PlayersPage() {
  const supabase = await createClient()
  const { data: players } = await supabase
    .from("players")
    .select("*, teams(name, short_name, logo_url)")
    .eq("is_active", true)
    .order("fantasy_cost", { ascending: false })

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-text">Players</h1>
          <p className="text-text-muted text-sm mt-0.5">{players?.length ?? 0} active players</p>
        </div>
        <Link
          href="/admin/players/new"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gold text-void text-sm font-medium hover:bg-gold/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Player
        </Link>
      </div>

      <div className="card-tactical rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/8">
              <th className="text-left py-3 px-4 text-xs text-text-muted font-medium uppercase tracking-wider">Player</th>
              <th className="text-left py-3 px-4 text-xs text-text-muted font-medium uppercase tracking-wider hidden sm:table-cell">Team</th>
              <th className="text-left py-3 px-4 text-xs text-text-muted font-medium uppercase tracking-wider hidden md:table-cell">Role</th>
              <th className="text-right py-3 px-4 text-xs text-text-muted font-medium uppercase tracking-wider">Cost</th>
              <th className="py-3 px-4 w-24"></th>
            </tr>
          </thead>
          <tbody>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(players as any[] ?? []).map((player) => (
              <tr key={player.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    {player.avatar_url ? (
                      <div className="relative h-8 w-8 rounded overflow-hidden shrink-0">
                        <Image src={player.avatar_url} alt={player.nickname} fill className="object-cover" sizes="32px" />
                      </div>
                    ) : (
                      <div className="h-8 w-8 rounded bg-purple/20 border border-purple/20 flex items-center justify-center shrink-0">
                        <span className="font-display text-purple text-xs">{player.nickname.slice(0,2).toUpperCase()}</span>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-text">{player.nickname}</p>
                      {player.real_name && <p className="text-xs text-text-muted">{player.real_name}</p>}
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 hidden sm:table-cell">
                  <div className="flex items-center gap-1.5">
                    {player.teams?.logo_url && (
                      <Image src={player.teams.logo_url} alt="" width={16} height={16} className="object-contain" />
                    )}
                    <span className="text-sm text-text-muted">{player.teams?.short_name ?? player.teams?.name ?? "—"}</span>
                  </div>
                </td>
                <td className="py-3 px-4 hidden md:table-cell">
                  <span className="text-xs text-text-muted">{player.role ?? "—"}</span>
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Coins className="h-3.5 w-3.5 text-gold" />
                    <span className="font-stats text-sm font-bold text-gold">{player.fantasy_cost}</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center justify-end gap-2">
                    <Link href={`/admin/players/${player.id}/edit`} className="p-1.5 rounded-md text-text-muted hover:text-text hover:bg-white/5 transition-colors">
                      <Pencil className="h-3.5 w-3.5" />
                    </Link>
                    <DeleteButton id={player.id} action={deletePlayer} label="player" />
                  </div>
                </td>
              </tr>
            ))}
            {(!players || players.length === 0) && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-text-muted text-sm">
                  No players yet. <Link href="/admin/players/new" className="text-purple hover:underline">Add your first player →</Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
