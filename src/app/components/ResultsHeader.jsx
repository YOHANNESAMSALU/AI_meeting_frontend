import { CheckCircle2, FileDown, ListTodo, Loader2, Mail, RotateCcw } from 'lucide-react';

export default function ResultsHeader({
  onReset,
  onExportPdf,
  onEmailSummary,
  attendees,
  setAttendees,
  attachPdfToEmail,
  setAttachPdfToEmail,
  results,
  canShareMeeting,
  isSendingEmail,
  isExportingPdf,
}) {
  return (
    <div className="glass-panel rounded-[30px] p-6 sm:p-7">
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--chat-primary-strong)]">
        Ready to share
      </p>

      <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--shell-ink)]">
            Your recap is live.
          </h2>
          <p className="mt-3 text-sm leading-7 text-[var(--shell-copy)]">
            Share it straight from the workspace. PDF export and attendee email use the saved meeting .
          </p>
        </div>

        <div
          className={`glass-pill inline-flex items-center gap-2 self-start rounded-full px-3 py-2 text-xs font-semibold ${
            canShareMeeting ? 'text-emerald-700' : 'text-amber-700'
          }`}
        >
          <span className={`h-2.5 w-2.5 rounded-full ${canShareMeeting ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          {canShareMeeting ? 'Saved and share-ready' : 'Generate while signed in to share'}
        </div>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      

        <button
          type="button"
          onClick={onExportPdf}
          disabled={!canShareMeeting || isExportingPdf}
          className="glass-subcard inline-flex min-h-[92px] flex-col items-start justify-between rounded-2xl px-4 py-3 text-left transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-55"
        >
          <div className="flex items-center gap-2 text-[var(--shell-ink)]">
            {isExportingPdf ? (
              <Loader2 className="h-4 w-4 animate-spin text-[var(--chat-primary-strong)]" />
            ) : (
              <FileDown className="h-4 w-4 text-[var(--chat-primary-strong)]" />
            )}
            <span className="text-sm font-semibold">Export PDF</span>
          </div>
          <p className="text-xs leading-5 text-[var(--shell-soft)]">
            {canShareMeeting ? 'Download PDF.' : 'Available after a signed-in saved recap.'}
          </p>
        </button>

        <button
          type="button"
          onClick={onReset}
          className="glass-subcard inline-flex min-h-[92px] flex-col items-start justify-between rounded-2xl px-4 py-3 text-left transition-all hover:-translate-y-0.5"
        >
          <div className="flex items-center gap-2 text-[var(--shell-ink)]">
            <RotateCcw className="h-4 w-4 text-[var(--shell-soft)]" />
            <span className="text-sm font-semibold">Start a new note</span>
          </div>
          <p className="text-xs leading-5 text-[var(--shell-soft)]">
            Reset the workspace and draft another meeting recap.
          </p>
        </button>
      </div>

      <div className="glass-subcard mt-5 rounded-[26px] p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <div className="min-w-0 flex-1">
            <label className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--shell-soft)]" htmlFor="attendee-emails">
              Send recap to attendees
            </label>
            <input
              id="attendee-emails"
              type="text"
              value={attendees}
              onChange={(event) => setAttendees(event.target.value)}
              placeholder="sara@company.com, john@company.com"
              className="glass-input mt-3 w-full rounded-2xl px-4 py-3 text-sm text-[var(--shell-ink)] outline-none transition-all focus:border-[var(--chat-primary)]/40"
            />
          </div>

          {/* <label className="glass-pill inline-flex items-center gap-3 self-start rounded-2xl px-4 py-3 text-sm text-[var(--shell-ink)]">
            <input
              type="checkbox"
              checked={attachPdfToEmail}
              onChange={(event) => setAttachPdfToEmail(event.target.checked)}
              className="h-4 w-4 accent-[var(--chat-primary)]"
            />
            Attach PDF copy
          </label> */}

          <button
            type="button"
            onClick={onEmailSummary}
            disabled={!canShareMeeting || isSendingEmail}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--chat-primary)] px-5 py-3 text-sm font-semibold text-white shadow-[0_20px_42px_-26px_rgba(15,118,110,0.76)] transition-all hover:bg-[var(--chat-primary-strong)] disabled:cursor-not-allowed disabled:opacity-55"
          >
            {isSendingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
            {isSendingEmail ? 'Sending recap...' : 'Email attendees'}
          </button>
        </div>

        <p className="mt-3 text-xs leading-6 text-[var(--shell-soft)]">
          The system sends the meeting note and optionally attaches the generated PDF to every valid email address you enter.
        </p>
      </div>
    </div>
  );
}
