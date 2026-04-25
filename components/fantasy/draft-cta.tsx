import Link from "next/link"
import { Pencil, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

interface DraftCTAProps {
  user: { id: string } | null
  hasRoster: boolean
  phaseId: string
  salaryCap: number
}

export function DraftCTA({ user, hasRoster, salaryCap }: DraftCTAProps) {
  if (!user) {
    return (
      <Link
        href="/login?redirect=/fantasy/draft"
        className={cn(buttonVariants(), "bg-gold text-void hover:bg-gold/90 font-medium shrink-0")}
      >
        <Plus className="h-4 w-4 mr-2" />
        Sign in to Draft
      </Link>
    )
  }

  return (
    <div className="flex items-center gap-3 shrink-0">
      <div className="text-right hidden sm:block">
        <p className="text-xs text-text-muted">Salary Cap</p>
        <p className="text-sm font-stats font-bold text-gold">{salaryCap} pts</p>
      </div>
      <Link
        href="/fantasy/draft"
        className={cn(
          buttonVariants(),
          hasRoster
            ? "bg-surface border border-gold/30 text-gold hover:bg-gold/10 font-medium"
            : "bg-gold text-void hover:bg-gold/90 font-medium"
        )}
      >
        {hasRoster ? (
          <>
            <Pencil className="h-4 w-4 mr-2" />
            Edit Roster
          </>
        ) : (
          <>
            <Plus className="h-4 w-4 mr-2" />
            Build Roster
          </>
        )}
      </Link>
    </div>
  )
}
