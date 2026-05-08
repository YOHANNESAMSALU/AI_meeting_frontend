import { Loader2, Mic, Sparkles, Type, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import AudioSection from './AudioSection';

export default function InputSection({ notes, setNotes, onGenerate, isLoading, onAudioTranscript }) {
  const [inputMode, setInputMode] = useState('text');
  const [isTranscriptHighlighted, setIsTranscriptHighlighted] = useState(false);
  const [transcriptInsertCount, setTranscriptInsertCount] = useState(0);

  const textareaRef = useRef(null);
  const highlightTimeoutRef = useRef(null);

  const wordCount = notes.trim() ? notes.trim().split(/\s+/).length : 0;


  // Accepts either transcript string (old) or {transcript, summary} object (new)
  const handleAudioTranscript = (result) => {
    if (!result) return;
    if (typeof result === 'string') {
      setNotes(result);
      setInputMode('text');
      setTranscriptInsertCount((previousCount) => previousCount + 1);
      toast.success('Audio transcribed successfully. Your draft is ready to review.');
    } else if (typeof result === 'object' && result.transcript && result.summary) {
      setInputMode('text');
      setTranscriptInsertCount((previousCount) => previousCount + 1);
      if (onAudioTranscript) onAudioTranscript(result);
      toast.success('Audio transcribed and summarized!');
    }
  };

  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) {
        window.clearTimeout(highlightTimeoutRef.current);
        highlightTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!transcriptInsertCount || inputMode !== 'text') {
      return undefined;
    }

    const textarea = textareaRef.current;

    if (!textarea) {
      return undefined;
    }

    if (highlightTimeoutRef.current) {
      window.clearTimeout(highlightTimeoutRef.current);
    }

    setIsTranscriptHighlighted(true);
    textarea.focus();
    textarea.setSelectionRange(0, 0);
    textarea.scrollTop = 0;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    highlightTimeoutRef.current = window.setTimeout(() => {
      setIsTranscriptHighlighted(false);
      highlightTimeoutRef.current = null;
    }, 1800);

    return () => {
      if (highlightTimeoutRef.current) {
        window.clearTimeout(highlightTimeoutRef.current);
        highlightTimeoutRef.current = null;
      }
    };
  }, [inputMode, transcriptInsertCount]);

  const modeButtonClasses = (mode) => {
    const isActive = inputMode === mode;

    return [
      'inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition-all',
      isActive
        ? 'bg-[var(--shell-ink)] text-white shadow-[0_18px_36px_-24px_rgba(15,23,42,0.85)]'
        : 'text-[var(--shell-soft)] hover:bg-white hover:text-[var(--shell-ink)]',
    ].join(' ');
  };

  return (
    <div className="rounded-[32px] border border-white/70 bg-[color:var(--surface-strong)] p-4 shadow-[0_28px_90px_-54px_rgba(15,23,42,0.72)] backdrop-blur-xl sm:p-6">
      <div className="flex flex-col gap-4 border-b border-[var(--shell-line)] pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--chat-primary-strong)]">
            Composer
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--shell-ink)] sm:text-[2rem]">
            Draft the recap the way you would send it in a team chat.
          </h2>
          <p className="mt-3 text-sm leading-7 text-[var(--shell-copy)]">
            Keep the messy raw input here. We will shape it into a clean summary, decisions list, and action items.
          </p>
        </div>

        <div className="inline-flex rounded-[20px] bg-white/80 p-1 ring-1 ring-inset ring-[var(--shell-line)]">
          <button
            type="button"
            onClick={() => setInputMode('text')}
            className={modeButtonClasses('text')}
          >
            <Type className="h-4 w-4" />
            Text Notes
          </button>
          <button
            type="button"
            onClick={() => setInputMode('audio')}
            className={modeButtonClasses('audio')}
          >
            <Mic className="h-4 w-4" />
            Audio Capture
          </button>
        </div>
      </div>

      {inputMode === 'text' ? (
        <div className="mt-6 rounded-[28px] border border-[var(--shell-line)] bg-transparent p-4 shadow-inner shadow-white/70 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-[var(--shell-ink)]">Meeting transcript</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--surface-muted)] px-2.5 py-1 text-xs text-[var(--shell-soft)]">
                  <Type className="h-3.5 w-3.5" />
                  {wordCount} words
                </span>
              </div>
              <p className="mt-1 text-xs text-[var(--shell-soft)]">
                Paste rough notes, bullets, or a full meeting transcript.
              </p>
            </div>

            {notes && !isLoading ? (
              <button
                type="button"
                onClick={() => setNotes('')}
                className="inline-flex items-center gap-2 self-start rounded-2xl border border-[var(--shell-line)] bg-white px-3 py-2 text-sm text-[var(--shell-soft)] transition-colors hover:border-[var(--chat-primary)]/30 hover:text-[var(--shell-ink)] sm:self-auto"
              >
                <X className="h-4 w-4" />
                Clear draft
              </button>
            ) : null}
          </div>

          <textarea
            id="meeting-notes"
            ref={textareaRef}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder={`Paste your meeting notes here...

                      Example:
                      Team standup - April 22
                      - Reviewed the sprint backlog
                      - Sarah will lead the new reporting flow
                      - Need to finalize design comments by Friday
                      - Agreed to switch the web app to Next.js`}
            className={`mt-4 min-h-[280px] w-full resize-none rounded-[24px] border border-transparent px-4 py-4 text-sm leading-7 text-[var(--shell-ink)] outline-none transition-all placeholder:text-[color:rgba(71,85,105,0.75)] focus:border-[var(--chat-primary)]/25 focus:bg-white focus:ring-4 focus:ring-[var(--chat-primary-ring)] sm:text-base ${
              isTranscriptHighlighted
                ? 'border-[var(--chat-primary)]/25 bg-white ring-4 ring-[var(--chat-primary-ring)]'
                : 'bg-[var(--surface-muted)]'
            }`}
            disabled={isLoading}
          />

          <div className="mt-4 flex flex-col gap-4 border-t border-[var(--shell-line)] pt-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-[var(--shell-ink)]">Write once, share everywhere</p>
              <p className="text-xs leading-6 text-[var(--shell-soft)]">
                Use Cmd/Ctrl + Enter to run the recap without leaving the composer.
              </p>
            </div>

            <button
              type="button"
              onClick={onGenerate}
              disabled={isLoading || !notes.trim()}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--chat-primary)] px-5 py-3 text-sm font-semibold text-white shadow-[0_22px_44px_-24px_rgba(15,118,110,0.7)] transition-all hover:bg-[var(--chat-primary-strong)] disabled:cursor-not-allowed disabled:bg-[color:rgba(15,118,110,0.38)] sm:min-w-[220px] sm:text-base"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Generating recap...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Generate recap
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-[28px] border border-[var(--shell-line)] bg-transparent p-4 shadow-inner shadow-white/70 sm:p-5">
          <AudioSection onTranscript={handleAudioTranscript} />
        </div>
      )}
    </div>
  );
}
