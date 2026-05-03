"use client"

import { useState, useTransition, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { updateProfile, uploadAvatar } from "@/lib/actions/user"
import { User } from "lucide-react"
import { PushButton } from "@/components/push/push-button"

export default function SettingsPage() {
  const [profile, setProfile] = useState<{ id: string; username: string; avatar_url: string | null; email: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/profile/me")
      .then(r => r.ok ? r.json() : null)
      .then(d => { setProfile(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div>
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-slc-mesh" />
        <div className="absolute inset-0 slc-slash opacity-100 pointer-events-none" />

        {/* Orbs */}
        <div className="absolute -top-10 -left-6 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: "rgba(196,30,58,0.14)", filter: "blur(80px)" }} />
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full pointer-events-none"
          style={{ background: "rgba(0,212,184,0.07)", filter: "blur(70px)" }} />

        {/* Bottom separator */}
        <div className="absolute inset-x-0 bottom-0 h-px pointer-events-none"
          style={{ background: "linear-gradient(to right, transparent, rgba(196,30,58,0.4), rgba(0,212,184,0.3), transparent)" }} />

        <div className="relative z-10 mx-auto max-w-xl px-4 sm:px-6 pt-10 pb-12">
          <div className="space-y-3 animate-fade-up">
            <div
              className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 w-fit"
              style={{ color: "#C41E3A", border: "1px solid rgba(196,30,58,0.3)", background: "rgba(196,30,58,0.10)" }}
            >
              <svg className="h-2.5 w-2.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
              </svg>
              <span className="text-[10px] font-display font-bold uppercase tracking-[0.2em]">Account</span>
            </div>
            <h1 className="font-display text-4xl sm:text-5xl text-text leading-none tracking-tight">
              Settings
            </h1>
            <p className="text-text-muted text-sm tracking-wide">
              Manage your profile and preferences
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-xl px-4 sm:px-6 py-8">
        {loading ? (
          <div className="py-16 flex justify-center">
            <div className="h-5 w-5 rounded-full border-2 border-white/20 border-t-white/70 animate-spin" />
          </div>
        ) : !profile ? (
          <div className="py-16 text-center space-y-4">
            <p className="text-sm text-text-muted">You must be signed in to access settings.</p>
            <Link href="/login" className="text-xs text-red hover:text-red/80 transition-colors">Sign in →</Link>
          </div>
        ) : (
          <div className="space-y-5">
            <SettingsForm
              initialUsername={profile.username}
              initialAvatarUrl={profile.avatar_url}
              email={profile.email ?? ""}
            />

            {/* Notifications card */}
            <div className="rounded-2xl p-5 space-y-4"
              style={{ background: "rgba(255,255,255,0.025)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.07)" }}>
              <h2 className="text-[10px] font-display uppercase tracking-[0.2em] text-text-muted">Notifications</h2>
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <p className="text-sm text-text">Match alerts</p>
                  <p className="text-[10px] text-text-dim">Get notified when matches go live or picks are scored</p>
                </div>
                <div className="flex items-center gap-2">
                  <PushButton userId={profile.id} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Settings Form ─────────────────────────────────────────────────────────────

function SettingsForm({
  initialUsername,
  initialAvatarUrl,
  email,
}: {
  initialUsername: string
  initialAvatarUrl: string | null
  email: string
}) {
  const router = useRouter()
  const [username,      setUsername]      = useState(initialUsername)
  const [avatarUrl,     setAvatarUrl]     = useState(initialAvatarUrl ?? "")
  const [preview,       setPreview]       = useState<string | null>(initialAvatarUrl)
  const [isPending,     startSave]        = useTransition()
  const [uploadPending, startUpload]      = useTransition()
  const [msg,  setMsg]   = useState<{ ok: boolean; text: string } | null>(null)
  const [drag, setDrag]  = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const flash = (ok: boolean, text: string) => {
    setMsg({ ok, text })
    setTimeout(() => setMsg(null), 3000)
  }

  const handleFile = (file: File) => {
    // Client-side validation before hitting the server
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (!allowed.includes(file.type)) {
      flash(false, "File type not supported. Use JPG, PNG, WebP or GIF.")
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      flash(false, `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max 2 MB.`)
      return
    }

    // Local preview immediately
    const reader = new FileReader()
    reader.onload = e => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)

    startUpload(async () => {
      const fd = new FormData()
      fd.append("avatar", file)
      const res = await uploadAvatar(fd)
      if (res.error) { flash(false, res.error); return }
      if (res.url)   { setAvatarUrl(res.url); setPreview(res.url); flash(true, "Avatar updated!") }
    })
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    startSave(async () => {
      const fd = new FormData()
      fd.append("username",   username)
      fd.append("avatar_url", avatarUrl)
      const res = await updateProfile(fd)
      if (res.error) { flash(false, res.error); return }
      flash(true, "Changes saved!")
      router.refresh()
    })
  }

  return (
    <form onSubmit={handleSave} className="space-y-5 animate-fade-up">

      {/* Avatar card */}
      <div className="rounded-2xl p-5 space-y-4"
        style={{ background: "rgba(255,255,255,0.025)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.07)" }}>
        <h2 className="text-[10px] font-display uppercase tracking-[0.2em] text-text-muted">Avatar</h2>

        <div className="flex items-center gap-4">
          {/* Click-to-upload preview */}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDrag(true) }}
            onDragLeave={() => setDrag(false)}
            onDrop={e => {
              e.preventDefault(); setDrag(false)
              const f = e.dataTransfer.files?.[0]
              if (f) handleFile(f)
            }}
            className={`group relative h-16 w-16 rounded-[18px] overflow-hidden shrink-0 border transition-all duration-300 ${
              drag ? "border-slc-teal/50 bg-slc-teal/10 scale-105" : "border-red/15 bg-red/8 hover:border-red/30"
            }`}
          >
            {preview ? (
              <Image src={preview} alt="Avatar" fill className="object-cover" sizes="64px" />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <User className="h-7 w-7 text-red/50" />
              </div>
            )}
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M4 16l4.586-4.586a2 2 0 0 1 2.828 0L16 16m-2-2 1.586-1.586a2 2 0 0 1 2.828 0L20 14m-6-6h.01M6 20h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z"/>
              </svg>
            </div>
            {/* Upload spinner */}
            {uploadPending && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
            )}
          </button>

          <div className="flex-1 space-y-1.5">
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploadPending}
              className="text-xs text-text-muted hover:text-text transition-colors disabled:opacity-50">
              {uploadPending ? "Uploading…" : "Upload photo"}
            </button>
            <p className="text-[10px] text-text-dim">JPG, PNG, WebP · Max 2 MB</p>
          </div>
        </div>

        {/* URL fallback */}
        <div className="space-y-1">
          <label className="text-[10px] text-text-dim uppercase tracking-[0.15em]">Or paste a URL</label>
          <input
            type="url"
            value={avatarUrl}
            onChange={e => { setAvatarUrl(e.target.value); setPreview(e.target.value || null) }}
            placeholder="https://..."
            className="w-full h-9 px-3 rounded-lg text-xs text-text bg-white/4 border border-white/8 focus:border-red/30 focus:outline-none placeholder:text-text-dim transition-colors"
          />
        </div>
      </div>

      {/* Username card */}
      <div className="rounded-2xl p-5 space-y-4"
        style={{ background: "rgba(255,255,255,0.025)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.07)" }}>
        <h2 className="text-[10px] font-display uppercase tracking-[0.2em] text-text-muted">Username</h2>
        <div className="space-y-1.5">
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            minLength={3}
            maxLength={20}
            required
            className="w-full h-10 px-3 rounded-lg text-sm text-text bg-white/4 border border-white/8 focus:border-red/30 focus:outline-none transition-colors"
          />
          <p className="text-[10px] text-text-dim">3–20 characters · Letters, numbers, underscores</p>
        </div>
      </div>

      {/* Email card (read-only) */}
      {email && (
        <div className="rounded-2xl p-5 space-y-3"
          style={{ background: "rgba(255,255,255,0.015)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.05)" }}>
          <h2 className="text-[10px] font-display uppercase tracking-[0.2em] text-text-dim">Email</h2>
          <p className="text-sm text-text-dim">{email}</p>
          <p className="text-[10px] text-text-dim">Managed by your sign-in provider · Cannot be changed</p>
        </div>
      )}

      {/* Feedback */}
      {msg && (
        <div className={`rounded-xl px-4 py-3 text-xs text-center border transition-all ${
          msg.ok ? "border-success/25 bg-success/6 text-success" : "border-danger/25 bg-danger/6 text-danger"
        }`}>
          {msg.text}
        </div>
      )}

      {/* Save button */}
      <button
        type="submit"
        disabled={isPending || uploadPending}
        className="w-full h-11 rounded-xl font-display font-bold text-sm uppercase tracking-wider transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] disabled:opacity-60"
        style={{
          background: "linear-gradient(135deg, rgba(245,200,66,0.95) 0%, rgba(245,180,40,1) 100%)",
          color: "#07080D",
          boxShadow: "0 0 0 1px rgba(245,200,66,0.4), 0 4px 20px rgba(245,200,66,0.2)",
        }}
      >
        {isPending ? "Saving…" : "Save changes"}
      </button>
    </form>
  )
}
