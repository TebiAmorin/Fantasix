"use client"

import { useFormStatus } from "react-dom"
import { Loader2 } from "lucide-react"

interface AdminSubmitProps {
  label?: string
  className?: string
}

export function AdminSubmit({ label = "Save", className }: AdminSubmitProps) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg bg-gold text-void text-sm font-medium hover:bg-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className ?? ""}`}
    >
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {pending ? "Saving..." : label}
    </button>
  )
}
