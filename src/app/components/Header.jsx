import { MessageSquareText, Sparkles } from 'lucide-react';
import GoogleTranslateWidget from './GoogleTranslateWidget';

export default function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-white/60 bg-transparent5 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--shell-ink)] text-white shadow-[0_20px_42px_-28px_rgba(15,23,42,0.9)]">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--chat-primary-strong)]">
              AI Meeting Notes
            </p>
            <h1 className="text-base font-semibold text-[var(--shell-ink)]">Chat-ready recap workspace</h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <GoogleTranslateWidget />
          <div className="hidden items-center gap-2 sm:flex">
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--shell-line)] bg-white/80 px-3 py-1.5 text-xs text-[var(--shell-soft)]">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Live workspace
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--shell-line)] bg-[var(--chat-primary-soft)] px-3 py-1.5 text-xs font-medium text-[var(--chat-primary-strong)]">
              <MessageSquareText className="h-3.5 w-3.5" />
              Summaries that read like a team thread
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
