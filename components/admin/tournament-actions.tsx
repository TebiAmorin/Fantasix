"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { upsertTournament } from "@/lib/actions/admin"

interface TournamentActionsProps {
  tournament: { id: string; name: string; slug: string; is_active: boolean }
}

export function TournamentActions({ tournament }: TournamentActionsProps) {
  const [isPending, startTransition] = useTransition()

  const toggleActive = () => {
    if (tournament.is_active) return // Can't deactivate from here — set another active instead

    startTransition(async () => {
      const fd = new FormData()
      fd.set("id", tournament.id)
      fd.set("name", tournament.name)
      fd.set("slug", tournament.slug)
      fd.set("is_active", "true")
      await upsertTournament(fd)
      toast.success(`${tournament.name} set as active`)
    })
  }

  if (tournament.is_active) return null

  return (
    <button
      onClick={toggleActive}
      disabled={isPending}
      className="px-3 py-1.5 rounded-md text-xs bg-gold/10 border border-gold/30 text-gold hover:bg-gold/20 transition-colors disabled:opacity-50"
    >
      {isPending ? "..." : "Set Active"}
    </button>
  )
}
