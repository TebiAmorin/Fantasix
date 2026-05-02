import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import Image from "next/image"
import { Plus, Pencil, ExternalLink, Clock, CheckCircle2, Radio, Settings2 } from "lucide-react"
import { MatchStatusActions } from "@/components/admin/match-status-actions"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Matches — Admin" }

const STATUS_CONFIG = {
  scheduled:  { label: "Scheduled", class: "text-text-muted border-white/15",        icon: Clock },
  live:       { label: "LIVE",       class: "text-live border-live/30 bg-live/10",     icon: Radio },
  completed:  { label: "Done",       class: "text-success border-success/30",          icon: CheckCircle2 },
  cancelled:  { label: "Cancelled",  class: "text-danger border-danger/20 opacity-60", icon: Clock },
}

export default async function MatchesPage() {
  const supabase = await createClient()
  const { data: matches } = await supabase
    .from("matches")
    .select(`
      id, status, format, scheduled_at, team_a_maps_won, team_b_maps_won,
      team_a:teams!matches_team_a_id_fkey(id, name, short_name, logo_url),
      team_b:teams!matches_team_b_id_fkey(id, name, short_name, logo_url),
      winner:teams!matches_winner_id_fkey(id, short_name),
      phases(name)
    `)
    .order("scheduled_at", { ascending: false })
    .limit(100)

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-text">Matches</h1>
          <p className="text-text-muted text-sm mt-0.5">{matches?.length ?? 0} matches</p>
        </div>
        <Link
          href="/admin/matches/new"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gold text-void text-sm font-medium hover:bg-gold/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Match
        </Link>
      </div>

      <div className="card-tactical rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/8">
              <th className="text-left py-3 px-4 text-xs text-text-muted font-medium uppercase tracking-wider">Match</th>
              <th className="text-left py-3 px-4 text-xs text-text-muted font-medium uppercase tracking-wider hidden sm:table-cell">Phase</th>
              <th className="text-left py-3 px-4 text-xs text-text-muted font-medium uppercase tracking-wider hidden md:table-cell">Date</th>
              <th className="text-left py-3 px-4 text-xs text-text-muted font-medium uppercase tracking-wider">Status</th>
              <th className="py-3 px-4 w-28"></th>
            </tr>
          </thead>
          <tbody>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(matches as any[] ?? []).map((match) => {
              const statusConf = STATUS_CONFIG[match.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.scheduled
              const StatusIcon = statusConf.icon

              return (
                <tr key={match.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <TeamPill team={match.team_a} />
                      <span className="text-xs text-text-muted font-stats uppercase">{match.format}</span>
                      <TeamPill team={match.team_b} />
                      {match.status === "completed" && (
                        <span className="text-[10px] text-text-muted">
                          {match.team_a_maps_won}–{match.team_b_maps_won}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 hidden sm:table-cell">
                    <span className="text-xs text-text-muted">{match.phases?.name ?? "—"}</span>
                  </td>
                  <td className="py-3 px-4 hidden md:table-cell">
                    {match.scheduled_at ? (
                      <span className="text-xs text-text-muted font-stats">
                        {new Date(match.scheduled_at).toLocaleDateString("en-US", {
                          month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                        })}
                      </span>
                    ) : <span className="text-xs text-text-muted">—</span>}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded border ${statusConf.class}`}>
                      <StatusIcon className="h-3 w-3" />
                      {statusConf.label}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-2">
                      {(match.status === "scheduled" || match.status === "live") && (
                        <MatchStatusActions matchId={match.id} status={match.status} />
                      )}
                      {match.external_stats_url && (
                        <a href={match.external_stats_url} target="_blank" rel="noopener noreferrer"
                          className="p-1.5 rounded-md text-text-muted hover:text-purple transition-colors">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                      <Link
                        href={`/admin/matches/${match.id}/edit`}
                        className="p-1.5 rounded-md text-text-muted hover:text-text hover:bg-white/5 transition-colors"
                        title="Edit match details"
                      >
                        <Settings2 className="h-3.5 w-3.5" />
                      </Link>
                      <Link
                        href={`/admin/matches/${match.id}`}
                        className="p-1.5 rounded-md text-text-muted hover:text-text hover:bg-white/5 transition-colors"
                        title="Enter stats / manage match"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </td>
                </tr>
              )
            })}
            {(!matches || matches.length === 0) && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-text-muted text-sm">
                  No matches yet. <Link href="/admin/matches/new" className="text-purple hover:underline">Create first match →</Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TeamPill({ team }: { team: { name: string; short_name?: string; logo_url?: string } | null }) {
  if (!team) return <span className="text-xs text-text-muted">TBD</span>
  return (
    <div className="flex items-center gap-1.5">
      {team.logo_url && (
        <Image src={team.logo_url} alt={team.name} width={16} height={16} className="object-contain" />
      )}
      <span className="text-sm font-medium text-text">{team.short_name ?? team.name}</span>
    </div>
  )
}
