import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Shield } from "lucide-react"
import { AdminShell } from "./_components/admin-shell"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login?redirect=/admin")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, username")
    .eq("id", user.id)
    .single() as { data: { role: string; username: string } | null }

  if (profile?.role !== "admin") redirect("/")

  return (
    <AdminShell username={profile?.username ?? ""}>
      {children}
    </AdminShell>
  )
}
