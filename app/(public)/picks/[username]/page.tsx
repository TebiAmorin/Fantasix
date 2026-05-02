import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { User } from "lucide-react"
import { PickCorrectIcon, PickWrongIcon, StreakIcon } from "@/components/icons/rank-icons"
import { ShareButton } from "@/components/picks/share-button"
import type { Metadata } from "next"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>
}): Promise<Metadata> {
  const { username } = await params
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: stats } = await (supabase as any)
    .from("pickem_leaderboard")
    .select("total_points, accuracy_pct, correct_picks, resolved_picks")
    .eq("username", username)
    .single() as { data: { total_points: number; accuracy_pct: number; correct_picks: number; resolved_picks: number } | null }

  const description = stats
    ? `${stats.correct_picks}/${stats.resolved_picks} correct · ${stats.accuracy_pct}% accuracy · ${stats.total_points} pts`
    : "Pick'Em predictions at BLAST R6 Major SLC 2026"

  return {
    title: `${username}'s Picks — Fantasix`,
    description,
    openGraph: {
      title: `${username}'s Picks`,
      description,
      type: "profile",
    },
  }
}

interface PickRow {
  id: string
  is_correct: boolean | null
  predicted_winner: { short_name: string; logo_url: string | null } | null
  matches: {
    status: string
    format: string
    team_a_maps_won: number
    team_b_maps_won: number
    team_a: { short_name: string; logo_url: string | null } | null
    team_b: { short_name: string; logo_url: string | null } | null
    winner: { short_name: string } | null
  } | null
}

function PickCard({ pick }: { pick: PickRow }) {
  const m = pick.matches
  if (!m) return null

  const resolved = pick.is_correct !== null
  const correct  = pick.is_correct === true

  return (
    <div
      className={`
        relative overflow-hidden rounded-xl border transition-all duration-300
        ${resolved
          ? correct
            ? "border-success/20 bg-success/5"
            : "border-danger/20 bg-danger/4"
          : "border-white/8 bg-white/2"
        }
      `}
    >
      {/* Status strip */}
      <div className={`absolute inset-x-0 top-0 h-px ${
        resolved
          ? correct ? "bg-success/40" : "bg-danger/30"
          : "bg-purple/20"
      }`} />

      <div className="flex items-center gap-3 px-4 py-3.5">
        {/* Result icon */}
        <div className="shrink-0">
          {resolved ? (
            correct
              ? <PickCorrectIcon className="h-4 w-4 text-success" />
              : <PickWrongIcon   className="h-4 w-4 text-danger" />
          ) : (
            <div className="h-4 w-4 rounded-full border border-text-dim/30 flex items-center justify-center">
              <div className="h-1.5 w-1.5 rounded-full bg-text-dim/40" />
            </div>
          )}
        </div>

        {/* Match teams */}
        <div className="flex-1 min-w-0 space-y-0.5">
          <div className="flex items-center gap-1.5 text-xs">
            <TeamPill team={m.team_a} />
            <span className="text-[9px] text-text-dim font-stats">vs</span>
            <TeamPill team={m.team_b} />
          </div>
          <div className="text-[10px] text-text-muted leading-none">
            Picked{" "}
            <span className={resolved ? (correct ? "text-success font-medium" : "text-danger font-medium") : "text-text"}>
              {pick.predicted_winner?.short_name ?? "—"}
            </span>
            {m.status === "completed" && (
              <span className="ml-1.5 font-stats text-text-dim">
                · {m.team_a_maps_won}–{m.team_b_maps_won}
              </span>
            )}
          </div>
        </div>

        {/* Points */}
        <span className={`font-stats text-sm font-bold tabular-nums shrink-0 ${
          resolved ? (correct ? "text-gold" : "text-text-dim") : "text-text-dim/40"
        }`}>
          {resolved ? (correct ? "+1" : "0") : "—"}
        </span>
      </div>
    </div>
  )
}

