import { Navbar } from "@/components/shared/navbar"
import { createClient } from "@/lib/supabase/server"

export const revalidate = 60

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single()
    profile = data
  }

  return (
    <div className="relative flex flex-col min-h-screen bg-void">
      {/* Diagonal stripe texture — fixed, low opacity */}
      <div className="fixed inset-0 bg-tactical-stripe opacity-60 pointer-events-none z-0" />

      <Navbar user={profile} />

      <main className="relative z-10 flex-1">
        {children}
      </main>

      <footer className="relative z-10 border-t border-white/6 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <svg className="h-3.5 w-3.5 text-red opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <span className="font-display text-xs text-text-muted tracking-[0.15em]">FANTASIX</span>
          </div>
          <p className="text-[10px] text-text-muted tracking-wide text-center">
            Unofficial R6 Siege Competitive Platform · Not affiliated with Ubisoft or BLAST
          </p>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <span className="text-[10px] text-text-muted">All systems operational</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
