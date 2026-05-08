import { History, RotateCcw } from 'lucide-react';

function formatDateTime(value) {
  try {
    return new Date(value).toLocaleString();
  } catch (error) {
    return 'Unknown date';
  }
}

export default function MeetingHistory({ items, onSelect, onClear }) {
  return (
    <div className="rounded-[28px] border border-white/70 bg-[color:var(--surface-strong)] p-6 shadow-[0_28px_90px_-58px_rgba(15,23,42,0.7)] backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
            <History className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-600">Meeting history</p>
            <h3 className="mt-1 text-xl font-semibold text-[var(--shell-ink)]">Recent recaps</h3>
          </div>
        </div>
        {items.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1 rounded-lg border border-[var(--shell-line)] bg-white px-2.5 py-1.5 text-xs font-semibold text-[var(--shell-soft)]"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Clear
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="mt-5 rounded-2xl border border-dashed border-[var(--shell-line)] bg-white/60 px-4 py-5 text-sm text-[var(--shell-soft)]">
          No history yet. Generate a recap to save it here.
        </p>
      ) : (
        <div className="mt-5 space-y-3">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item)}
              className="w-full rounded-2xl border border-[var(--shell-line)] bg-white/80 px-4 py-3 text-left transition-all hover:border-[var(--chat-primary)]/30"
            >
              <p className="text-xs text-[var(--shell-soft)]">{formatDateTime(item.createdAt)}</p>
              <p className="mt-1 text-sm font-medium text-[var(--shell-ink)]">
                {String(item.summary || '').slice(0, 120)}
                {String(item.summary || '').length > 120 ? '...' : ''}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
