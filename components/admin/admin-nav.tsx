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

export function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="flex-1 px-2 py-3 space-y-0.5">
      {ADMIN_NAV.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors group",
              active
                ? "bg-purple/10 text-purple border border-purple/20"
                : "text-text-muted hover:text-text hover:bg-white/5"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="flex-1">{label}</span>
            {active ? (
              <span className="h-1.5 w-1.5 rounded-full bg-purple shrink-0" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-50 transition-opacity" />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
