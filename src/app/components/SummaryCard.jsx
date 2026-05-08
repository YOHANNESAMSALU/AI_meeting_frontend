import { Check, Copy, FileText } from 'lucide-react';
import { useState } from 'react';

export default function SummaryCard({ summary }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-[28px] border border-white/70 bg-[color:var(--surface-strong)] p-6 shadow-[0_28px_90px_-58px_rgba(15,23,42,0.7)] backdrop-blur-xl sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--chat-primary-soft)] text-[var(--chat-primary-strong)]">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--chat-primary-strong)]">Summary</p>
            <h3 className="mt-1 text-xl font-semibold text-[var(--shell-ink)]">Team-ready recap</h3>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--shell-line)] bg-white/85 text-[var(--shell-soft)] transition-all hover:border-[var(--chat-primary)]/30 hover:text-[var(--chat-primary-strong)]"
          title="Copy to clipboard"
        >
          {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>

      <p className="mt-5 text-sm leading-8 text-[var(--shell-copy)] sm:text-base">{summary}</p>
    </div>
  );
}
