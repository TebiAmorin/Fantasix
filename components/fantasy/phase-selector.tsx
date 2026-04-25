"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import type { Phase } from "@/lib/types/database.types"

interface PhaseSelectorProps {
  phases: Phase[]
  activePhaseid?: string
}

const PHASE_LABELS: Record<string, string> = {
  double_elimination: "Double Elim",
  swiss: "Swiss",
  playoffs: "Playoffs",
  groups: "Groups",
}

export function PhaseSelector({ phases, activePhaseid }: PhaseSelectorProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedPhase = searchParams.get("phase") ?? activePhaseid

  const sorted = [...phases].sort((a, b) => a.order_index - b.order_index)

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-text-muted uppercase tracking-wider mr-1">Phase:</span>
      <button
        onClick={() => {
          const params = new URLSearchParams(searchParams)
          params.delete("phase")
          router.push(`/fantasy?${params.toString()}`)
        }}
        className={cn(
          "px-3 py-1.5 rounded-md text-xs font-medium transition-colors border",
          !selectedPhase || selectedPhase === activePhaseid
            ? "bg-purple/20 border-purple/40 text-purple"
            : "bg-surface border-white/8 text-text-muted hover:text-text"
        )}
      >
        All
      </button>
      {sorted.map((phase) => (
        <button
          key={phase.id}
          onClick={() => {
            const params = new URLSearchParams(searchParams)
            params.set("phase", phase.id)
            router.push(`/fantasy?${params.toString()}`)
          }}
          className={cn(
            "px-3 py-1.5 rounded-md text-xs font-medium transition-colors border",
            selectedPhase === phase.id
              ? "bg-purple/20 border-purple/40 text-purple"
              : "bg-surface border-white/8 text-text-muted hover:text-text"
          )}
        >
          {PHASE_LABELS[phase.type] ?? phase.name}
          {phase.is_active && (
            <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-gold align-middle" />
          )}
        </button>
      ))}
    </div>
  )
}
