import { NextResponse } from "next/server"
import { sendPushToAll } from "@/lib/push"

// Internal-only endpoint — protected by SYNC_SECRET
export async function POST(req: Request) {
  const auth = req.headers.get("Authorization")
  if (auth !== `Bearer ${process.env.SYNC_SECRET}`) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const payload = await req.json()
  const result = await sendPushToAll(payload)
  return NextResponse.json({ ok: true, ...result })
}
