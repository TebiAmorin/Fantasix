import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Trophy, Users, Swords, Settings, ArrowRight, Clock, RefreshCw } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Admin Dashboard" }

export default async function AdminDashboard() {
  const supabase = await createClient()

  const [
    { count: tournamentCount },
    { count: teamCount },
    { count: playerCount },
    { count: matchCount },
    { data: activeTournament },
    { data: pendingMatches },
  ] = await Promise.all([
    supabase.from("tournaments").select("*", { count: "exact", head: true }),
    supabase.from("teams").select("*", { count: "exact", head: true }),
    supabase.from("players").select("*", { count: "exact", head: true }),
    supabase.from("matches").select("*", { count: "exact", head: true }),
    supabase.from("tournaments").select("name").eq("is_active", true).single(),
    supabase
      .from("matches")
      .select("id, scheduled_at")
      .eq("status", "scheduled")
      .order("scheduled_at")
      .limit(5),
  ])

  const activeTournamentName = (activeTournament as { name?: string } | null)?.name

  const stats = [
    { label: "Tournaments", value: tournamentCount ?? 0, icon: Trophy,  href: "/admin/tournaments", color: "text-gold" },
    { label: "Teams",       value: teamCount      ?? 0, icon: Users,   href: "/admin/teams",       color: "text-purple" },
    { label: "Players",     value: playerCount    ?? 0, icon: Users,   href: "/admin/players",     color: "text-purple" },
    { label: "Matches",     value: matchCount     ?? 0, icon: Swords,  href: "/admin/matches",     color: "text-text-muted" },
  ]

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="font-display text-3xl text-text">Dashboard</h1>
        {activeTournamentName ? (
          <p className="text-text-muted text-sm mt-1">
            Active tournament: <span className="text-gold">{activeTournamentName}</span>
          </p>
        ) : (
          <p className="text-text-muted text-sm mt-1">No active tournament</p>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, href, color }) => (
          <Link
            key={label}
            href={href}
            className="card-tactical rounded-lg p-4 flex flex-col gap-3 hover:border-white/20 transition-colors group"
          >
            <div className="flex items-center justify-between">
              <Icon className={`h-4 w-4 ${color}`} />
              <ArrowRight className="h-3.5 w-3.5 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div>
              <p className="font-stats text-2xl font-bold text-text">{value}</p>
              <p className="text-xs text-text-muted mt-0.5">{label}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending matches */}
        <div className="card-tactical rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base text-text uppercase tracking-wide">
              Upcoming Matches
            </h2>
            <Link href="/admin/matches" className="text-xs text-purple hover:text-purple/80 transition-colors">
              View all →
            </Link>
          </div>

          {pendingMatches && pendingMatches.length > 0 ? (
            <div className="space-y-2">
              {(pendingMatches as Array<{ id: string; scheduled_at: string | null }>).map((match) => (
                <Link
                  key={match.id}
                  href={`/admin/matches/${match.id}`}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-md bg-white/3 hover:bg-white/5 transition-colors"
                >
                  <Clock className="h-3.5 w-3.5 text-text-muted shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text truncate font-mono text-xs">
                      #{match.id.slice(0, 8)}
                    </p>
                    {match.scheduled_at && (
                      <p className="text-xs text-text-muted">
                        {new Date(match.scheduled_at).toLocaleDateString("en-US", {
                          month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                        })}
                      </p>
                    )}
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-text-muted shrink-0" />
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-muted py-4 text-center">No upcoming matches</p>
          )}
        </div>

        {/* Quick actions */}
        <div className="card-tactical rounded-lg p-5 space-y-4">
          <h2 className="font-display text-base text-text uppercase tracking-wide">Quick Actions</h2>
          <div className="space-y-2">
            {[
              { label: "PandaScore Sync",          href: "/admin/sync",           icon: RefreshCw },
              { label: "Create new match",         href: "/admin/matches/new",    icon: Swords },
              { label: "Add players",               href: "/admin/players/new",    icon: Users },
              { label: "Edit scoring matrix",       href: "/admin/scoring",        icon: Settings },
              { label: "Manage tournament phases",  href: "/admin/tournaments",    icon: Trophy },
            ].map(({ label, href, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-md bg-white/3 hover:bg-white/5 transition-colors group"
              >
                <Icon className="h-4 w-4 text-purple shrink-0" />
                <span className="text-sm text-text flex-1">{label}</span>
                <ArrowRight className="h-3.5 w-3.5 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
