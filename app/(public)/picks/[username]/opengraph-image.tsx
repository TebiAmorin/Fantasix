import { ImageResponse } from "next/og"
import { createClient } from "@/lib/supabase/server"

export const runtime = "edge"
export const alt = "Picks on Fantasix"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function Image({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: stats } = await (supabase as any)
    .from("pickem_leaderboard")
    .select("total_points, correct_picks, resolved_picks, accuracy_pct, current_streak")
    .eq("username", username)
    .single() as {
      data: {
        total_points: number
        correct_picks: number
        resolved_picks: number
        accuracy_pct: number
        current_streak: number
      } | null
    }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from("profiles")
    .select("avatar_url")
    .eq("username", username)
    .single() as { data: { avatar_url: string | null } | null }

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

  const correct  = stats?.correct_picks  ?? 0
  const total    = stats?.resolved_picks ?? 0
  const accuracy = stats?.accuracy_pct   ?? 0
  const points   = stats?.total_points   ?? 0
  const streak   = stats?.current_streak ?? 0
  const avatarUrl = profile?.avatar_url ?? null

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#07080D",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background gradient blobs */}
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse 70% 80% at 10% 50%, rgba(157,111,255,0.13) 0%, transparent 55%), radial-gradient(ellipse 50% 60% at 90% 20%, rgba(245,200,66,0.07) 0%, transparent 55%)",
        }} />

        {/* Grid lines — subtle */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }} />

        {/* Left accent bar */}
        <div style={{
          position: "absolute", left: 0, top: 0, bottom: 0, width: 4,
          background: "linear-gradient(180deg, rgba(157,111,255,0) 0%, rgba(157,111,255,0.8) 40%, rgba(245,200,66,0.6) 100%)",
        }} />

        {/* Top separator */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 1,
          background: "linear-gradient(90deg, transparent, rgba(157,111,255,0.4), rgba(245,200,66,0.25), transparent)",
        }} />

        {/* Main content */}
        <div style={{
          position: "relative", zIndex: 10,
          display: "flex", flexDirection: "column",
          padding: "64px 72px",
          height: "100%",
          justifyContent: "space-between",
        }}>

          {/* Top row: logo + event badge */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                border: "1px solid rgba(157,111,255,0.4)",
                background: "rgba(157,111,255,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {/* Shield icon */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(157,111,255,0.9)" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <span style={{
                color: "rgba(248,250,252,0.9)",
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
              }}>FANTASIX</span>
            </div>

            <div style={{
              fontSize: 12,
              color: "rgba(245,200,66,0.7)",
              background: "rgba(245,200,66,0.08)",
              border: "1px solid rgba(245,200,66,0.2)",
              borderRadius: 999,
              padding: "6px 16px",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
            }}>
              BLAST R6 Major · SLC 2026
            </div>
          </div>

          {/* Middle: avatar + username + rank */}
          <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
            {/* Avatar */}
            <div style={{
              width: 96, height: 96, borderRadius: 20,
              border: "1px solid rgba(157,111,255,0.3)",
              background: "rgba(157,111,255,0.10)",
              overflow: "hidden",
              flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt={username} width={96} height={96} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
              ) : (
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="rgba(157,111,255,0.6)" strokeWidth="1.5">
                  <circle cx="12" cy="8" r="4"/>
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                </svg>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {rank && (
                <span style={{
                  fontSize: 13,
                  color: "rgba(245,200,66,0.8)",
                  fontWeight: 700,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                }}>
                  Ranked #{rank} globally
                </span>
              )}
              <span style={{
                fontSize: 64,
                fontWeight: 800,
                color: "#F8FAFC",
                letterSpacing: "-0.02em",
                lineHeight: 1,
              }}>
                {username}
              </span>
              <span style={{
                fontSize: 16,
                color: "rgba(248,250,252,0.4)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}>
                Pick&apos;Em Predictions
              </span>
            </div>
          </div>

          {/* Bottom: stats row */}
          <div style={{ display: "flex", gap: 16 }}>
            {[
              { label: "Points",   value: String(points),    color: "#F5C842" },
              { label: "Correct",  value: `${correct}/${total}`, color: "#F8FAFC" },
              { label: "Accuracy", value: `${accuracy}%`,   color: "#9D6FFF" },
              ...(streak >= 2 ? [{ label: "Streak", value: `${streak}🔥`, color: "#F5C842" }] : []),
            ].map((stat) => (
              <div key={stat.label} style={{
                flex: 1,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 16,
                padding: "20px 24px",
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}>
                <span style={{
                  fontSize: 32,
                  fontWeight: 800,
                  color: stat.color,
                  lineHeight: 1,
                  letterSpacing: "-0.01em",
                }}>
                  {stat.value}
                </span>
                <span style={{
                  fontSize: 11,
                  color: "rgba(248,250,252,0.35)",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                }}>
                  {stat.label}
                </span>
              </div>
            ))}
          </div>

        </div>
      </div>
    ),
    { ...size },
  )
}
