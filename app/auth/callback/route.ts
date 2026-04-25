import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse, type NextRequest } from "next/server"
import type { Database } from "@/lib/types/database.types"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin
  const code     = searchParams.get("code")
  const next     = searchParams.get("next") ?? "/"
  const redirect = searchParams.get("redirect") ?? next

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Redirect to the page user came from (or home)
      const safeRedirect = redirect.startsWith("/") ? redirect : "/"
      return NextResponse.redirect(`${origin}${safeRedirect}`)
    }
  }

  // Auth failed — back to login with error hint
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
