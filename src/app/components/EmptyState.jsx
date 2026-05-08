import { ArrowRight, FileText } from 'lucide-react';

export default function EmptyState({ onTryExample }) {
  const exampleNotes = `Product Sync - Q2 Planning\n\n- Maya confirmed the mobile redesign should launch in June\n- Decided to move the web app to Next.js for the next release\n- Daniel will finalize the API contract by Thursday\n- Priya needs to share onboarding copy updates in the design channel\n- Team approved adding one more QA pass before launch\n- Follow-up review scheduled for next Tuesday at 3 PM`;

  return (
    <div className="rounded-[28px] border border-white/70 bg-[color:var(--surface-strong)] p-6 shadow-[0_24px_80px_-50px_rgba(15,23,42,0.65)] backdrop-blur-xl">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--chat-primary-soft)] text-[var(--chat-primary-strong)]">
        <FileText className="h-5 w-5" />
      </div>

      <div className="mt-4 space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--chat-primary-strong)]">
          Starter thread
        </p>
        <h2 className="text-2xl font-semibold tracking-tight text-[var(--shell-ink)]">
          Need a fast test run?
        </h2>
        <p className="text-sm leading-7 text-[var(--shell-copy)]">
          Load a realistic planning note and see how the app formats it into something that feels ready to post back to the team.
        </p>
      </div>

      <button
        type="button"
        onClick={() => onTryExample(exampleNotes)}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--shell-line)] bg-white px-4 py-3 text-sm font-semibold text-[var(--shell-ink)] transition-all hover:border-[var(--chat-primary)]/30 hover:bg-[var(--chat-primary-soft)]/60"
      >
        Load sample notes
        <ArrowRight className="h-4 w-4" />
      </button>

      <div className="mt-5 rounded-[24px] bg-slate-950 px-4 py-5 text-left shadow-[0_24px_50px_-28px_rgba(15,23,42,0.85)]">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-300/90">
          Sample input
        </div>
        <div className="mt-4 space-y-2 font-mono text-xs leading-6 text-slate-200/90 sm:text-[13px]">
          <p>Product Sync - Q2 Planning</p>
          <p>- Maya confirmed the mobile redesign should launch in June</p>
          <p>- Decided to move the web app to Next.js for the next release</p>
          <p>- Daniel will finalize the API contract by Thursday</p>
          <p>- Priya needs to share onboarding copy updates in the design channel</p>
          <p>- Team approved adding one more QA pass before launch</p>
          <p>- Follow-up review scheduled for next Tuesday at 3 PM</p>
        </div>
      </div>
    </div>
  );
}