function TeamPill({ team }: { team: { short_name: string; logo_url: string | null } | null }) {
  if (!team) return <span className="text-text-dim">TBD</span>
  return (
    <span className="flex items-center gap-1">
      {team.logo_url && (
        <Image src={team.logo_url} alt={team.short_name} width={14} height={14} className="object-contain rounded-sm" />
      )}
      <span className="font-stats text-text text-[11px]">{team.short_name}</span>
    </span>
  )
}

export default async function PicksPage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const supabase = await createClient()

  // Load profile
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from("profiles")
    .select("id, username, avatar_url")
    .eq("username", username)
    .single() as { data: { id: string; username: string; avatar_url: string | null } | null }

  if (!profile) notFound()

  // Stats from leaderboard view
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: stats } = await (supabase as any)
    .from("pickem_leaderboard")
    .select("total_points, correct_picks, resolved_picks, accuracy_pct, current_streak")
    .eq("user_id", profile.id)
    .single() as {
      data: {
        total_points: number
        correct_picks: number
        resolved_picks: number
        accuracy_pct: number
        current_streak: number
      } | null
    }

  // Rank
  let rank: number | null = null
  if (stats) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count } = await (supabase as any)
      .from("pickem_leaderboard")
      .select("*", { count: "exact", head: true })
      .gt("total_points", stats.total_points) as { count: number | null }
    rank = (count ?? 0) + 1
  }

  // All picks (resolved + pending, newest first, cap at 30)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rawPicks } = await (supabase as any)
    .from("match_predictions")
    .select(`
      id, is_correct,
      predicted_winner:teams!match_predictions_predicted_winner_id_fkey(short_name, logo_url),
      matches(status, format, team_a_maps_won, team_b_maps_won,
        team_a:teams!matches_team_a_id_fkey(short_name, logo_url),
        team_b:teams!matches_team_b_id_fkey(short_name, logo_url),
        winner:teams!matches_winner_id_fkey(short_name))
    `)
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(30) as { data: PickRow[] | null }

  const picks = rawPicks ?? []
  const resolvedPicks = picks.filter(p => p.is_correct !== null)
  const pendingPicks  = picks.filter(p => p.is_correct === null)

  // Current viewer
  const { data: { user: viewer } } = await supabase.auth.getUser()
  const isOwn = viewer?.id === profile.id

  return (
    <div className="min-h-screen">
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: [
              "radial-gradient(ellipse 70% 90% at 15% 50%, rgba(157,111,255,0.10) 0%, transparent 60%)",
              "radial-gradient(ellipse 50% 60% at 85% 20%, rgba(245,200,66,0.06) 0%, transparent 55%)",
              "#07080D",
            ].join(", "),
          }}
        />
        <div className="absolute inset-0 grid-fine opacity-25" />
        <div className="absolute top-0 left-1/4 w-80 h-80 rounded-full bg-purple/6 blur-[110px] pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-purple/20 to-transparent" />

        <div className="relative z-10 mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 pt-10 pb-12">
          <div className="flex items-start gap-5 animate-fade-up">
            {/* Avatar */}
            <div className="rounded-[18px] p-px shrink-0" style={{ background: "linear-gradient(135deg, rgba(157,111,255,0.35) 0%, rgba(157,111,255,0.05) 100%)" }}>
              <div className="relative h-16 w-16 rounded-[17px] overflow-hidden bg-purple/10">
                {profile.avatar_url ? (
                  <Image src={profile.avatar_url} alt={profile.username} fill className="object-cover" sizes="64px" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <User className="h-7 w-7 text-purple" />
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0 space-y-2">
              <div className="space-y-0.5">
                <div className="badge-eyebrow text-[9px]">
                  <svg className="h-2 w-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  Pick&apos;Em Card
                </div>
                <h1 className="font-display text-3xl sm:text-4xl text-text leading-none">
                  {profile.username}
                </h1>
              </div>

              {/* Mini stats row */}
              <div className="flex flex-wrap items-center gap-3">
                {rank && (
                  <span className="font-stats text-xs text-gold font-bold">#{rank}</span>
                )}
                {stats && (
                  <>
                    <span className="text-[11px] text-text-muted font-stats tabular-nums">
                      {stats.correct_picks}/{stats.resolved_picks} correct
                    </span>
                    <span className="text-[11px] text-purple font-stats tabular-nums">
                      {stats.accuracy_pct ?? 0}%
                    </span>
                    {(stats.current_streak ?? 0) >= 2 && (
                      <span className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-stats font-bold text-gold"
                        style={{ background: "rgba(245,200,66,0.10)", boxShadow: "inset 0 0 0 1px rgba(245,200,66,0.2)" }}>
                        <StreakIcon className="h-3 w-3" />
                        {stats.current_streak}
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Share / CTA row */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <ShareButton username={profile.username} isOwn={isOwn} />
            <Link
              href="/predictions"
              className="text-xs text-purple hover:text-purple/80 transition-colors"
            >
              Make your own picks →
            </Link>
          </div>
        </div>
      </div>

      {/* ── Picks list ───────────────────────────────────────────────── */}
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {picks.length === 0 && (
          <div className="py-16 text-center space-y-3">
            <p className="text-sm text-text-muted">No picks yet.</p>
            {isOwn && (
              <Link href="/predictions" className="text-xs text-purple hover:underline">
                Make your first prediction →
              </Link>
            )}
          </div>
        )}

        {/* Pending picks */}
        {pendingPicks.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-[10px] font-display uppercase tracking-[0.2em] text-text-muted flex items-center gap-2">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-gold" />
              </span>
              Active picks · {pendingPicks.length}
            </h2>
            <div className="space-y-2">
              {pendingPicks.map(p => <PickCard key={p.id} pick={p} />)}
            </div>
          </section>
        )}

        {/* Resolved picks */}
        {resolvedPicks.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-[10px] font-display uppercase tracking-[0.2em] text-text-muted">
              Results · {resolvedPicks.length}
            </h2>
            <div className="space-y-2">
              {resolvedPicks.map(p => <PickCard key={p.id} pick={p} />)}
            </div>
          </section>
        )}

        {/* Summary footer */}
        {stats && stats.resolved_picks > 0 && (
          <div
            className="rounded-2xl px-5 py-4 flex items-center justify-between"
            style={{
              background: "rgba(255,255,255,0.025)",
              boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.07)",
            }}
          >
            <div>
              <p className="font-stats text-xl font-bold text-gold tabular-nums">
                {stats.correct_picks}/{stats.resolved_picks}
              </p>
              <p className="text-[10px] text-text-muted uppercase tracking-[0.15em]">Correct</p>
            </div>
            <div className="text-right">
              <p className="font-stats text-xl font-bold text-purple tabular-nums">
                {stats.accuracy_pct ?? 0}%
              </p>
              <p className="text-[10px] text-text-muted uppercase tracking-[0.15em]">Accuracy</p>
            </div>
            <div className="text-right">
              <p className="font-stats text-xl font-bold text-text tabular-nums">
                {stats.total_points}
              </p>
              <p className="text-[10px] text-text-muted uppercase tracking-[0.15em]">Points</p>
            </div>
          </div>
        )}

        {/* Join CTA — only for visitors who are not logged in */}
        {!viewer && (
          <div
            className="rounded-2xl px-5 py-5 text-center space-y-3"
            style={{
              background: "rgba(157,111,255,0.04)",
              boxShadow: "inset 0 0 0 1px rgba(157,111,255,0.12)",
            }}
          >
            <p className="font-display text-sm text-text uppercase tracking-wide">
              Predict the BLAST R6 Major SLC 2026
            </p>
            <p className="text-xs text-text-muted">
              Pick match winners, climb the leaderboard, and compete with fans worldwide.
            </p>
            <Link
              href="/login"
              className="btn-primary inline-flex h-9 px-6 text-xs mt-1"
            >
              Join Fantasix Free
            </Link>
          </div>
        )}

      </div>
    </div>
  )
}

// ShareButton is imported from @/components/picks/share-button (Client Component)
