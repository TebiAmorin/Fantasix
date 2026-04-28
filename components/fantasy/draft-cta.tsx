import Link from "next/link"

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
        className="btn-primary h-10 px-5 text-xs flex items-center gap-2"
      >
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
        Sign in to Draft
      </Link>
    )
  }

  return (
    <div className="flex items-center gap-4 shrink-0">
      <div className="text-right hidden sm:block">
        <p className="text-[9px] text-text-muted uppercase tracking-[0.2em]">Salary Cap</p>
        <p className="text-lg font-stats font-bold text-gold">{salaryCap} <span className="text-xs text-text-muted font-sans font-normal">pts</span></p>
      </div>
      <Link
        href="/fantasy/draft"
        className={hasRoster
          ? "h-10 px-5 text-xs font-display font-bold uppercase tracking-wider rounded-full border border-gold/30 bg-gold/8 text-gold hover:bg-gold/15 hover:border-gold/50 transition-all duration-500 flex items-center gap-2"
          : "btn-primary h-10 px-5 text-xs flex items-center gap-2"
        }
      >
        {hasRoster ? (
          <>
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Edit Roster
          </>
        ) : (
          <>
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            Build Roster
          </>
        )}
      </Link>
    </div>
  )
}
