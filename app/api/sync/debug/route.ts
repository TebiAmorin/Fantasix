import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret")
  if (secret !== process.env.SYNC_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    env: {
      has_pandascore_token: !!process.env.PANDASCORE_TOKEN,
      has_sync_secret: !!process.env.SYNC_SECRET,
      has_supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      has_service_role: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      node_version: process.version,
      vercel_region: process.env.VERCEL_REGION ?? "unknown",
    },
  }

  // ── 1. Supabase REST (direct fetch) ──────────────────────────────────────
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  try {
    const t0 = Date.now()
    const sbRes = await fetch(
      `${sbUrl}/rest/v1/tournaments?is_active=eq.true&select=id,name&limit=1`,
      {
        headers: {
          apikey: sbKey!,
          Authorization: `Bearer ${sbKey}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    )
    const sbBody = await sbRes.json()
    results.supabase_rest = {
      ok: sbRes.ok,
      status: sbRes.status,
      duration_ms: Date.now() - t0,
      body: sbBody,
    }
  } catch (e: unknown) {
    results.supabase_rest = {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
      cause: e instanceof Error && e.cause ? JSON.stringify(e.cause) : undefined,
    }
  }

  // ── 2. PandaScore — series list (league 4999) ─────────────────────────────
  const psToken = process.env.PANDASCORE_TOKEN
  try {
    const t0 = Date.now()
    const psRes = await fetch(
      "https://api.pandascore.co/r6siege/series?filter[league_id]=4999&sort=-begin_at&page[size]=5",
      {
        headers: {
          Authorization: `Bearer ${psToken}`,
          Accept: "application/json",
          "User-Agent": "Fantasix/1.0",
        },
        cache: "no-store",
      }
    )
    const psText = await psRes.text()
    let psBody: unknown
    try { psBody = JSON.parse(psText) } catch { psBody = psText.slice(0, 500) }
    results.pandascore_series = {
      ok: psRes.ok,
      status: psRes.status,
      duration_ms: Date.now() - t0,
      body: psBody,
    }
  } catch (e: unknown) {
    results.pandascore_series = {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
      cause: e instanceof Error && e.cause ? JSON.stringify(e.cause) : undefined,
    }
  }

  // ── 3. PandaScore — upcoming matches ─────────────────────────────────────
  try {
    const t0 = Date.now()
    const psRes = await fetch(
      "https://api.pandascore.co/r6siege/matches/upcoming?page[size]=3",
      {
        headers: {
          Authorization: `Bearer ${psToken}`,
          Accept: "application/json",
          "User-Agent": "Fantasix/1.0",
        },
        cache: "no-store",
      }
    )
    const psText = await psRes.text()
    let psBody: unknown
    try { psBody = JSON.parse(psText) } catch { psBody = psText.slice(0, 500) }
    results.pandascore_upcoming = {
      ok: psRes.ok,
      status: psRes.status,
      duration_ms: Date.now() - t0,
      body: psBody,
    }
  } catch (e: unknown) {
    results.pandascore_upcoming = {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
      cause: e instanceof Error && e.cause ? JSON.stringify(e.cause) : undefined,
    }
  }

  // ── 4. Supabase SDK (via createAdminClient) ───────────────────────────────
  try {
    const { createAdminClient } = await import("@/lib/supabase/server")
    const admin = createAdminClient()
    const t0 = Date.now()
    const { data, error } = await (admin as unknown as {
      from: (t: string) => {
        select: (c: string) => {
          eq: (k: string, v: boolean) => {
            limit: (n: number) => Promise<{ data: unknown; error: unknown }>
          }
        }
      }
    })
      .from("tournaments")
      .select("id,name")
      .eq("is_active", true)
      .limit(1)
    results.supabase_sdk = {
      ok: !error,
      duration_ms: Date.now() - t0,
      data,
      error: error ? String(error) : undefined,
    }
  } catch (e: unknown) {
    results.supabase_sdk = {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
      cause: e instanceof Error && e.cause ? JSON.stringify(e.cause) : undefined,
    }
  }

  return NextResponse.json(results, { status: 200 })
}
