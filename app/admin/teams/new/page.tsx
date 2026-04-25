import { TeamForm } from "@/components/admin/team-form"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "New Team — Admin" }

export default function NewTeamPage() {
  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="font-display text-2xl text-text">Add Team</h1>
        <p className="text-text-muted text-sm mt-0.5">Create a new team for the roster</p>
      </div>
      <TeamForm />
    </div>
  )
}
