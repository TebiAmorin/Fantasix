import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { TeamForm } from "@/components/admin/team-form"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Edit Team — Admin" }

export default async function EditTeamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: team } = await supabase.from("teams").select("*").eq("id", id).single()
  if (!team) notFound()

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="font-display text-2xl text-text">Edit Team</h1>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <p className="text-text-muted text-sm mt-0.5">{(team as any).name}</p>
      </div>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <TeamForm team={team as any} />
    </div>
  )
}
