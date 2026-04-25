import { redirect } from "next/navigation"

// Home redirects to Fantasy — main feature
export default function HomePage() {
  redirect("/fantasy")
}
