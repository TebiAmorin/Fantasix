import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { setupProfile } from "@/lib/actions/user"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Set up your profile — Fantasix" }

export default async function SetupPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; error?: string }>
}) {
  const { redirect: next = "/predictions", error } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect(`/login?redirect=${encodeURIComponent(next)}`)

  // If already set up, skip
  const { data: profile } = await supabase
    .from("profiles")
    .select("username, setup_complete")
    .eq("id", user!.id)
    .single()

  if (profile?.setup_complete) redirect(next.startsWith("/") ? next : "/predictions")

  const currentUsername = profile?.username ?? ""

  return (
    <div className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden bg-void">

      {/* Background */}
      <div className="absolute inset-0 bg-slc-mesh pointer-events-none" />
      <div className="absolute inset-0 grid-fine opacity-[0.08] pointer-events-none" />
      {/* Red orb */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[150px] opacity-[0.22] pointer-events-none"
        style={{ background: "rgba(196,30,58,1)" }} />
      {/* Teal orb */}
      <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full blur-[120px] opacity-[0.12] pointer-events-none"
        style={{ background: "rgba(0,212,184,1)" }} />

      <div className="relative z-10 w-full max-w-sm px-4">
        <div className="rounded-[28px] p-px" style={{ background: "linear-gradient(145deg, rgba(196,30,58,0.35) 0%, rgba(196,30,58,0.06) 55%, rgba(0,212,184,0.12) 100%)" }}>
          <div className="rounded-[27px] p-8 space-y-7" style={{ background: "rgba(13,14,20,0.98)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)" }}>

            {/* Brand */}
            <div className="text-center space-y-3">
              <div className="flex justify-center">
                <div className="h-12 w-12 rounded-2xl flex items-center justify-center border border-red/30 bg-red/10">
                  <svg className="h-6 w-6 text-red" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M4 4h16v3H7v4h10v3H7v6H4z"/>
                  </svg>
                </div>
              </div>
              <div>
                <h1 className="font-display text-2xl text-text tracking-wide">Choose your name</h1>
                <p className="text-xs text-text-muted mt-1.5 leading-relaxed">
                  This is how you&apos;ll appear on the leaderboard and to other players.
                </p>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl border border-danger/25 bg-danger/6 px-4 py-3 text-xs text-danger text-center">
                {error === "taken" ? "That username is already taken — try another." : "Username must be 3–20 characters (letters, numbers, underscores only)."}
              </div>
            )}

            {/* Form */}
            <form action={setupProfile} className="space-y-4">
              <input type="hidden" name="redirect" value={next} />
              <div className="space-y-1.5">
                <label className="text-[10px] font-display uppercase tracking-[0.2em] text-text-muted">Username</label>
                <input
                  name="username"
                  type="text"
                  defaultValue={currentUsername}
                  placeholder="e.g. fraggingpro99"
                  minLength={3}
                  maxLength={20}
                  pattern="[a-zA-Z0-9_]+"
                  required
                  autoFocus
                  className="w-full h-11 px-4 rounded-xl text-sm text-text bg-white/4 border border-white/10 focus:border-red/30 focus:outline-none placeholder:text-text-dim transition-colors duration-300"
                />
                <p className="text-[10px] text-text-dim">3–20 characters · Letters, numbers, underscores</p>
              </div>

              <button
                type="submit"
                className="w-full h-11 rounded-xl font-display font-bold text-sm uppercase tracking-wider transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]"
                style={{
                  background: "linear-gradient(135deg, rgba(245,200,66,0.95) 0%, rgba(245,180,40,1) 100%)",
                  color: "#07080D",
                  boxShadow: "0 0 0 1px rgba(245,200,66,0.4), 0 4px 20px rgba(245,200,66,0.22)",
                }}
              >
                Let&apos;s go →
              </button>
            </form>

          </div>
        </div>
      </div>
    </div>
  )
}
