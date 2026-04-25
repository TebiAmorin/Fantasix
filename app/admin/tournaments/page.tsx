import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Plus, CheckCircle2, Circle, ChevronRight, Lock, Unlock, AlertCircle } from "lucide-react"
import { TournamentActions } from "@/components/admin/tournament-actions"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Tournaments — Admin" }

export default async function TournamentsPage() {
  const supabase = await createClient()
  const { data: tournaments } = await supabase
    .from("tournaments")
    .select("*, phases(*)")
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-text">Tournaments</h1>
          <p className="text-text-muted text-sm mt-0.5">Manage tournaments and phases</p>
        </div>
        <Link
          href="/admin/tournaments/new"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gold text-void text-sm font-medium hover:bg-gold/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Tournament
        </Link>
      </div>

      <div className="space-y-4">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {(tournaments as any[] ?? []).map((t) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const phases = (t.phases as any[] ?? []).sort((a: any, b: any) => a.order_index - b.order_index)
          const activePhase = phases.find((p: { is_active: boolean }) => p.is_active)

          return (
            <div key={t.id} className="card-tactical rounded-lg overflow-hidden">
              {/* Tournament header */}
              <div className="px-5 py-4 flex items-center justify-between border-b border-white/8">
                <div className="flex items-center gap-3">
                  {t.is_active ? (
                    <CheckCircle2 className="h-4 w-4 text-gold shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 text-text-muted shrink-0" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-medium text-text">{t.name}</h2>
                      {t.is_active && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-gold/15 border border-gold/30 text-gold font-medium">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-muted font-mono">{t.slug}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <TournamentActions tournament={t} />
                  <Link
                    href={`/admin/tournaments/${t.id}/edit`}
                    className="p-1.5 rounded-md text-text-muted hover:text-text hover:bg-white/5 transition-colors text-xs"
                  >
                    Edit
                  </Link>
                  <Link
                    href={`/admin/tournaments/${t.id}/phases/new`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-purple/15 border border-purple/30 text-purple text-xs hover:bg-purple/20 transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                    Add Phase
                  </Link>
                </div>
              </div>

              {/* Phases */}
              {phases.length > 0 ? (
                <div className="divide-y divide-white/5">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {phases.map((phase: any) => (
                    <div key={phase.id} className="px-5 py-3 flex items-center gap-4">
                      <div className="flex items-center gap-2 w-6">
                        <span className="text-xs text-text-muted font-stats">{phase.order_index}</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-text">{phase.name}</span>
                          <span className="text-[10px] text-text-muted border border-white/10 px-1.5 py-0.5 rounded">
                            {phase.type.replace("_", " ")}
                          </span>
                          {phase.is_active && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-success/10 border border-success/30 text-success">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-text-muted mt-0.5">
                          Cap: <span className="text-gold font-stats">{phase.salary_cap}</span>
                        </p>
                      </div>

                      {/* Draft status */}
                      <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md border ${
                        phase.draft_open
                          ? "bg-success/10 border-success/30 text-success"
                          : "bg-white/3 border-white/10 text-text-muted"
                      }`}>
                        {phase.draft_open ? (
                          <><Unlock className="h-3 w-3" /> Draft Open</>
                        ) : (
                          <><Lock className="h-3 w-3" /> Draft Closed</>
                        )}
                      </div>

                      <Link
                        href={`/admin/tournaments/${t.id}/phases/${phase.id}/edit`}
                        className="p-1.5 rounded-md text-text-muted hover:text-text hover:bg-white/5 transition-colors"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-5 py-4 flex items-center gap-2 text-text-muted text-sm">
                  <AlertCircle className="h-4 w-4" />
                  No phases yet — add phases to enable draft and scoring
                </div>
              )}
            </div>
          )
        })}

        {(!tournaments || tournaments.length === 0) && (
          <div className="card-tactical rounded-lg p-12 text-center space-y-3">
            <p className="text-text-muted text-sm">No tournaments yet</p>
            <Link
              href="/admin/tournaments/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gold text-void text-sm font-medium hover:bg-gold/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create First Tournament
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
