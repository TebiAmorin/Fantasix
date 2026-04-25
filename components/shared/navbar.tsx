"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
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

const NAV_ITEMS = [
  { href: "/fantasy",     label: "Fantasy",     tag: "Draft" },
  { href: "/predictions", label: "Predictions", tag: "Pick'Em" },
] as const

export function Navbar({ user }: { user: Profile | null }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* ── Floating pill navbar ─────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 px-4 pointer-events-none">
        <nav className="navbar-pill pointer-events-auto rounded-full w-full max-w-3xl">
          <div className="flex h-12 items-center justify-between px-3 gap-2">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0 group pl-1">
              <div className="relative flex h-7 w-7 items-center justify-center shrink-0">
                <div className="absolute inset-0 rounded-md bg-purple/20 border border-purple/30 group-hover:border-purple/60 group-hover:bg-purple/25 transition-all duration-500" />
                <svg className="relative h-3.5 w-3.5 text-purple" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <span className="font-display text-base text-text tracking-widest hidden sm:block">
                FANTASIX
              </span>
            </Link>

            {/* Desktop nav links — center */}
            <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
              {NAV_ITEMS.map(({ href, label }) => {
                const active = pathname.startsWith(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "relative px-4 py-1.5 rounded-full text-xs font-medium tracking-wide uppercase transition-all duration-500 cubic-bezier(0.32,0.72,0,1)",
                      active
                        ? "text-gold bg-gold/10 border border-gold/20"
                        : "text-text-muted hover:text-text hover:bg-white/5"
                    )}
                  >
                    {label}
                    {active && (
                      <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-gold glow-gold-sm" />
                    )}
                  </Link>
                )
              })}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2 pr-1">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-2 rounded-full pl-1 pr-3 py-1 border border-white/8 hover:border-purple/30 hover:bg-purple/5 transition-all duration-500 group outline-none">
                    <Avatar className="h-6 w-6 border border-purple/30 shrink-0">
                      <AvatarImage src={user.avatar_url ?? undefined} />
                      <AvatarFallback className="bg-purple/20 text-purple text-[10px] font-display">
                        {user.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:block text-xs text-text-muted max-w-[100px] truncate group-hover:text-text transition-colors duration-300">
                      {user.username}
                    </span>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-surface-alt border-purple/15 mt-2">
                    <DropdownMenuItem className="p-0">
                      <Link href={`/profile/${user.username}`} className="flex items-center gap-2 w-full px-1.5 py-1 text-xs">
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                        My Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="p-0">
                      <Link href="/fantasy/draft" className="text-xs w-full px-1.5 py-1 block">My Draft</Link>
                    </DropdownMenuItem>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {(user as any).role === "admin" && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="p-0">
                          <Link href="/admin" className="text-gold text-xs w-full px-1.5 py-1 block">⚡ Admin Panel</Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="p-0">
                      <Link href="/auth/signout" className="text-danger text-xs w-full px-1.5 py-1 block">Sign out</Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link
                  href="/login"
                  className="btn-primary h-8 text-[11px] px-4"
                >
                  Sign in
                </Link>
              )}

              {/* Mobile hamburger */}
              <button
                onClick={() => setOpen(v => !v)}
                className="md:hidden relative w-8 h-8 flex flex-col items-center justify-center gap-1.5 rounded-full hover:bg-white/5 transition-colors"
                aria-label="Menu"
              >
                <span className={cn(
                  "block h-px w-4 bg-text-muted origin-center transition-all duration-500 cubic-bezier(0.32,0.72,0,1)",
                  open && "rotate-45 translate-y-[5px]"
                )} />
                <span className={cn(
                  "block h-px w-4 bg-text-muted transition-all duration-300",
                  open && "opacity-0 scale-x-0"
                )} />
                <span className={cn(
                  "block h-px w-4 bg-text-muted origin-center transition-all duration-500 cubic-bezier(0.32,0.72,0,1)",
                  open && "-rotate-45 -translate-y-[9px]"
                )} />
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* ── Mobile full-screen overlay ───────────────────────── */}
      <div className={cn(
        "fixed inset-0 z-40 md:hidden transition-all duration-700 cubic-bezier(0.32,0.72,0,1)",
        open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      )}>
        <div className="absolute inset-0 bg-void/95 backdrop-blur-3xl" onClick={() => setOpen(false)} />
        <div className="relative z-10 flex flex-col items-center justify-center h-full gap-6 pb-20">
          {NAV_ITEMS.map(({ href, label, tag }, i) => {
            const active = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex flex-col items-center gap-1 transition-all duration-700",
                  open ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
                  active ? "text-gold" : "text-text-muted hover:text-text"
                )}
                style={{ transitionDelay: open ? `${150 + i * 80}ms` : "0ms" }}
              >
                <span className="font-display text-4xl tracking-widest">{label}</span>
                <span className="text-xs tracking-[0.3em] uppercase opacity-50">{tag}</span>
              </Link>
            )
          })}
          {!user && (
            <div
              className={cn(
                "mt-4 transition-all duration-700",
                open ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              )}
              style={{ transitionDelay: open ? "310ms" : "0ms" }}
            >
              <Link href="/login" onClick={() => setOpen(false)} className="btn-primary px-8 py-3 text-sm">
                Sign in
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Spacer for fixed navbar */}
      <div className="h-16" />
    </>
  )
}
