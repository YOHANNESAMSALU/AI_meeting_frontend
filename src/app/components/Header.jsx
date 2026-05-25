// Header.jsx
import { MessageSquareText, Sparkles, LogOut, User, Menu, PanelLeftClose } from 'lucide-react';
import GoogleTranslateWidget from './GoogleTranslateWidget';

export default function Header({ 
  user, 
  onLogout, 
  onShowAuth, 
  isHistoryOpen, 
  onToggleHistory 
}) {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--chat-primary)]/10 
                       bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(248,250,252,0.9))] 
                       backdrop-blur-2xl">
      <div className="mx-auto flex h-[72px] max-w-[1720px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleHistory}
            className="glass-pill inline-flex h-11 w-11 items-center justify-center rounded-2xl text-[var(--shell-ink)] transition-all hover:scale-[1.02] hover:bg-white"
            aria-label={isHistoryOpen ? 'Hide meeting history' : 'Show meeting history'}
          >
            {isHistoryOpen ? <PanelLeftClose className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--chat-primary)] to-[var(--chat-primary-strong)] text-white shadow-[0_20px_42px_-28px_rgba(124,58,237,0.4)]">
            <Sparkles className="h-5 w-5" />
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--chat-primary)]">
              AI Meeting Notes
            </p>
            <h1 className="text-base font-semibold text-[var(--shell-ink)]">Chat-ready recap workspace</h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden lg:block">
            <GoogleTranslateWidget />
          </div>

          {user ? (
            <div className="flex items-center gap-3">
              <div className="glass-pill hidden items-center gap-2 rounded-full px-3 py-2 text-sm text-[var(--shell-ink)] sm:flex">
                <User className="h-4 w-4" />
                <span>{user.full_name || user.email}</span>
              </div>
              <button
                onClick={onLogout}
                className="glass-pill inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold text-[var(--shell-soft)] transition-colors hover:text-[var(--chat-primary)] hover:bg-white"
              >
                <LogOut className="h-3.5 w-3.5" />
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={onShowAuth}
              className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-[var(--chat-primary)] to-[var(--chat-primary-strong)] px-4 py-2 text-xs font-semibold text-white shadow-[0_20px_42px_-28px_rgba(124,58,237,0.4)] transition-all hover:shadow-[0_20px_50px_-20px_rgba(124,58,237,0.5)]"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
}