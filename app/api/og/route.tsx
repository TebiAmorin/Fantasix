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
          backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }} />

        {/* Radial glows */}
        <div style={{
          position: "absolute", top: -200, left: -200,
          width: 700, height: 700, borderRadius: "50%",
          background: "rgba(0,163,224,0.12)",
          filter: "blur(120px)",
        }} />
        <div style={{
          position: "absolute", bottom: -100, right: -100,
          width: 500, height: 500, borderRadius: "50%",
          background: "rgba(157,111,255,0.12)",
          filter: "blur(100px)",
        }} />
        <div style={{
          position: "absolute", bottom: 0, left: "50%",
          width: 600, height: 150, borderRadius: "50%",
          background: "rgba(245,200,66,0.08)",
          filter: "blur(60px)",
          transform: "translateX(-50%)",
        }} />

        {/* Content */}
        <div style={{
          position: "relative", zIndex: 1,
          display: "flex", flexDirection: "column",
          justifyContent: "space-between",
          width: "100%", height: "100%",
          padding: "56px 64px",
        }}>
          {/* Logo + brand */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 44, height: 44,
              background: "rgba(157,111,255,0.2)",
              border: "1px solid rgba(157,111,255,0.4)",
              borderRadius: 12,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(157,111,255,1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <span style={{
              fontSize: 20, fontWeight: 700,
              color: "rgba(248,250,252,0.9)",
              letterSpacing: "0.15em",
            }}>
              FANTASIX
            </span>
          </div>

          {/* Main text */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Eyebrow */}
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "rgba(0,163,224,0.08)",
              border: "1px solid rgba(0,163,224,0.25)",
              borderRadius: 999,
              padding: "6px 16px",
              width: "fit-content",
            }}>
              <div style={{
                width: 6, height: 6, borderRadius: "50%",
                background: "#00A3E0",
              }} />
              <span style={{ fontSize: 12, color: "#00A3E0", letterSpacing: "0.2em", fontWeight: 600 }}>
                {sub}
              </span>
            </div>

            {/* Headline */}
            <div style={{
              fontSize: title.length > 20 ? 60 : 76,
              fontWeight: 800,
              color: "#F8FAFC",
              lineHeight: 0.95,
              letterSpacing: "-0.02em",
            }}>
              {title}
            </div>
          </div>

          {/* Bottom stats strip */}
          <div style={{
            display: "flex", gap: 32, alignItems: "center",
          }}>
            {[
              { label: "Teams",   value: "20"    },
              { label: "Matches", value: "60+"   },
              { label: "Prize",   value: "$750K" },
              { label: "May",     value: "8–17"  },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 28, fontWeight: 800, color: "#F5C842", fontVariantNumeric: "tabular-nums" }}>{value}</span>
                <span style={{ fontSize: 11, color: "rgba(248,250,252,0.35)", letterSpacing: "0.2em", fontWeight: 600 }}>{label.toUpperCase()}</span>
              </div>
            ))}

            {/* Pick'Em tag */}
            <div style={{
              marginLeft: "auto",
              background: "rgba(245,200,66,0.08)",
              border: "1px solid rgba(245,200,66,0.25)",
              borderRadius: 999,
              padding: "8px 20px",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#F5C842">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              <span style={{ fontSize: 13, color: "#F5C842", fontWeight: 700, letterSpacing: "0.15em" }}>
                PICK&apos;EM
              </span>
            </div>
          </div>
        </div>

        {/* Bottom glow line */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: 2,
          background: "linear-gradient(to right, transparent, rgba(0,163,224,0.5), rgba(245,200,66,0.4), transparent)",
        }} />
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
