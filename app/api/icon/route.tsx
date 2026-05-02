import { ImageResponse } from "next/og"
import { NextRequest } from "next/server"

export const runtime = "edge"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const size     = parseInt(searchParams.get("size") ?? "192")
  const maskable = searchParams.has("maskable")

  const px = [96, 192, 512].includes(size) ? size : 192

  const padding   = maskable ? Math.round(px * 0.12) : Math.round(px * 0.15)
  const innerSize = px - padding * 2
  const radius    = Math.round(innerSize * 0.28)
  const strokeW   = Math.max(1, Math.round(innerSize * 0.055))
  const iconSize  = Math.round(innerSize * 0.52)
  const accentH   = Math.max(1, Math.round(innerSize * 0.025))
  const accentW   = Math.round(innerSize * 0.3)
  const accentB   = Math.round(innerSize * 0.12)

  return new ImageResponse(
    (
      <div
        style={{
          width:          px,
          height:         px,
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          background:     maskable
            ? "linear-gradient(145deg, #0F1019 0%, #07080D 100%)"
            : "transparent",
          borderRadius:   maskable ? 0 : Math.round(px * 0.22),
        }}
      >
        {/* Outer glow ring */}
        <div
          style={{
            position:     "absolute",
            width:        innerSize + strokeW * 3,
            height:       innerSize + strokeW * 3,
            borderRadius: radius + strokeW * 1.5,
            background:   "rgba(157,111,255,0.12)",
          }}
        />

        {/* Card background */}
        <div
          style={{
            position:       "relative",
            width:          innerSize,
            height:         innerSize,
            borderRadius:   radius,
            background:     "linear-gradient(145deg, #151226 0%, #0D0E16 100%)",
            border:         `${strokeW}px solid rgba(157,111,255,0.35)`,
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            boxShadow:      "inset 0 1px 0 rgba(255,255,255,0.08)",
          }}
        >
          <svg
            width={iconSize}
            height={iconSize}
            viewBox="0 0 24 24"
            fill="none"
            stroke="rgba(157,111,255,0.95)"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>

          {/* Gold accent bar */}
          <div
            style={{
              position:    "absolute",
              bottom:      accentB,
              left:        "50%",
              transform:   "translateX(-50%)",
              width:       accentW,
              height:      accentH,
              borderRadius: 999,
              background:  "rgba(245,200,66,0.65)",
            }}
          />
        </div>
      </div>
    ),
    { width: px, height: px },
  )
}
