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

  const { data: stats } = await supabase
    .from("pickem_leaderboard")
    .select("total_points, correct_picks, resolved_picks, accuracy_pct, current_streak")
    .eq("username", username)
    .single()

  const { data: profile } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("username", username)
    .single()

  // Rank
  let rank: number | null = null
  if (stats) {
    const { count } = await supabase
      .from("pickem_leaderboard")
      .select("*", { count: "exact", head: true })
      .gt("total_points", stats.total_points)
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
        {/* Red orb — top-left */}
        <div style={{
          position: "absolute",
          top: -80, left: -80,
          width: 500, height: 500,
          borderRadius: "50%",
          background: "rgba(196,30,58,0.22)",
          filter: "blur(120px)",
        }} />

        {/* Teal orb — bottom-right */}
        <div style={{
          position: "absolute",
          bottom: -100, right: -60,
          width: 380, height: 380,
          borderRadius: "50%",
          background: "rgba(0,212,184,0.14)",
          filter: "blur(100px)",
        }} />

        {/* Subtle grid lines */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }} />

        {/* Left accent bar — red to teal */}
        <div style={{
          position: "absolute", left: 0, top: 0, bottom: 0, width: 4,
          background: "linear-gradient(180deg, rgba(196,30,58,0) 0%, rgba(196,30,58,0.9) 35%, rgba(0,212,184,0.6) 100%)",
        }} />

        {/* Top separator */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 1,
          background: "linear-gradient(90deg, transparent, rgba(196,30,58,0.5), rgba(0,212,184,0.35), transparent)",
        }} />

        {/* Bottom separator */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: 1,
          background: "linear-gradient(90deg, transparent, rgba(196,30,58,0.3), rgba(0,212,184,0.2), transparent)",
        }} />

        {/* Main content */}
        <div style={{
          position: "relative", zIndex: 10,
          display: "flex", flexDirection: "column",
          padding: "60px 72px",
          height: "100%",
          justifyContent: "space-between",
        }}>

          {/* Top row: logo + event badge */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {/* Angular F mark */}
              <div style={{
                width: 34, height: 34, borderRadius: 8,
                border: "1px solid rgba(196,30,58,0.4)",
                background: "rgba(196,30,58,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#C41E3A">
                  <path d="M4 4h16v3H7v4h10v3H7v6H4z"/>
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
              color: "rgba(0,212,184,0.75)",
              background: "rgba(0,212,184,0.08)",
              border: "1px solid rgba(0,212,184,0.2)",
              borderRadius: 999,
              padding: "6px 16px",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
            }}>
              BLAST R6 Major · SLC 2026
            </div>
          </div>

          {/* Middle: avatar + username + rank */}
          <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
            {/* Avatar */}
            <div style={{
              width: 100, height: 100, borderRadius: 22,
              border: "1.5px solid rgba(196,30,58,0.35)",
              background: "rgba(196,30,58,0.10)",
              overflow: "hidden",
              flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt={username} width={100} height={100} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
              ) : (
                <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="rgba(196,30,58,0.6)" strokeWidth="1.5">
                  <circle cx="12" cy="8" r="4"/>
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                </svg>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {rank && (
                <span style={{
                  fontSize: 13,
                  color: "rgba(245,200,66,0.85)",
                  fontWeight: 700,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                }}>
                  Ranked #{rank} globally
                </span>
              )}
              <span style={{
                fontSize: username.length > 14 ? 52 : username.length > 10 ? 60 : 68,
                fontWeight: 800,
                color: "#F8FAFC",
                letterSpacing: "-0.025em",
                lineHeight: 1,
              }}>
                {username}
              </span>
              <span style={{
                fontSize: 15,
                color: "rgba(0,212,184,0.55)",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                fontWeight: 600,
              }}>
                FORGED THE HARD WAY
              </span>
            </div>
          </div>

          {/* Bottom: stats row */}
          <div style={{ display: "flex", gap: 14 }}>
            {[
              { label: "Points",   value: String(points),         color: "#F5C842" },
              { label: "Correct",  value: `${correct}/${total}`,  color: "#F8FAFC" },
              { label: "Accuracy", value: `${accuracy}%`,         color: total > 0 ? (accuracy >= 70 ? "rgba(52,211,153,0.9)" : "#F5C842") : "rgba(255,255,255,0.3)" },
              ...(streak >= 2 ? [{ label: "Streak 🔥", value: `${streak}`, color: "#F5C842" }] : []),
            ].map((stat) => (
              <div key={stat.label} style={{
                flex: 1,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 16,
                padding: "18px 22px",
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}>
                <span style={{
                  fontSize: 34,
                  fontWeight: 800,
                  color: stat.color,
                  lineHeight: 1,
                  letterSpacing: "-0.01em",
                }}>
                  {stat.value}
                </span>
                <span style={{
                  fontSize: 10,
                  color: "rgba(248,250,252,0.3)",
                  letterSpacing: "0.25em",
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
