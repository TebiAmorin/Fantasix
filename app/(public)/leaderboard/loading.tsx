export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="relative overflow-hidden bg-void">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-10 pb-12 space-y-4">
          <div className="h-4 w-48 rounded-full bg-white/6" />
          <div className="h-14 w-64 rounded-xl bg-white/6" />
        </div>
      </div>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 space-y-3">
        <div className="h-10 w-full rounded-xl bg-white/4" />
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-14 rounded-xl bg-white/4" style={{ opacity: 1 - i * 0.07 }} />
        ))}
      </div>
    </div>
  )
}
