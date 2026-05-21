import { Check, Copy, FileText } from 'lucide-react';
import { useState } from 'react';

export default function SummaryCard({ summary }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
function formatSummary(raw) {
  return (
    raw
      .replace(/\n/g, ' ')          // collapse all line breaks
      .replace(/• /g, ', ')         // replace bullet + space with comma+space
      .replace(/: ,/g, ': ')        // fix "Key Points: ," → "Key Points: "
      .replace(/, ,/g, ',')         // remove accidental double commas
      .replace(/,\s*$/, '')         // strip trailing comma
      .trim() + '.'                 // end with a period
  );
}
  return (
    <div className="glass-panel rounded-[30px] p-6 sm:p-7">
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
          className="glass-pill inline-flex h-11 w-11 items-center justify-center rounded-2xl text-[var(--shell-soft)] transition-all hover:text-[var(--chat-primary-strong)]"
          title="Copy to clipboard"
        >
          {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>

      <p className="glass-subcard mt-5 rounded-[24px] px-5 py-4 text-sm leading-8 text-[var(--shell-copy)] sm:text-base">
      {formatSummary(summary)}
      </p>
    </div>
  );
}
