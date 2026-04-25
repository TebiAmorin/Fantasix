import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Supabase Storage (team logos, player avatars)
      {
        protocol: "https",
        hostname: "dtxzpnqfmttjiqxlbivh.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      // Google OAuth avatars
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      // Discord CDN avatars
      {
        protocol: "https",
        hostname: "cdn.discordapp.com",
      },
      // Twitch CDN avatars
      {
        protocol: "https",
        hostname: "static-cdn.jtvnw.net",
      },
    ],
  },
}

export default nextConfig
