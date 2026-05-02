import webpush from "web-push"
import { createAdminClient } from "@/lib/supabase/server"

webpush.setVapidDetails(
  process.env.VAPID_EMAIL ?? "mailto:admin@fantasix.gg",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
)

export interface PushPayload {
  title: string
  body: string
  icon?: string
  tag?: string
  url?: string
}

/** Send a push to every subscriber. Silently removes stale endpoints. */
export async function sendPushToAll(payload: PushPayload) {
  const supabase = createAdminClient()
  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")

  if (!subs?.length) return { sent: 0, removed: 0 }

  const staleIds: string[] = []
  let sent = 0

  await Promise.allSettled(
    subs.map(async (sub: { id: string; endpoint: string; p256dh: string; auth: string }) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload),
        )
        sent++
      } catch (err: unknown) {
        // 410 Gone = subscription expired / user revoked
        if ((err as { statusCode?: number })?.statusCode === 410) {
          staleIds.push(sub.id)
        }
      }
    }),
  )

  // Clean up dead subscriptions
  if (staleIds.length) {
    await supabase.from("push_subscriptions").delete().in("id", staleIds)
  }

  return { sent, removed: staleIds.length }
}
