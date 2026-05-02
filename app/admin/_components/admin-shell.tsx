"use client"

import { useState } from "react"
import Link from "next/link"
import { Shield, Menu, X } from "lucide-react"
import { AdminNav } from "@/components/admin/admin-nav"

interface AdminShellProps {
  username: string
  children: React.ReactNode
}

export function AdminShell({ username, children }: AdminShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="px-4 py-5 border-b border-white/8">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-red shrink-0" />
          <span className="font-display text-sm text-text tracking-wider">ADMIN</span>
        </div>
        <p className="text-xs text-text-muted mt-0.5 truncate">{username}</p>
      </div>

      <AdminNav onNavigate={() => setSidebarOpen(false)} />

      <div className="px-4 py-3 border-t border-white/8">
        <Link href="/" className="text-xs text-text-muted hover:text-text transition-colors">
          ← Back to site
        </Link>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen">

      {/* ── Desktop sidebar — always visible md+ ── */}
      <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-white/8 bg-surface">
        <SidebarContent />
      </aside>

      {/* ── Mobile: top bar + drawer ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between h-12 px-4 bg-surface border-b border-white/8">
        <div className="flex items-center gap-2">
          <Shield className="h-3.5 w-3.5 text-red" />
          <span className="font-display text-xs text-text tracking-wider">ADMIN</span>
        </div>
        <button
          onClick={() => setSidebarOpen(v => !v)}
          className="flex items-center justify-center w-8 h-8 text-text-muted hover:text-text transition-colors"
          aria-label="Toggle menu"
        >
          {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 z-40"
          onClick={() => setSidebarOpen(false)}
          style={{ background: "rgba(10,11,15,0.7)" }}
        />
      )}

      {/* Mobile sidebar drawer */}
      <aside
        className={`md:hidden fixed top-12 left-0 bottom-0 z-40 w-56 bg-surface border-r border-white/8 flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent />
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 p-4 sm:p-6 overflow-auto mt-12 md:mt-0">
        {children}
      </main>
    </div>
  )
}
