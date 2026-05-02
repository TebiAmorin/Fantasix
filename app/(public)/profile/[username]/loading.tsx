export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="relative overflow-hidden bg-void">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-10 pb-12">
          <div className="flex items-center gap-6">
            <div className="h-20 w-20 rounded-[20px] bg-white/8" />
            <div className="space-y-2">
              <div className="h-12 w-48 rounded-xl bg-white/8" />
              <div className="h-3 w-32 rounded bg-white/4" />
            </div>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 rounded-xl bg-white/4" />)}
        </div>
        <div className="h-40 rounded-2xl bg-white/4" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 rounded-xl bg-white/4" />)}
        </div>
      </div>
    </div>
  )
}
