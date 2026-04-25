"use client"

import { useState, useTransition } from "react"
import { Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface DeleteButtonProps {
  id: string
  action: (id: string) => Promise<{ success?: boolean; error?: string }>
  label?: string
}

export function DeleteButton({ id, action, label = "item" }: DeleteButtonProps) {
  const [confirm, setConfirm] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    startTransition(async () => {
      const result = await action(id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`${label} deleted`)
      }
      setConfirm(false)
    })
  }

  if (confirm) {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="px-2 py-1 rounded text-xs bg-danger/20 border border-danger/40 text-danger hover:bg-danger/30 transition-colors disabled:opacity-50"
        >
          {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Yes"}
        </button>
        <button
          onClick={() => setConfirm(false)}
          className="px-2 py-1 rounded text-xs bg-white/5 border border-white/10 text-text-muted hover:text-text transition-colors"
        >
          No
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      className="p-1.5 rounded-md text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
      title={`Delete ${label}`}
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  )
}
