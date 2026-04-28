import { createAdminClient } from "@/lib/supabase/server"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { SyncButton } from "@/components/admin/sync-button"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "PandaScore Sync — Admin" }

export default async function SyncPage() {
  // Admin guard
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any).from("profiles").select("role").eq("id", user.id).single()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((profile as any)?.role !== "admin") redirect("/")

  // Load active tournament
  const adminClient = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: tournament } = await (adminClient as any)
    .from("tournaments")
    .select("id, name, pandascore_id, last_synced_at")
    .eq("is_active", true)
    .single() as {
      data: { id: string; name: string; pandascore_id: string | null; last_synced_at: string | null } | null
    }

  // Load sync logs
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: logs } = await (adminClient as any)
    .from("sync_logs")
    .select("id, status, matches_created, matches_updated, error_message, duration_ms, triggered_by, synced_at")
    .order("synced_at", { ascending: false })
    .limit(25) as {
      data: Array<{
        id: string
        status: string
        matches_created: number
        matches_updated: number
        error_message: string | null
        duration_ms: number | null
        triggered_by: string
        synced_at: string
      }> | null
    }

  // Match counts by status
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: matchCounts } = tournament ? await (adminClient as any)
    .from("matches")
    .select("status")
    .eq("tournament_id", tournament.id)
    : { data: null }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const counts = (matchCounts ?? []) as any[]
  const statusCounts = {
    scheduled:  counts.filter(m => m.status === "scheduled").length,
    live:       counts.filter(m => m.status === "live").length,
    completed:  counts.filter(m => m.status === "completed").length,
  }

  const configured = !!(process.env.PANDASCORE_TOKEN && process.env.SYNC_SECRET)

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="font-display text-3xl text-text">PandaScore Sync</h1>
        <p className="text-text-muted text-sm mt-1">
          Auto-imports match data from PandaScore for the active tournament
        </p>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Scheduled", value: statusCounts.scheduled, color: "text-text" },
          { label: "Live",      value: statusCounts.live,      color: "text-live" },
          { label: "Completed", value: statusCounts.completed, color: "text-success" },
          { label: "Total",     value: counts.length,          color: "text-gold" },
        ].map(({ label, value, color }) => (
          <div key={label} className="card-tactical rounded-lg p-4 text-center space-y-1">
            <p className={`font-stats text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-[10px] text-text-muted uppercase tracking-widest">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Sync control */}
        <div className="card-tactical rounded-xl p-5 space-y-5">
          <h2 className="font-display text-base text-text uppercase tracking-wide">Manual Sync</h2>

          {/* Config status */}
          <div className="space-y-2">
            {[
              { label: "PANDASCORE_TOKEN", ok: !!process.env.PANDASCORE_TOKEN },
              { label: "SYNC_SECRET",      ok: !!process.env.SYNC_SECRET },
              { label: "Active tournament", ok: !!tournament },
              { label: "PandaScore ID cached", ok: !!tournament?.pandascore_id },
            ].map(({ label, ok }) => (
              <div key={label} className="flex items-center gap-2.5 text-xs">
                <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${ok ? "bg-success" : "bg-danger"}`} />
                <span className="text-text-muted font-stats">{label}</span>
                <span className={`ml-auto font-stats ${ok ? "text-success" : "text-danger"}`}>
                  {ok ? "OK" : "missing"}
                </span>
              </div>
            ))}
          </div>

          {tournament && (
            <div className="pt-1 border-t border-white/8 space-y-1.5">
              <p className="text-xs text-text-muted">
                Tournament: <span className="text-text">{tournament.name}</span>
              </p>
              {tournament.pandascore_id && (
                <p className="text-xs text-text-muted font-stats truncate">
                  PS IDs: <span className="text-text-dim">{tournament.pandascore_id}</span>
                </p>
              )}
            </div>
          )}

          {configured ? (
            <SyncButton />
          ) : (
            <div className="rounded-lg px-4 py-3 bg-danger/6 border border-danger/20 text-xs text-danger">
              Add <code className="font-stats">PANDASCORE_TOKEN</code> and{" "}
              <code className="font-stats">SYNC_SECRET</code> to <code>.env.local</code> to enable.
            </div>
          )}

          <div className="pt-1 border-t border-white/8 space-y-1.5 text-xs text-text-muted">
            <p className="font-display text-[10px] uppercase tracking-widest text-text-dim mb-2">Cron schedule</p>
            <p>Vercel runs this automatically <span className="font-stats text-text">every 5 min</span> when deployed.</p>
            <p>The SLC 2026 data will appear in PandaScore around <span className="text-gold">May 5–6</span>.</p>
          </div>
        </div>

        {/* Recent sync logs */}
        <div className="card-tactical rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/8">
            <h2 className="font-display text-base text-text uppercase tracking-wide">Sync Log</h2>
          </div>

          {!logs || logs.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="text-sm text-text-muted">No syncs yet</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5 max-h-[400px] overflow-y-auto">
              {logs.map(log => (
                <div key={log.id} className="px-5 py-3 flex items-start gap-3">
                  <div className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${
                    log.status === "success" ? "bg-success" : "bg-danger"
                  }`} />
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-stats font-bold ${
                        log.status === "success" ? "text-success" : "text-danger"
                      }`}>
                        {log.status === "success"
                          ? `+${log.matches_created} created · ${log.matches_updated} updated`
                          : "error"
                        }
                      </span>
                      <span className="text-[10px] text-text-dim font-stats ml-auto">
                        {log.duration_ms != null ? `${log.duration_ms}ms` : ""}
                      </span>
                    </div>
                    {log.error_message && (
                      <p className="text-[11px] text-danger/70 truncate">{log.error_message}</p>
                    )}
                    <p className="text-[10px] text-text-dim font-stats">
                      {new Date(log.synced_at).toLocaleString("en-US", {
                        month: "short", day: "numeric",
                        hour: "2-digit", minute: "2-digit", second: "2-digit",
                      })}
                      {" · "}{log.triggered_by}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
