export default function LoadingSkeleton() {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
      <div className="rounded-[28px] border border-white/70 bg-[color:var(--surface-strong)] p-6 shadow-[0_28px_90px_-58px_rgba(15,23,42,0.7)] backdrop-blur-xl animate-pulse">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-slate-200/80" />
            <div className="space-y-2">
              <div className="h-3 w-20 rounded-full bg-slate-200/80" />
              <div className="h-6 w-40 rounded-full bg-slate-200/80" />
            </div>
          </div>
          <div className="h-11 w-11 rounded-2xl bg-slate-200/80" />
        </div>
        <div className="mt-6 space-y-3">
          <div className="h-4 w-full rounded-full bg-slate-200/80" />
          <div className="h-4 w-11/12 rounded-full bg-slate-200/80" />
          <div className="h-4 w-4/5 rounded-full bg-slate-200/80" />
          <div className="h-4 w-3/5 rounded-full bg-slate-200/80" />
        </div>
      </div>

      <div className="space-y-6">
        {[1, 2].map((item) => (
          <div key={item} className="rounded-[28px] border border-white/70 bg-[color:var(--surface-strong)] p-6 shadow-[0_28px_90px_-58px_rgba(15,23,42,0.7)] backdrop-blur-xl animate-pulse">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-slate-200/80" />
                <div className="space-y-2">
                  <div className="h-3 w-20 rounded-full bg-slate-200/80" />
                  <div className="h-6 w-32 rounded-full bg-slate-200/80" />
                </div>
              </div>
              <div className="h-11 w-11 rounded-2xl bg-slate-200/80" />
            </div>
            <div className="mt-6 space-y-3">
              <div className="h-14 w-full rounded-2xl bg-slate-200/80" />
              <div className="h-14 w-full rounded-2xl bg-slate-200/80" />
              <div className="h-14 w-5/6 rounded-2xl bg-slate-200/80" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
