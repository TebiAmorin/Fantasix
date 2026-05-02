"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Profile } from "@/lib/types/database.types"
import { PushButton } from "@/components/push/push-button"

const NAV_ITEMS = [
  { href: "/predictions", label: "Predictions", tag: "Pick'Em",    icon: "★", soon: false },
  { href: "/leaderboard", label: "Leaderboard", tag: "Rankings",   icon: "◆", soon: false },
  { href: "/matches",     label: "Schedule",    tag: "Matches",    icon: "▶", soon: false },
  { href: "/simulator",   label: "Simulator",   tag: "Bracket",    icon: "⬡", soon: false },
  { href: "/fantasy",     label: "Fantasy",     tag: "Draft",      icon: "⚡", soon: true  },
] as const

export function Navbar({ user }: { user: Profile | null }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false) }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [open])

  useEffect(() => { setOpen(false) }, [pathname])

  return (
    <>
      {/* ── Flat attached navbar ───────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 navbar-pill">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex h-14 items-center justify-between gap-4">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
              {/* Logo mark — angular F, matches the brand mark */}
              <div
                className="relative flex h-7 w-7 items-center justify-center shrink-0 transition-colors duration-200"
                style={{
                  background: "#C41E3A",
                  clipPath: "polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)",
                }}
              >
                <span className="font-display text-white text-xs leading-none">F</span>
              </div>
              <span className="font-display text-sm text-text tracking-[0.12em] hidden sm:block group-hover:text-white transition-colors duration-200">
                FANTASIX
              </span>
            </Link>

            {/* Desktop nav — left-aligned after logo */}
            <nav className="hidden md:flex items-center gap-0.5 flex-1 ml-4">
              {NAV_ITEMS.map(({ href, label, soon }) => {
                const active = pathname.startsWith(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "relative flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-display tracking-[0.06em] uppercase transition-colors duration-150",
                      active
                        ? "text-white"
                        : "text-text-muted hover:text-text"
                    )}
                  >
                    {label}
                    {soon && (
                      <span className="text-[7px] font-display tracking-[0.1em] text-text-dim border border-white/10 px-1 py-px leading-none">
                        SOON
                      </span>
                    )}
                    {/* Active underline — sharp red accent */}
                    {active && (
                      <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-red" />
                    )}
                  </Link>
                )
              })}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-2">
              <div className="hidden sm:block">
                <PushButton userId={user?.id ?? null} />
              </div>

              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-2 px-2 py-1 border border-transparent hover:border-white/10 hover:bg-white/4 transition-all duration-150 rounded outline-none touch-target">
                    <Avatar className="h-6 w-6 shrink-0">
                      <AvatarImage src={user.avatar_url ?? undefined} />
                      <AvatarFallback className="bg-red/20 text-red text-[10px] font-display" style={{ borderRadius: 2 }}>
                        {user.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:block text-[11px] text-text-muted max-w-[80px] truncate hover:text-text transition-colors duration-150">
                      {user.username}
                    </span>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44 bg-surface-alt border-border mt-1" style={{ borderRadius: 4 }}>
                    <DropdownMenuItem className="p-0">
                      <Link href={`/profile/${user.username}`} className="flex items-center gap-2 w-full px-3 py-2 text-xs">
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                        My Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="p-0">
                      <Link href="/settings" className="flex items-center gap-2 w-full px-3 py-2 text-xs">
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="p-0">
                      <Link href="/fantasy" className="text-xs w-full px-3 py-2 block text-text-muted">Fantasy <span className="text-text-dim">(soon)</span></Link>
                    </DropdownMenuItem>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {(user as any).role === "admin" && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="p-0">
                          <Link href="/admin" className="text-gold text-xs w-full px-3 py-2 block">⚡ Admin Panel</Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="p-0">
                      <Link href="/auth/signout" className="text-danger text-xs w-full px-3 py-2 block">Sign out</Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link
                  href="/login"
                  className="btn-primary h-8 text-[10px] px-4 hidden sm:inline-flex"
                >
                  Sign in
                </Link>
              )}

              {/* Mobile hamburger */}
              <button
                onClick={() => setOpen(v => !v)}
                className="md:hidden relative flex items-center justify-center w-10 h-10 hover:bg-white/5 transition-colors touch-target"
                aria-label={open ? "Close menu" : "Open menu"}
                aria-expanded={open}
              >
                <span className="relative flex flex-col gap-[5px] w-5 h-[14px]">
                  <span className={cn(
                    "block h-[1.5px] bg-text-muted origin-center transition-all duration-300",
                    open ? "rotate-45 translate-y-[7.5px] bg-white w-full" : "w-full"
                  )} />
                  <span className={cn(
                    "block h-[1.5px] bg-text-muted transition-all duration-200 w-3/4",
                    open && "opacity-0 scale-x-0"
                  )} />
                  <span className={cn(
                    "block h-[1.5px] bg-text-muted origin-center transition-all duration-300",
                    open ? "-rotate-45 -translate-y-[7.5px] bg-white w-full" : "w-1/2"
                  )} />
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Mobile slide-in menu ───────────────────────────────── */}
      <div
        className={cn(
          "fixed inset-0 z-40 md:hidden transition-opacity duration-300",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        aria-hidden={!open}
      >
        {/* Solid backdrop — no blur */}
        <div
          className="absolute inset-0"
          style={{ background: "rgba(10,11,15,0.98)" }}
          onClick={() => setOpen(false)}
        />

        {/* Diagonal stripe — structural texture */}
        <div className="absolute inset-0 bg-tactical-stripe pointer-events-none" />

        {/* Left red accent bar */}
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-red" />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full pt-16 pb-safe">

          {/* Event label */}
          <div
            className={cn(
              "px-6 mb-6 transition-all duration-300",
              open ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3"
            )}
            style={{ transitionDelay: open ? "60ms" : "0ms" }}
          >
            <div className="flex items-center gap-2">
              <span className="h-[2px] w-6 bg-red flex-shrink-0" />
              <span className="text-[9px] font-display tracking-[0.25em] uppercase text-text-dim">
                BLAST R6 Major · SLC 2026
              </span>
            </div>
          </div>

          {/* Nav items */}
          <nav className="flex flex-col px-4 flex-1 gap-1">
            {NAV_ITEMS.map(({ href, label, tag, soon }, i) => {
              const active = pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center justify-between px-4 py-4 transition-all duration-300 border-l-[3px]",
                    open ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4",
                    active
                      ? "border-red bg-red/5"
                      : "border-transparent hover:border-white/10 hover:bg-white/2"
                  )}
                  style={{
                    transitionDelay: open ? `${100 + i * 50}ms` : "0ms",
                  }}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className={cn(
                      "font-display text-2xl tracking-[0.04em] leading-none",
                      active ? "text-white" : "text-text-muted"
                    )}>
                      {label}
                    </span>
                    <span className="text-[9px] tracking-[0.2em] uppercase font-display" style={{
                      color: active ? "rgba(196,30,58,0.7)" : "rgba(138,144,158,0.4)"
                    }}>
                      {soon ? "Coming soon" : tag}
                    </span>
                  </div>
                  {active && (
                    <svg className="h-4 w-4 text-red flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Bottom user section */}
          <div
            className={cn(
              "px-4 pb-8 transition-all duration-300 space-y-4",
              open ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
            style={{ transitionDelay: open ? "360ms" : "0ms" }}
          >
            <div className="h-px bg-white/6" />

            {user ? (
              <div className="flex items-center justify-between gap-4 px-2">
                <Link
                  href={`/profile/${user.username}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 flex-1 min-w-0"
                >
                  <Avatar className="h-8 w-8 shrink-0" style={{ borderRadius: 2 }}>
                    <AvatarImage src={user.avatar_url ?? undefined} />
                    <AvatarFallback className="bg-red/15 text-red text-[10px] font-display" style={{ borderRadius: 2 }}>
                      {user.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-display text-text truncate">{user.username}</p>
                    <p className="text-[9px] text-text-dim uppercase tracking-wider">View profile →</p>
                  </div>
                </Link>
                <div className="flex items-center gap-2 shrink-0">
                  <PushButton userId={user.id} />
                  <Link
                    href="/settings"
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-center w-9 h-9 border border-white/8 hover:border-white/20 transition-colors touch-target"
                    style={{ borderRadius: 2 }}
                  >
                    <svg className="h-3.5 w-3.5 text-text-muted" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                  </Link>
                  <Link
                    href="/auth/signout"
                    className="flex items-center justify-center w-9 h-9 border border-danger/15 hover:border-danger/40 transition-colors touch-target"
                    style={{ borderRadius: 2 }}
                  >
                    <svg className="h-3.5 w-3.5 text-danger/60" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  </Link>
                </div>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-4 font-display text-sm uppercase tracking-[0.08em] transition-colors touch-target"
                style={{
                  background: "#C41E3A",
                  color: "#FFF",
                  borderRadius: 2,
                }}
              >
                Sign in to Play
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Spacer for fixed navbar */}
      <div className="h-14" />
    </>
  )
}
