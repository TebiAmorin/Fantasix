import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { StatsEntryForm } from "@/components/admin/stats-entry-form"
import { MatchResultForm } from "@/components/admin/match-result-form"
import Link from "next/link"
import Image from "next/image"
import { ExternalLink, ArrowLeft } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Match Stats — Admin" }

export default async function MatchStatsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  // Load match with both teams' players
  const { data: rawMatch } = await supabase
    .from("matches")
    .select(`
      id, status, format, external_stats_url, team_a_maps_won, team_b_maps_won,
      team_a:teams!matches_team_a_id_fkey(id, name, short_name, logo_url),
      team_b:teams!matches_team_b_id_fkey(id, name, short_name, logo_url),
      winner:teams!matches_winner_id_fkey(id, name, short_name),
      phases(name)
    `)
    .eq("id", id)
    .single()

  if (!rawMatch) notFound()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const match = rawMatch as any

  // Load players for both teams
  const [{ data: teamAPlayers }, { data: teamBPlayers }] = await Promise.all([
    supabase
      .from("players")
      .select("id, nickname, real_name, avatar_url, role")
      .eq("team_id", match.team_a.id)
      .eq("is_active", true)
      .order("nickname"),
    supabase
      .from("players")
      .select("id, nickname, real_name, avatar_url, role")
      .eq("team_id", match.team_b.id)
      .eq("is_active", true)
      .order("nickname"),
  ])

  // Load existing stats for this match
  const { data: existingStats } = await supabase
    .from("player_match_stats")
    .select("*")
    .eq("match_id", id)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const statsMap = Object.fromEntries((existingStats as any[] ?? []).map((s) => [s.player_id, s]))

  return (
    <div className="max-w-6xl space-y-6">
      {/* Header */}
      <div>
        <Link href="/admin/matches" className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text transition-colors mb-4">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Matches
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs text-text-muted mb-1">{match.phases?.name ?? "No phase"} · {match.format?.toUpperCase()}</p>
            <div className="flex items-center gap-4">
              <TeamHeader team={match.team_a} />
              <div className="text-center">
                {match.status === "completed" ? (
                  <p className="font-stats text-xl font-bold text-text">
                    {match.team_a_maps_won} — {match.team_b_maps_won}
                  </p>
                ) : (
                  <p className="text-xs text-text-muted uppercase tracking-wider">vs</p>
                )}
              </div>
              <TeamHeader team={match.team_b} />
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {match.external_stats_url && (
              <a
                href={match.external_stats_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-purple/10 border border-purple/30 text-purple text-xs hover:bg-purple/20 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                SiegeGG
              </a>
            )}
            <span className={`px-2.5 py-1 rounded text-xs font-medium border ${
              match.status === "live"
                ? "bg-live/10 border-live/30 text-live"
                : match.status === "completed"
                ? "bg-success/10 border-success/30 text-success"
                : "border-white/15 text-text-muted"
            }`}>
              {match.status}
            </span>
          </div>
        </div>
      </div>

      {/* Match result section */}
      <MatchResultForm
        matchId={match.id}
        teamA={match.team_a}
        teamB={match.team_b}
        currentStatus={match.status}
        currentWinnerId={match.winner?.id}
        currentMapsA={match.team_a_maps_won}
        currentMapsB={match.team_b_maps_won}
        externalUrl={match.external_stats_url}
        format={match.format}
      />

      {/* Stats entry — two team columns */}
      <div>
        <h2 className="font-display text-lg text-text uppercase tracking-wide mb-4">Player Stats</h2>
        <p className="text-xs text-text-muted mb-4">
          Enter stats for each player. Changes are saved individually per player.
          {existingStats && existingStats.length > 0 && (
            <span className="ml-2 text-success">
              ✓ {existingStats.length} player{existingStats.length !== 1 ? "s" : ""} have stats saved
            </span>
          )}
        </p>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Team A */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              {match.team_a.logo_url && (
                <Image src={match.team_a.logo_url} alt={match.team_a.name} width={20} height={20} className="object-contain" />
              )}
              <h3 className="font-display text-base text-text uppercase tracking-wide">{match.team_a.short_name ?? match.team_a.name}</h3>
              <span className="text-xs text-text-muted">({teamAPlayers?.length ?? 0} players)</span>
            </div>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(teamAPlayers as any[] ?? []).map((player) => (
              <StatsEntryForm
                key={player.id}
                matchId={match.id}
                player={player}
                existingStats={statsMap[player.id]}
              />
            ))}
            {(!teamAPlayers || teamAPlayers.length === 0) && (
              <p className="text-sm text-text-muted p-4 border border-dashed border-white/10 rounded-lg text-center">
                No players found for {match.team_a.name}.{" "}
                <Link href="/admin/players/new" className="text-purple hover:underline">Add players →</Link>
              </p>
            )}
          </div>

          {/* Team B */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              {match.team_b.logo_url && (
                <Image src={match.team_b.logo_url} alt={match.team_b.name} width={20} height={20} className="object-contain" />
              )}
              <h3 className="font-display text-base text-text uppercase tracking-wide">{match.team_b.short_name ?? match.team_b.name}</h3>
              <span className="text-xs text-text-muted">({teamBPlayers?.length ?? 0} players)</span>
            </div>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(teamBPlayers as any[] ?? []).map((player) => (
              <StatsEntryForm
                key={player.id}
                matchId={match.id}
                player={player}
                existingStats={statsMap[player.id]}
              />
            ))}
            {(!teamBPlayers || teamBPlayers.length === 0) && (
              <p className="text-sm text-text-muted p-4 border border-dashed border-white/10 rounded-lg text-center">
                No players found for {match.team_b.name}.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function TeamHeader({ team }: { team: { name: string; short_name?: string; logo_url?: string } | null }) {
  if (!team) return <span className="text-text-muted">TBD</span>
  return (
    <div className="flex items-center gap-2">
      {team.logo_url && (
        <Image src={team.logo_url} alt={team.name} width={32} height={32} className="object-contain" />
      )}
      <span className="font-display text-xl text-text">{team.short_name ?? team.name}</span>
    </div>
  )
}
