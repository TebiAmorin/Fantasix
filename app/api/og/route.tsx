import { ImageResponse } from "next/og"
import type { NextRequest } from "next/server"

export const runtime = "edge"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const title = searchParams.get("title") ?? "Fantasix"
  const sub   = searchParams.get("sub")   ?? "BLAST R6 Major · Salt Lake City 2026"

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#07080D",
          position: "relative",
          overflow: "hidden",
          fontFamily: "sans-serif",
        }}
      >
        {/* Grid texture */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }} />

        {/* SLC red orb — top left */}
        <div style={{
          position: "absolute", top: -180, left: -120,
          width: 640, height: 640, borderRadius: "50%",
          background: "rgba(196,30,58,0.22)",
          filter: "blur(130px)",
        }} />
        {/* SLC teal orb — bottom right */}
        <div style={{
          position: "absolute", bottom: -100, right: -80,
          width: 480, height: 480, borderRadius: "50%",
          background: "rgba(0,212,184,0.14)",
          filter: "blur(110px)",
        }} />
        {/* Gold sweep bottom */}
        <div style={{
          position: "absolute", bottom: 0, left: "50%",
          width: 700, height: 120, borderRadius: "50%",
          background: "rgba(245,200,66,0.07)",
          filter: "blur(60px)",
          transform: "translateX(-50%)",
        }} />

        {/* Diagonal slash — top right accent */}
        <div style={{
          position: "absolute", top: 0, right: 0,
          width: 400, height: "100%",
          background: "linear-gradient(135deg, transparent 0%, rgba(196,30,58,0.04) 50%, transparent 100%)",
        }} />

        {/* Content */}
        <div style={{
          position: "relative", zIndex: 1,
          display: "flex", flexDirection: "column",
          justifyContent: "space-between",
          width: "100%", height: "100%",
          padding: "52px 64px",
        }}>
          {/* Logo + brand */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {/* Angular F mark */}
            <div style={{
              width: 40, height: 40,
              background: "#C41E3A",
              clipPath: "polygon(7px 0%, 100% 0%, calc(100% - 7px) 100%, 0% 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: 18, fontWeight: 900, color: "#fff", letterSpacing: "-0.02em" }}>F</span>
            </div>
            <span style={{
              fontSize: 18, fontWeight: 700,
              color: "rgba(240,242,248,0.9)",
              letterSpacing: "0.18em",
            }}>
              FANTASIX
            </span>
          </div>

          {/* Main text */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Eyebrow */}
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              background: "rgba(196,30,58,0.10)",
              border: "1px solid rgba(196,30,58,0.35)",
              borderRadius: 999,
              padding: "7px 18px",
              width: "fit-content",
            }}>
              {/* Star icon */}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="#C41E3A">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              <span style={{ fontSize: 12, color: "#C41E3A", letterSpacing: "0.22em", fontWeight: 700 }}>
                {sub}
              </span>
            </div>

            {/* Headline */}
            <div style={{
              fontSize: title.length > 22 ? 58 : title.length > 14 ? 70 : 82,
              fontWeight: 800,
              color: "#F0F2F8",
              lineHeight: 0.93,
              letterSpacing: "-0.025em",
            }}>
              {title}
            </div>

            {/* Tagline */}
            <div style={{
              fontSize: 14,
              color: "rgba(0,212,184,0.55)",
              letterSpacing: "0.28em",
              fontWeight: 600,
            }}>
              FORGED THE HARD WAY
            </div>
          </div>

          {/* Bottom stats strip */}
          <div style={{
            display: "flex", gap: 36, alignItems: "center",
          }}>
            {[
              { label: "Teams",   value: "20"    },
              { label: "Matches", value: "60+"   },
              { label: "Prize",   value: "$750K" },
              { label: "May",     value: "8–17"  },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <span style={{ fontSize: 30, fontWeight: 800, color: "#F5C842", fontVariantNumeric: "tabular-nums" }}>{value}</span>
                <span style={{ fontSize: 10, color: "rgba(240,242,248,0.30)", letterSpacing: "0.22em", fontWeight: 600 }}>{label.toUpperCase()}</span>
              </div>
            ))}

            {/* Pick'Em tag */}
            <div style={{
              marginLeft: "auto",
              background: "rgba(245,200,66,0.08)",
              border: "1px solid rgba(245,200,66,0.28)",
              borderRadius: 999,
              padding: "9px 22px",
              display: "flex", alignItems: "center", gap: 9,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#F5C842">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              <span style={{ fontSize: 13, color: "#F5C842", fontWeight: 700, letterSpacing: "0.16em" }}>
                PICK&apos;EM
              </span>
            </div>
          </div>
        </div>

        {/* Bottom separator line — red to teal */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: 2,
          background: "linear-gradient(to right, transparent, rgba(196,30,58,0.7) 30%, rgba(0,212,184,0.5) 70%, transparent)",
        }} />
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
