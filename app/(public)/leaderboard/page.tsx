import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { LeaderboardTable } from "@/components/leaderboard/leaderboard-table"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Leaderboard — Fantasix",
  description: "Pick'Em rankings for the BLAST R6 Major SLC 2026.",
  openGraph: {
    title: "Leaderboard — Fantasix",
    description: "Pick'Em rankings for the BLAST R6 Major SLC 2026.",
    images: [{ url: "/api/og?title=Leaderboard&sub=BLAST+R6+Major+%C2%B7+SLC+2026", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/api/og?title=Leaderboard&sub=BLAST+R6+Major+%C2%B7+SLC+2026"],
  },
}

export const revalidate = 60

interface PickemRow {
  user_id: string
  username: string
  avatar_url: string | null
  total_points: number
  correct_picks: number
  resolved_picks: number
  accuracy_pct: number
  current_streak: number
}


export default async function LeaderboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [
    { data: pickem },
    { data: tournament },
  ] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("pickem_leaderboard")
      .select("user_id, username, avatar_url, total_points, correct_picks, resolved_picks, accuracy_pct, current_streak")
      .order("total_points", { ascending: false })
      .order("accuracy_pct", { ascending: false })
      .limit(100) as Promise<{ data: PickemRow[] | null }>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("tournaments")
      .select("name")
      .eq("is_active", true)
      .single() as Promise<{ data: { name: string } | null }>,
  ])

  const pickemRows = pickem ?? []
  const myPickemRank = pickemRows.findIndex(r => r.user_id === user?.id) + 1

  return (
    <div>
      {/* ── Hero ── */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-slc-mesh" />
        <div className="absolute inset-0 slc-slash opacity-100 pointer-events-none" />
        <div className="absolute -top-12 -left-8 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: "rgba(196,30,58,0.14)", filter: "blur(100px)" }} />
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: "rgba(0,212,184,0.07)", filter: "blur(80px)" }} />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-20 rounded-full pointer-events-none"
          style={{ background: "rgba(245,200,66,0.07)", filter: "blur(60px)" }} />
        <div className="absolute inset-x-0 bottom-0 h-px"
          style={{ background: "linear-gradient(to right, transparent, rgba(196,30,58,0.4), rgba(245,200,66,0.3), rgba(0,212,184,0.2), transparent)" }} />

        <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 pb-12">
          <div className="space-y-4 animate-fade-up">
            <div
              className="inline-flex items-center gap-2 rounded-full px-3 py-1.5"
              style={{ color: "#C41E3A", border: "1px solid rgba(196,30,58,0.3)", background: "rgba(196,30,58,0.10)" }}
            >
              <svg className="h-2.5 w-2.5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              <span className="text-[10px] font-display font-bold uppercase tracking-[0.2em]">
                {tournament?.name ?? "BLAST R6 Major SLC 2026"}
              </span>
            </div>

            <div>
              <h1 className="font-display text-5xl sm:text-6xl text-text leading-none tracking-tight">
                Leader<span className="text-gold text-glow-gold">board</span>
              </h1>
              <p className="text-text-muted text-sm mt-2 tracking-wide">
                Pick&apos;Em rankings ·{" "}
                <span style={{ color: "rgba(0,212,184,0.6)" }}>FORGED THE HARD WAY</span>
              </p>
            </div>

            {/* My rank pill */}
            {user && myPickemRank > 0 && (
              <div className="flex flex-wrap gap-3 pt-1">
                <div
                  className="flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-stats"
                  style={{ background: "rgba(245,200,66,0.08)", boxShadow: "inset 0 0 0 1px rgba(245,200,66,0.2)" }}
                >
                  <span className="text-gold font-bold">#{myPickemRank}</span>
                  <span className="text-text-muted">Your rank</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 space-y-10">

        {/* ── Pick'Em ── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h2 className="font-display text-lg text-text uppercase tracking-wide">Pick&apos;Em</h2>
              <p className="text-xs text-text-muted">1 point per correct match prediction</p>
            </div>
            <Link href="/predictions" className="text-xs text-purple hover:text-purple/80 transition-colors">
              Make picks →
            </Link>
          </div>

          <LeaderboardTable rows={pickemRows} currentUserId={user?.id ?? null} />
        </section>

        {/* ── How scoring works ── */}
        <section
          className="rounded-2xl p-5 space-y-4"
          style={{
            background: "rgba(245,200,66,0.03)",
            boxShadow: "inset 0 0 0 1px rgba(245,200,66,0.1)",
          }}
        >
          <h3 className="font-display text-xs text-gold/60 uppercase tracking-[0.25em]">How scoring works</h3>
          <div className="text-xs text-text-muted space-y-2 max-w-sm">
            <p className="text-text font-medium font-display uppercase tracking-wide text-[11px]">Pick&apos;Em</p>
            <ul className="space-y-1.5">
              <li className="flex gap-2"><span className="text-gold font-stats shrink-0">+1</span>Correct match winner prediction</li>
              <li className="flex gap-2"><span className="text-text-dim font-stats shrink-0">0</span>Wrong prediction or no pick</li>
              <li className="flex gap-2"><span className="text-danger font-stats shrink-0">—</span>Picks lock when match goes live</li>
            </ul>
          </div>
        </section>

      </div>
    </div>
  )
}
