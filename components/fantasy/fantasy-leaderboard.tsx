import Link from "next/link"
import { Crown, TrendingUp } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface LeaderboardEntry {
  user_id: string
  username: string
  avatar_url: string | null
  total_points: number
  phases_played: number
}

interface FantasyLeaderboardProps {
  entries: LeaderboardEntry[]
  currentUserId?: string
  phases: Array<{ id: string; name: string; total_points?: number }>
}

const RANK_STYLES = [
  { bg: "bg-gold/10",   border: "border-gold/30",   text: "text-gold",      icon: "👑" },
  { bg: "bg-white/5",   border: "border-white/15",  text: "text-text-muted",icon: "🥈" },
  { bg: "bg-white/5",   border: "border-white/10",  text: "text-text-muted",icon: "🥉" },
]

export function FantasyLeaderboard({
  entries,
  currentUserId,
}: FantasyLeaderboardProps) {
  if (entries.length === 0) {
    return (
      <div className="card-tactical rounded-lg p-12 text-center">
        <TrendingUp className="h-10 w-10 text-text-muted mx-auto mb-3 opacity-40" />
        <p className="text-text-muted text-sm">No rankings yet. Be the first to draft!</p>
      </div>
    )
  }

  // Find current user rank
  const userRank = currentUserId
    ? entries.findIndex((e) => e.user_id === currentUserId) + 1
    : null

  return (
    <div className="space-y-4">
      {/* User's own rank banner */}
      {currentUserId && userRank && userRank > 3 && (
        <div className="card-tactical rounded-lg px-4 py-3 flex items-center justify-between border-purple/20 accent-purple-top">
          <div className="flex items-center gap-3">
            <span className="font-display text-sm text-text-muted w-6 text-right">
              #{userRank}
            </span>
            <span className="text-sm text-text">Your rank</span>
          </div>
          <span className="font-stats text-gold text-sm font-medium">
            {entries[userRank - 1]?.total_points ?? 0} pts
          </span>
        </div>
      )}

      {/* Top 3 podium */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {entries.slice(0, 3).map((entry, i) => {
          const style = RANK_STYLES[i]
          const isCurrentUser = entry.user_id === currentUserId
          return (
            <Link
              key={entry.user_id}
              href={`/profile/${entry.username}`}
              className={cn(
                "card-tactical rounded-lg p-4 flex flex-col items-center text-center gap-2 border transition-colors hover:border-white/20",
                style.border,
                isCurrentUser && "ring-1 ring-purple/40"
              )}
            >
              <span className="text-xl">{style.icon}</span>
              <Avatar className="h-12 w-12 border-2 border-white/10">
                <AvatarImage src={entry.avatar_url ?? undefined} />
                <AvatarFallback className="bg-purple/20 text-purple font-display text-sm">
                  {entry.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className={cn("font-medium text-sm truncate max-w-[120px]", isCurrentUser ? "text-purple" : "text-text")}>
                  {entry.username}
                </p>
                <p className={cn("font-display text-lg font-bold", style.text)}>
                  {entry.total_points}
                  <span className="text-xs font-sans font-normal text-text-muted ml-1">pts</span>
                </p>
              </div>
              {isCurrentUser && (
                <Badge variant="outline" className="text-[10px] border-purple/30 text-purple">
                  You
                </Badge>
              )}
            </Link>
          )
        })}
      </div>

      {/* Full table */}
      {entries.length > 3 && (
        <div className="card-tactical rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/8">
                <th className="text-left py-3 px-4 text-xs text-text-muted font-medium uppercase tracking-wider w-12">#</th>
                <th className="text-left py-3 px-4 text-xs text-text-muted font-medium uppercase tracking-wider">Player</th>
                <th className="text-right py-3 px-4 text-xs text-text-muted font-medium uppercase tracking-wider">Points</th>
                <th className="text-right py-3 px-4 text-xs text-text-muted font-medium uppercase tracking-wider hidden sm:table-cell">Phases</th>
              </tr>
            </thead>
            <tbody>
              {entries.slice(3).map((entry, i) => {
                const rank = i + 4
                const isCurrentUser = entry.user_id === currentUserId
                return (
                  <tr
                    key={entry.user_id}
                    className={cn(
                      "border-b border-white/5 transition-colors hover:bg-white/3",
                      isCurrentUser && "bg-purple/5"
                    )}
                  >
                    <td className="py-3 px-4">
                      <span className="font-stats text-sm text-text-muted">{rank}</span>
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        href={`/profile/${entry.username}`}
                        className="flex items-center gap-2.5 hover:text-gold transition-colors"
                      >
                        <Avatar className="h-7 w-7 border border-white/10">
                          <AvatarImage src={entry.avatar_url ?? undefined} />
                          <AvatarFallback className="bg-purple/20 text-purple text-xs font-display">
                            {entry.username.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className={cn("text-sm font-medium", isCurrentUser ? "text-purple" : "text-text")}>
                          {entry.username}
                        </span>
                        {isCurrentUser && (
                          <Badge variant="outline" className="text-[10px] border-purple/30 text-purple py-0 h-4">
                            You
                          </Badge>
                        )}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-stats text-sm font-medium text-gold">
                        {entry.total_points}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right hidden sm:table-cell">
                      <span className="font-stats text-sm text-text-muted">
                        {entry.phases_played}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
