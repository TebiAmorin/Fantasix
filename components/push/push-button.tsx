"use client"

import { useEffect, useState, useCallback } from "react"

type State = "unsupported" | "loading" | "denied" | "subscribed" | "unsubscribed"

function BellIcon({ active, className }: { active: boolean; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      {active && (
        <circle cx="19" cy="5" r="3" fill="currentColor" stroke="none" className="text-gold" />
      )}
    </svg>
  )
}

export function PushButton({ userId }: { userId: string | null }) {
  const [state, setState] = useState<State>("loading")

  const getRegistration = useCallback(async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return null
    return navigator.serviceWorker.register("/sw.js")
  }, [])

  useEffect(() => {
    if (!userId) { setState("unsupported"); return }
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setState("unsupported"); return
    }
    if (Notification.permission === "denied") { setState("denied"); return }

    getRegistration().then(async (reg) => {
      if (!reg) { setState("unsupported"); return }
      const sub = await reg.pushManager.getSubscription()
      setState(sub ? "subscribed" : "unsubscribed")
    })
  }, [userId, getRegistration])

  const subscribe = useCallback(async () => {
    setState("loading")
    const reg = await getRegistration()
    if (!reg) return

    try {
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) {
        console.warn("VAPID public key not configured")
        setState("unsupported")
        return
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })

      const { endpoint, keys } = sub.toJSON() as {
        endpoint: string
        keys: { p256dh: string; auth: string }
      }

      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint, p256dh: keys.p256dh, auth: keys.auth }),
      })

      setState("subscribed")
    } catch {
      setState(Notification.permission === "denied" ? "denied" : "unsubscribed")
    }
  }, [getRegistration])

  const unsubscribe = useCallback(async () => {
    setState("loading")
    const reg = await getRegistration()
    if (!reg) return

    const sub = await reg.pushManager.getSubscription()
    if (sub) {
      await fetch("/api/push/subscribe", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      })
      await sub.unsubscribe()
    }
    setState("unsubscribed")
  }, [getRegistration])

  // Not logged in or browser doesn't support it
  if (!userId || state === "unsupported") return null

  const isSubscribed = state === "subscribed"
  const isDenied = state === "denied"
  const isLoading = state === "loading"

  return (
    <button
      onClick={isSubscribed ? unsubscribe : isDenied ? undefined : subscribe}
      disabled={isLoading || isDenied}
      title={
        isDenied
          ? "Notifications blocked — enable in browser settings"
          : isSubscribed
          ? "Notifications on · click to disable"
          : "Get notified when matches go live"
      }
      className={`
        relative flex items-center justify-center h-8 w-8 rounded-lg transition-all duration-300
        ease-[cubic-bezier(0.32,0.72,0,1)]
        ${isSubscribed
          ? "text-gold hover:bg-gold/10"
          : isDenied
          ? "text-text-dim cursor-not-allowed opacity-40"
          : "text-text-muted hover:text-text hover:bg-white/6"
        }
        ${isLoading ? "opacity-50 pointer-events-none" : ""}
      `}
    >
      {isLoading ? (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
      ) : (
        <BellIcon active={isSubscribed} className="h-4 w-4" />
      )}

      {/* Pulse dot when subscribed */}
      {isSubscribed && (
        <span className="absolute top-1 right-1 flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-60" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-gold" />
        </span>
      )}
    </button>
  )
}

// Utility — convert VAPID base64 to Uint8Array
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = window.atob(base64)
  const arr = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) arr[i] = rawData.charCodeAt(i)
  return arr.buffer as ArrayBuffer
}
