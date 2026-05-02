export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="relative overflow-hidden bg-void">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 pt-10 pb-12 space-y-4">
          <div className="h-4 w-40 rounded-full bg-white/6" />
          <div className="h-14 w-56 rounded-xl bg-white/6" />
          <div className="flex gap-4">
            {[60, 80, 64].map((w, i) => <div key={i} className="h-8 rounded-lg bg-white/4" style={{ width: w }} />)}
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {[6, 4, 3].map((rows, gi) => (
          <div key={gi} className="space-y-3">
            <div className="h-4 w-28 rounded bg-white/6" />
            <div className="rounded-2xl overflow-hidden divide-y divide-white/5" style={{ background: "rgba(255,255,255,0.025)" }}>
              {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="h-16 bg-transparent" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
