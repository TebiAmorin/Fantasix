import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Rajdhani } from "next/font/google"
import { Roboto_Mono } from "next/font/google"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
})

const rajdhani = Rajdhani({
  variable: "--font-rajdhani",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
})

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "Fantasix — R6 Siege Fantasy League",
    template: "%s | Fantasix",
  },
  description:
    "The unofficial competitive ecosystem for Rainbow Six Siege. Fantasy League, Pick'Em predictions and more.",
  keywords: ["rainbow six siege", "fantasy league", "esports", "R6", "BLAST Major"],
  openGraph: {
    type: "website",
    siteName: "Fantasix",
    title: "Fantasix — R6 Siege Fantasy League",
    description: "The unofficial competitive ecosystem for Rainbow Six Siege.",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${rajdhani.variable} ${robotoMono.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-void">
        {children}
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#151226",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#F8FAFC",
            },
          }}
        />
      </body>
    </html>
  )
}
