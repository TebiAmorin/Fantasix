import { TournamentForm } from "@/components/admin/tournament-form"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "New Tournament — Admin" }

export default function NewTournamentPage() {
  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="font-display text-2xl text-text">New Tournament</h1>
        <p className="text-text-muted text-sm mt-0.5">Create a tournament to start managing matches and phases</p>
      </div>
      <TournamentForm />
    </div>
  )
}
