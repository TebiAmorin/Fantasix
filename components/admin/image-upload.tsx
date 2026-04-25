"use client"

import { useState, useRef, useCallback } from "react"
import Image from "next/image"
import { Upload, X, Loader2, ImageIcon } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

interface ImageUploadProps {
  bucket: "team-logos" | "player-avatars" | "tournament-logos"
  currentUrl?: string | null
  onUpload: (url: string) => void
  /** Hidden input name to include in parent form */
  inputName: string
  label?: string
  className?: string
}

export function ImageUpload({
  bucket,
  currentUrl,
  onUpload,
  inputName,
  label = "Image",
  className,
}: ImageUploadProps) {
  const [url, setUrl] = useState(currentUrl ?? "")
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const upload = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        setError("Only image files are allowed")
        return
      }
      if (file.size > 2 * 1024 * 1024) {
        setError("Max file size is 2MB")
        return
      }

      setError(null)
      setUploading(true)

      try {
        const supabase = createClient()
        const ext = file.name.split(".").pop()
        const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

        const { error: uploadErr } = await supabase.storage
          .from(bucket)
          .upload(path, file, { upsert: true })

        if (uploadErr) throw uploadErr

        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(path)

        setUrl(publicUrl)
        onUpload(publicUrl)
      } catch (err) {
        setError((err as Error).message ?? "Upload failed")
      } finally {
        setUploading(false)
      }
    },
    [bucket, onUpload]
  )

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) upload(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) upload(file)
  }

  const clear = () => {
    setUrl("")
    onUpload("")
    if (inputRef.current) inputRef.current.value = ""
  }

  return (
    <div className={cn("space-y-2", className)}>
      <label className="text-xs text-text-muted font-medium uppercase tracking-wider">
        {label}
      </label>

      {/* Hidden input for form submission */}
      <input type="hidden" name={inputName} value={url} />

      {url ? (
        /* Preview */
        <div className="relative group w-full h-32 rounded-lg overflow-hidden border border-white/10 bg-surface">
          <Image
            src={url}
            alt="Preview"
            fill
            className="object-contain p-2"
            sizes="200px"
           
          />
          <button
            type="button"
            onClick={clear}
            className="absolute top-2 right-2 p-1 rounded-md bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-danger/80"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <div className="absolute bottom-2 left-2 text-[10px] text-white/60 opacity-0 group-hover:opacity-100 transition-opacity">
            Click × to remove
          </div>
        </div>
      ) : (
        /* Drop zone */
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "w-full h-32 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors",
            dragOver
              ? "border-gold/60 bg-gold/5"
              : "border-white/15 hover:border-white/30 hover:bg-white/3"
          )}
        >
          {uploading ? (
            <>
              <Loader2 className="h-6 w-6 text-purple animate-spin" />
              <p className="text-xs text-text-muted">Uploading...</p>
            </>
          ) : (
            <>
              {dragOver ? (
                <Upload className="h-6 w-6 text-gold" />
              ) : (
                <ImageIcon className="h-6 w-6 text-text-muted" />
              )}
              <p className="text-xs text-text-muted text-center px-4">
                Drop image or <span className="text-purple">click to browse</span>
                <br />
                <span className="text-[10px] opacity-60">JPG, PNG, WebP · max 2MB</span>
              </p>
            </>
          )}
        </div>
      )}

      {error && (
        <p className="text-xs text-danger">{error}</p>
      )}

      {/* Also accept URL paste */}
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/svg+xml"
          onChange={handleFile}
          className="hidden"
        />
        <input
          type="text"
          value={url}
          onChange={(e) => { setUrl(e.target.value); onUpload(e.target.value) }}
          placeholder="Or paste image URL..."
          className="flex-1 h-8 px-3 rounded-md border border-white/8 bg-white/3 text-xs text-text placeholder:text-text-muted focus:outline-none focus:border-purple/50"
        />
      </div>
    </div>
  )
}
