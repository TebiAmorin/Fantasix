"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Trophy, Users, Swords, Settings, BarChart3, ChevronRight, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

const ADMIN_NAV = [
  { href: "/admin",             label: "Dashboard",   icon: BarChart3, exact: true  },
  { href: "/admin/sync",        label: "PS Sync",     icon: RefreshCw, exact: false },
  { href: "/admin/tournaments", label: "Tournaments", icon: Trophy,    exact: false },
  { href: "/admin/teams",       label: "Teams",       icon: Users,     exact: false },
  { href: "/admin/players",     label: "Players",     icon: Users,     exact: false },
  { href: "/admin/matches",     label: "Matches",     icon: Swords,    exact: false },
  { href: "/admin/scoring",     label: "Scoring",     icon: Settings,  exact: false },
]

export function AdminNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <nav className="flex-1 px-2 py-3 space-y-0.5">
      {ADMIN_NAV.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 text-sm transition-colors group",
              "rounded-sm",
              active
                ? "bg-red/8 text-red border border-red/20"
                : "text-text-muted hover:text-text hover:bg-white/5 border border-transparent"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="flex-1">{label}</span>
            {active ? (
              <span className="h-1.5 w-1.5 rounded-full bg-red shrink-0" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-50 transition-opacity" />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
