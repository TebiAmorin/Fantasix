import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { headers } from "next/headers"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Sign In — Fantasix" }

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

function DiscordIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 shrink-0 text-[#7289da]">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.031.056a19.9 19.9 0 0 0 5.993 3.03.077.077 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
    </svg>
  )
}

function TwitchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 shrink-0 text-[#9146FF]">
      <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
    </svg>
  )
}

async function getOrigin() {
  const headerList = await headers()
  const host  = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "localhost:3000"
  const proto = headerList.get("x-forwarded-proto") ?? "http"
  return `${proto}://${host}`
}

async function signInWithGoogle(formData: FormData) {
  "use server"
  const redirectTo = (formData.get("redirect") as string) || "/"
  const supabase   = await createClient()
  const origin     = process.env.NEXT_PUBLIC_APP_URL ?? await getOrigin()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}` },
  })
  if (error || !data.url) redirect("/login?error=provider_failed")
  redirect(data.url)
}

async function signInWithDiscord(formData: FormData) {
  "use server"
  const redirectTo = (formData.get("redirect") as string) || "/"
  const supabase   = await createClient()
  const origin     = process.env.NEXT_PUBLIC_APP_URL ?? await getOrigin()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "discord",
    options: { redirectTo: `${origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}` },
  })
  if (error || !data.url) redirect("/login?error=provider_failed")
  redirect(data.url)
}

async function signInWithTwitch(formData: FormData) {
  "use server"
  const redirectTo = (formData.get("redirect") as string) || "/"
  const supabase   = await createClient()
  const origin     = process.env.NEXT_PUBLIC_APP_URL ?? await getOrigin()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "twitch",
    options: { redirectTo: `${origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}` },
  })
  if (error || !data.url) redirect("/login?error=provider_failed")
  redirect(data.url)
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; error?: string }>
}) {
  const params     = await searchParams
  const redirectTo = params.redirect ?? "/"
  const hasError   = !!params.error

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect(redirectTo)

  return (
    <div className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden">

      {/* Atmospheric layers */}
      <div className="absolute inset-0 bg-login-mesh" />
      <div className="absolute inset-0 grid-fine opacity-50" />

      {/* Ambient orbs */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-red/6 blur-[140px] animate-glow-pulse pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-gold/5 blur-[100px] pointer-events-none" />

      {/* Scan lines */}
      <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-red/15 to-transparent top-[38%] pointer-events-none" />
      <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-gold/10 to-transparent top-[62%] pointer-events-none" />

      {/* Corner grid accents */}
      <div className="absolute top-0 left-0 w-48 h-48 pointer-events-none opacity-30"
           style={{backgroundImage:'linear-gradient(rgba(157,111,255,0.08) 1px,transparent 1px),linear-gradient(90deg,rgba(157,111,255,0.08) 1px,transparent 1px)',backgroundSize:'24px 24px'}} />
      <div className="absolute bottom-0 right-0 w-48 h-48 pointer-events-none opacity-30"
           style={{backgroundImage:'linear-gradient(rgba(157,111,255,0.08) 1px,transparent 1px),linear-gradient(90deg,rgba(157,111,255,0.08) 1px,transparent 1px)',backgroundSize:'24px 24px'}} />

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm mx-auto px-4 py-8">

        {/* Double-bezel outer shell */}
        <div className="rounded-[28px] p-px" style={{background:'linear-gradient(145deg, rgba(157,111,255,0.35) 0%, rgba(157,111,255,0.05) 50%, rgba(245,200,66,0.15) 100%)'}}>
          <div className="card-premium rounded-[27px] p-8 space-y-6">

            {/* Brand */}
            <div className="text-center space-y-4 animate-fade-up">
              <div className="flex justify-center">
                <div className="relative w-14 h-14">
                  <div className="absolute inset-0 rounded-2xl bg-red/12 blur-xl animate-glow-pulse" />
                  <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-red/25 bg-red/8">
                    <svg className="h-7 w-7 text-red" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                  </div>
                </div>
              </div>
              <div className="animate-fade-up-1">
                <h1 className="font-display text-3xl tracking-[0.2em] text-glow-gold text-gold">FANTASIX</h1>
                <p className="text-[11px] text-text-muted mt-1 tracking-[0.15em] uppercase">
                  R6 Siege Competitive Platform
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 animate-fade-up-2">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent to-white/8" />
              <span className="font-display text-[9px] text-text-muted tracking-[0.25em]">SIGN IN WITH</span>
              <div className="flex-1 h-px bg-gradient-to-l from-transparent to-white/8" />
            </div>

            {hasError && (
              <div className="rounded-xl border border-danger/25 bg-danger/6 px-4 py-3 text-xs text-danger text-center animate-fade-in">
                Sign in failed · Please try again
              </div>
            )}

            {/* Providers */}
            <div className="space-y-2.5 animate-fade-up-3">
              <form action={signInWithGoogle}>
                <input type="hidden" name="redirect" value={redirectTo} />
                <button type="submit" className="group w-full flex items-center gap-3 h-11 rounded-xl border border-white/8 bg-white/3 hover:bg-white/7 hover:border-white/18 text-text text-sm font-medium transition-all duration-500 px-3.5">
                  <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:border-white/20 transition-colors duration-500">
                    <GoogleIcon />
                  </div>
                  <span className="flex-1 text-left text-[13px]">Continue with Google</span>
                  <svg className="h-3 w-3 text-text-muted group-hover:text-text group-hover:translate-x-0.5 transition-all duration-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </button>
              </form>

              <form action={signInWithDiscord}>
                <input type="hidden" name="redirect" value={redirectTo} />
                <button type="submit" className="group w-full flex items-center gap-3 h-11 rounded-xl border border-[#5865F2]/20 bg-[#5865F2]/5 hover:bg-[#5865F2]/10 hover:border-[#5865F2]/35 text-[#7C8DFF] text-sm font-medium transition-all duration-500 px-3.5">
                  <div className="w-7 h-7 rounded-lg bg-[#5865F2]/10 border border-[#5865F2]/20 flex items-center justify-center shrink-0 group-hover:border-[#5865F2]/40 transition-colors duration-500">
                    <DiscordIcon />
                  </div>
                  <span className="flex-1 text-left text-[13px]">Continue with Discord</span>
                  <svg className="h-3 w-3 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </button>
              </form>

              <form action={signInWithTwitch}>
                <input type="hidden" name="redirect" value={redirectTo} />
                <button type="submit" className="group w-full flex items-center gap-3 h-11 rounded-xl border border-[#9146FF]/20 bg-[#9146FF]/5 hover:bg-[#9146FF]/10 hover:border-[#9146FF]/35 text-[#9146FF] text-sm font-medium transition-all duration-500 px-3.5">
                  <div className="w-7 h-7 rounded-lg bg-[#9146FF]/10 border border-[#9146FF]/20 flex items-center justify-center shrink-0 group-hover:border-[#9146FF]/40 transition-colors duration-500">
                    <TwitchIcon />
                  </div>
                  <span className="flex-1 text-left text-[13px]">Continue with Twitch</span>
                  <svg className="h-3 w-3 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </button>
              </form>
            </div>

            {/* Footer */}
            <div className="text-center space-y-2 pt-1 animate-fade-up-4">
              <p className="text-[10px] text-text-muted tracking-wide">
                No passwords stored · Accept our terms on sign-in
              </p>
              <Link href="/" className="inline-flex items-center gap-1.5 text-[10px] text-text-muted hover:text-text-muted transition-colors duration-300 uppercase tracking-[0.15em]">
                <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
                Back to site
              </Link>
            </div>

          </div>
        </div>

        {/* Decorative rings */}
        <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full border border-white/6 pointer-events-none" />
        <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full border border-gold/6 pointer-events-none" />
      </div>
    </div>
  )
}
