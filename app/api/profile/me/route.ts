import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json(null, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from("profiles")
    .select("username, avatar_url")
    .eq("id", user.id)
    .single() as { data: { username: string; avatar_url: string | null } | null }

  return NextResponse.json(
    profile ? { username: profile.username, avatar_url: profile.avatar_url, email: user.email ?? "" } : null
  )
}
