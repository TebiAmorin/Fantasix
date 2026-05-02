"use client"

import { useState, useCallback } from "react"

interface ShareButtonProps {
  username: string
  isOwn: boolean
}

export function ShareButton({ username, isOwn }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleShare = useCallback(async () => {
    const url  = window.location.href
    const title = isOwn ? "My Picks on Fantasix" : `${username}'s Picks on Fantasix`
    const text  = `Check out ${isOwn ? "my" : `${username}'s`} Pick'Em predictions for the BLAST R6 Major SLC 2026`

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, text, url })
        return
      } catch {
        // User cancelled or share failed — fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    } catch {
      // Clipboard blocked — nothing to do
    }
  }, [username, isOwn])

  return (
    <button
      onClick={handleShare}
      className={`
        flex items-center gap-1.5 text-xs rounded-lg px-3 py-1.5 border transition-all duration-300
        ${copied
          ? "text-success border-success/25 bg-success/6"
          : "text-text-muted hover:text-text border-white/8 hover:border-white/18 bg-transparent"
        }
      `}
    >
      {copied ? (
        <>
          <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M20 6 9 17l-5-5" />
          </svg>
          Link copied!
        </>
      ) : (
        <>
          <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
          {isOwn ? "Share my picks" : `Share ${username}'s picks`}
        </>
      )}
    </button>
  )
}
