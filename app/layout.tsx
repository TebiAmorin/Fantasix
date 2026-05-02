import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Barlow_Condensed } from "next/font/google"
import { IBM_Plex_Mono } from "next/font/google"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
})

const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["700"],
  display: "swap",
})

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "Fantasix — R6 Siege Pick'Em",
    template: "%s | Fantasix",
  },
  description:
    "Predict match winners and climb the global leaderboard at the BLAST R6 Major Salt Lake City 2026.",
  keywords: ["rainbow six siege", "pick em", "predictions", "esports", "R6", "BLAST Major", "SLC 2026"],
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://fantasix.gg"),
  openGraph: {
    type: "website",
    siteName: "Fantasix",
    title: "Fantasix — R6 Siege Pick'Em",
    description: "Predict match winners at the BLAST R6 Major SLC 2026.",
    url: "/",
    images: [{ url: "/api/og", width: 1200, height: 630, alt: "Fantasix" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Fantasix — R6 Siege Pick'Em",
    description: "Predict match winners at the BLAST R6 Major SLC 2026.",
    images: ["/api/og"],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${barlowCondensed.variable} ${ibmPlexMono.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-void">
        {children}
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#111318",
              border: "1px solid #252830",
              color: "#F0F2F8",
            },
          }}
        />
      </body>
    </html>
  )
}
