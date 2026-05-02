export default function Loading() {
  return (
    <div className="animate-pulse">
      {/* Hero skeleton */}
      <div className="relative overflow-hidden bg-void">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 pt-10 pb-12 space-y-4">
          <div className="h-4 w-32 rounded-full bg-white/6" />
          <div className="h-14 w-72 rounded-xl bg-white/6" />
          <div className="flex gap-4 pt-2">
            {[80, 96, 72].map((w, i) => (
              <div key={i} className="h-10 rounded-xl bg-white/4" style={{ width: w }} />
            ))}
          </div>
        </div>
      </div>

      {/* Cards skeleton */}
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-white/4" />
        ))}
      </div>
    </div>
  )
}
