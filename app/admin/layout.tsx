import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Shield, Trophy, Users, Swords, Settings, BarChart3, ChevronRight, RefreshCw } from "lucide-react"

const ADMIN_NAV = [
  { href: "/admin",             label: "Dashboard",   icon: BarChart3 },
  { href: "/admin/sync",        label: "PS Sync",     icon: RefreshCw },
  { href: "/admin/tournaments", label: "Tournaments", icon: Trophy },
  { href: "/admin/teams",       label: "Teams",       icon: Users },
  { href: "/admin/players",     label: "Players",     icon: Users },
  { href: "/admin/matches",     label: "Matches",     icon: Swords },
  { href: "/admin/scoring",     label: "Scoring",     icon: Settings },
]

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login?redirect=/admin")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, username")
    .eq("id", user.id)
    .single() as { data: { role: string; username: string } | null }

  if (profile?.role !== "admin") redirect("/")

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-white/8 bg-surface flex flex-col">
        <div className="px-4 py-5 border-b border-white/8">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-purple" />
            <span className="font-display text-sm text-text tracking-wider">ADMIN</span>
          </div>
          <p className="text-xs text-text-muted mt-0.5 truncate">{profile?.username}</p>
        </div>

        <nav className="flex-1 px-2 py-3 space-y-0.5">
          {ADMIN_NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors group text-text-muted hover:text-text hover:bg-white/5"
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{label}</span>
              <ChevronRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-50 transition-opacity" />
            </Link>
          ))}
        </nav>

        <div className="px-4 py-3 border-t border-white/8">
          <Link href="/" className="text-xs text-text-muted hover:text-text transition-colors">
            ← Back to site
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-6 overflow-auto">
        {children}
      </main>
    </div>
  )
}
