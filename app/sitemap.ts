import type { MetadataRoute } from "next"
import { createClient } from "@/lib/supabase/server"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://fantasix.gg"
  const supabase = await createClient()

  // Fetch public usernames for profile pages
  const { data: profiles } = await supabase
    .from("profiles")
    .select("username, updated_at")
    .eq("setup_complete", true)
    .limit(500)

  const profileUrls: MetadataRoute.Sitemap = (profiles ?? []).map((p) => ({
    url: `${base}/profile/${p.username}`,
    lastModified: new Date(p.updated_at),
    changeFrequency: "weekly",
    priority: 0.6,
  }))

  const picksUrls: MetadataRoute.Sitemap = (profiles ?? []).map((p) => ({
    url: `${base}/picks/${p.username}`,
    lastModified: new Date(p.updated_at),
    changeFrequency: "daily",
    priority: 0.5,
  }))

  return [
    { url: base,                          lastModified: new Date(), changeFrequency: "daily",   priority: 1.0  },
    { url: `${base}/predictions`,         lastModified: new Date(), changeFrequency: "hourly",  priority: 0.95 },
    { url: `${base}/leaderboard`,         lastModified: new Date(), changeFrequency: "hourly",  priority: 0.9  },
    { url: `${base}/matches`,             lastModified: new Date(), changeFrequency: "hourly",  priority: 0.85 },
    { url: `${base}/fantasy`,             lastModified: new Date(), changeFrequency: "weekly",  priority: 0.4  },
    ...profileUrls,
    ...picksUrls,
  ]
}
