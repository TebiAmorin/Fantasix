import { PhaseForm } from "@/components/admin/phase-form"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Add Phase — Admin" }

export default async function NewPhasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="font-display text-2xl text-text">Add Phase</h1>
        <p className="text-text-muted text-sm mt-0.5">Add a competition phase to this tournament</p>
      </div>
      <PhaseForm tournamentId={id} />
    </div>
  )
}
