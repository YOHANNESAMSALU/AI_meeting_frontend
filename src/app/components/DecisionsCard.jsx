import { Check, CheckCircle2, Copy } from 'lucide-react';
import { useState } from 'react';

export default function DecisionsCard({ decisions }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(decisions.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-[28px] border border-white/70 bg-[color:var(--surface-strong)] p-6 shadow-[0_28px_90px_-58px_rgba(15,23,42,0.7)] backdrop-blur-xl">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-700">Decisions</p>
            <h3 className="mt-1 text-xl font-semibold text-[var(--shell-ink)]">Confirmed calls</h3>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--shell-line)] bg-white/85 text-[var(--shell-soft)] transition-all hover:border-emerald-300 hover:text-emerald-700"
          title="Copy to clipboard"
        >
          {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>

      <ul className="mt-5 space-y-3">
        {decisions.map((decision, index) => (
          <li key={index} className="flex items-start gap-3 rounded-2xl border border-[var(--shell-line)] bg-white/80 px-4 py-3">
            <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-emerald-500" />
            <span className="text-sm leading-7 text-[var(--shell-copy)]">{decision}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
