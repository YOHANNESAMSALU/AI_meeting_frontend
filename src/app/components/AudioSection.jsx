import { Mic, Upload } from 'lucide-react';
import { useState } from 'react';
import AudioRecorder from './AudioRecorder';
import AudioUploader from './AudioUploader';
import AudioTips from './AudioTips';

export default function AudioSection({ onTranscript }) {
  const [activeTab, setActiveTab] = useState('record');

  const tabButtonClasses = (tab) => {
    const isActive = activeTab === tab;

    return [
      'inline-flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition-all',
      isActive
        ? 'bg-white text-[var(--shell-ink)] shadow-[0_18px_36px_-26px_rgba(15,23,42,0.65)]'
        : 'text-[var(--shell-soft)] hover:text-[var(--shell-ink)]',
    ].join(' ');
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-[var(--shell-ink)]">
          Capture the meeting like a voice note.
        </h2>
        <p className="mt-2 text-sm leading-7 text-[var(--shell-copy)]">
          Record a fresh clip or upload an audio file. Once it is transcribed, it drops back into the text composer automatically.
        </p>
      </div>

      <div className="inline-flex w-full rounded-[20px] bg-[var(--surface-muted)] p-1 ring-1 ring-inset ring-[var(--shell-line)]">
        <button type="button" onClick={() => setActiveTab('record')} className={tabButtonClasses('record')}>
          <Mic className="h-4 w-4" />
          Record audio
        </button>
        <button type="button" onClick={() => setActiveTab('upload')} className={tabButtonClasses('upload')}>
          <Upload className="h-4 w-4" />
          Upload file
        </button>
      </div>

      <div className="rounded-[24px] border border-[var(--shell-line)] bg-[var(--surface-muted)] p-4 sm:p-5">
        {activeTab === 'record' ? (
          <AudioRecorder onTranscript={onTranscript} />
        ) : (
          <AudioUploader onTranscript={onTranscript} />
        )}
      </div>

      <AudioTips />
    </div>
  );
}
