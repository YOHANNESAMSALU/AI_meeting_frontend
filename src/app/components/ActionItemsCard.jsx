import { Check, Copy, ListTodo } from 'lucide-react';
import { useState } from 'react';

export default function ActionItemsCard({ actionItems }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const text = actionItems.map((item) => `${item.task} - Assignee: ${item.assignee}`).join('\n');
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-panel rounded-[30px] p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fff3e8] text-[#ea580c]">
            <ListTodo className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#c2410c]">Action items</p>
            <h3 className="mt-1 text-xl font-semibold text-[var(--shell-ink)]">Follow-up queue</h3>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="glass-pill inline-flex h-11 w-11 items-center justify-center rounded-2xl text-[var(--shell-soft)] transition-all hover:text-[#c2410c]"
          title="Copy to clipboard"
        >
          {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>

      <div className="mt-5 space-y-3">
        {actionItems.length ? (
          actionItems.map((item, index) => (
            <div key={index} className="glass-subcard flex items-start gap-3 rounded-2xl px-4 py-3">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 flex-shrink-0 cursor-pointer accent-[var(--chat-primary)]"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-7 text-[var(--shell-copy)]">{item.task}</p>
                <span className="glass-pill mt-2 inline-flex items-center rounded-full bg-[var(--chat-primary-soft)] px-3 py-1 text-xs font-medium text-[var(--chat-primary-strong)]">
                  {item.assignee}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="glass-subcard rounded-2xl px-4 py-3 text-sm leading-7 text-[var(--shell-soft)]">
            No action items were extracted automatically. You can still send the recap and refine assignments later.
          </div>
        )}
      </div>
    </div>
  );
}
