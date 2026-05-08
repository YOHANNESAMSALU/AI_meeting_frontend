import { CheckCircle2, FileDown, ListTodo, Mail, RotateCcw } from 'lucide-react';

export default function ResultsHeader({
  onReset,
  onExportPdf,
  onEmailSummary,
  attendees,
  setAttendees,
  results,
}) {
  return (
    <div className="rounded-[28px] border border-white/70 bg-[color:var(--surface-strong)] p-6 shadow-[0_24px_80px_-50px_rgba(15,23,42,0.65)] backdrop-blur-xl">
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--chat-primary-strong)]">
        Ready to share
      </p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--shell-ink)]">
        Your recap is live.
      </h2>
      <p className="mt-3 text-sm leading-7 text-[var(--shell-copy)]">
        Review the summary cards below, then copy the parts you want into your team chat, project update, or follow-up email.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-[var(--shell-line)] bg-white/80 px-4 py-3">
          <p className="text-xs text-[var(--shell-soft)]">Decisions captured</p>
          <div className="mt-2 flex items-center gap-2 text-[var(--shell-ink)]">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span className="text-lg font-semibold">{results.decisions.length}</span>
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--shell-line)] bg-white/80 px-4 py-3">
          <p className="text-xs text-[var(--shell-soft)]">Action items assigned</p>
          <div className="mt-2 flex items-center gap-2 text-[var(--shell-ink)]">
            <ListTodo className="h-4 w-4 text-[var(--chat-primary-strong)]" />
            <span className="text-lg font-semibold">{results.actionItems.length}</span>
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <button
          type="button"
          onClick={onExportPdf}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--shell-line)] bg-white px-4 py-3 text-sm font-semibold text-[var(--shell-ink)] transition-all hover:border-[var(--chat-primary)]/30 hover:bg-[var(--chat-primary-soft)]/60"
        >
          <FileDown className="h-4 w-4" />
          Export as PDF
        </button>

        <div className="rounded-2xl border border-[var(--shell-line)] bg-white/80 p-3">
          <label className="text-xs text-[var(--shell-soft)]" htmlFor="attendee-emails">
            Attendee emails (comma separated)
          </label>
          <input
            id="attendee-emails"
            type="text"
            value={attendees}
            onChange={(event) => setAttendees(event.target.value)}
            placeholder="sara@company.com, john@company.com"
            className="mt-2 w-full rounded-xl border border-[var(--shell-line)] bg-white px-3 py-2 text-sm text-[var(--shell-ink)] outline-none transition-all focus:border-[var(--chat-primary)]/40"
          />
          <button
            type="button"
            onClick={onEmailSummary}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--shell-line)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--shell-ink)] transition-all hover:border-[var(--chat-primary)]/30 hover:bg-[var(--chat-primary-soft)]/60"
          >
            <Mail className="h-4 w-4" />
            Email summary
          </button>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--shell-line)] bg-white px-4 py-3 text-sm font-semibold text-[var(--shell-ink)] transition-all hover:border-[var(--chat-primary)]/30 hover:bg-[var(--chat-primary-soft)]/60"
        >
          <RotateCcw className="h-4 w-4" />
          Start a new note
        </button>
      </div>
    </div>
  );
}
