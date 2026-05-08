import { Lightbulb } from 'lucide-react';

export default function AudioTips() {
  return (
    <div className="rounded-[24px] border border-[var(--shell-line)] bg-[linear-gradient(135deg,rgba(216,251,244,0.72),rgba(255,247,237,0.88))] p-4 shadow-[0_18px_36px_-26px_rgba(15,23,42,0.45)]">
      <div className="flex gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-white text-[var(--chat-primary-strong)]">
          <Lightbulb className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[var(--shell-ink)]">Tips for cleaner transcription</h3>
          <ul className="mt-2 space-y-1 text-xs leading-6 text-[var(--shell-copy)]">
            <li>Speak clearly and keep one voice at a time when possible.</li>
            <li>Reduce background noise before you start the recording.</li>
            <li>Say names and deadlines out loud so action items stay accurate.</li>
            <li>Best supported formats: MP3, WAV, M4A, and WebM.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
