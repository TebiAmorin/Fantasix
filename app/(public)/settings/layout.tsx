import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Settings — Fantasix",
  description: "Manage your Fantasix account — avatar, username and preferences.",
  robots: { index: false },
}

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
