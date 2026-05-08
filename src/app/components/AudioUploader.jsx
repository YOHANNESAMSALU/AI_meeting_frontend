import { useEffect, useRef, useState } from 'react';
import { FileAudio, Loader2, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { formatFileSize, transcribeAudioFile } from './audioUtils';

export default function AudioUploader({ onTranscript }) {
  const [audioFile, setAudioFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const fileInputRef = useRef(null);
  const abortControllerRef = useRef(null);
  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!audioFile) {
      setPreviewUrl(null);
      return undefined;
    }

    const objectUrl = URL.createObjectURL(audioFile);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [audioFile]);

  function handleFileSelect(file) {
    if (!file.type.startsWith('audio/')) {
      const message = 'Please upload an audio file (MP3, WAV, M4A, and similar formats).';
      setErrorMessage(message);
      toast.error(message);
      return;
    }

    const maxSize = 50 * 1024 * 1024;

    if (file.size > maxSize) {
      const message = 'File size must be less than 50MB.';
      setErrorMessage(message);
      toast.error(message);
      return;
    }

    setErrorMessage('');
    setAudioFile(file);
    toast.success('Audio file uploaded successfully');
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0];

    if (file) {
      handleFileSelect(file);
    }
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];

    if (file) {
      handleFileSelect(file);
    }
  }

  function handleDragOver(event) {
    event.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(event) {
    event.preventDefault();
    setIsDragging(false);
  }

  function handleDelete() {
    if (isProcessing) {
      return;
    }

    setAudioFile(null);
    setErrorMessage('');

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  async function transcribeSelectedAudio() {
    if (!audioFile || isProcessing) {
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMessage('');

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const transcript = await transcribeAudioFile(audioFile, controller.signal);

      onTranscript(transcript);

      if (isMountedRef.current) {
        handleDelete();
      }
    } catch (error) {
      if (error?.name === 'AbortError') {
        return;
      }

      if (!isMountedRef.current) {
        return;
      }

      const message =
        error instanceof Error ? error.message : 'We could not transcribe this audio file. Please try again.';

      setErrorMessage(message);
      toast.error(message);
    } finally {
      abortControllerRef.current = null;

      if (isMountedRef.current) {
        setIsProcessing(false);
      }
    }
  }

  return (
    <div className="space-y-4">
      {!audioFile ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`rounded-[24px] border-2 border-dashed p-8 text-center transition-all ${
            isDragging
              ? 'border-[var(--chat-primary)] bg-[var(--chat-primary-soft)]/60'
              : 'border-[var(--shell-line)] bg-white/85 hover:border-[var(--chat-primary)]/35 hover:bg-white'
          }`}
        >
          <div className="mx-auto flex max-w-xl flex-col items-center gap-4">
            <div className={`flex h-16 w-16 items-center justify-center rounded-[22px] ${isDragging ? 'bg-white text-[var(--chat-primary)]' : 'bg-[var(--surface-muted)] text-[var(--shell-soft)]'}`}>
              <Upload className="h-7 w-7" />
            </div>
            <div>
              <p className="text-lg font-semibold text-[var(--shell-ink)]">Drop an audio file here</p>
              <p className="mt-2 text-sm leading-7 text-[var(--shell-copy)]">
                MP3, WAV, M4A, and other audio formats are supported. Keep files under 50MB for the smoothest upload.
              </p>
            </div>

            {errorMessage ? (
              <div className="w-full rounded-[20px] border border-red-200 bg-red-50 px-4 py-3 text-left text-sm leading-6 text-red-700">
                {errorMessage}
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[var(--shell-line)] bg-white px-5 py-3 text-sm font-semibold text-[var(--shell-ink)] transition-all hover:border-[var(--chat-primary)]/30 hover:bg-[var(--chat-primary-soft)]/50"
            >
              <Upload className="h-4 w-4" />
              Choose audio file
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>
      ) : (
        <div className="animate-in slide-in-from-bottom-4 fade-in space-y-4 duration-300">
          <div className="rounded-[24px] border border-[var(--shell-line)] bg-transparent p-4 shadow-[0_20px_40px_-28px_rgba(15,23,42,0.55)]">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--chat-primary-soft)] text-[var(--chat-primary-strong)]">
                  <FileAudio className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[var(--shell-ink)]">{audioFile.name}</p>
                  <p className="mt-1 text-xs text-[var(--shell-soft)]">{formatFileSize(audioFile.size)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isProcessing}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--shell-line)] bg-white text-[var(--shell-soft)] transition-colors hover:border-red-200 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-60"
                title="Remove file"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            {errorMessage ? (
              <div className="mt-4 rounded-[20px] border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
                {errorMessage}
              </div>
            ) : null}

            {isProcessing ? (
              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--shell-ink)]">
                <Loader2 className="h-4 w-4 animate-spin" />
                Transcribing audio...
              </div>
            ) : null}

            <div className="mt-4">{previewUrl ? <audio src={previewUrl} controls className="h-10 w-full" style={{ maxHeight: '40px' }} /> : null}</div>
          </div>

          <button
            type="button"
            onClick={transcribeSelectedAudio}
            disabled={isProcessing}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--chat-primary)] px-5 py-3 text-sm font-semibold text-white shadow-[0_20px_40px_-24px_rgba(15,118,110,0.7)] transition-all hover:bg-[var(--chat-primary-strong)] disabled:cursor-not-allowed disabled:bg-[color:rgba(15,118,110,0.38)]"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Transcribing audio...
              </>
            ) : (
              <>
                <Upload className="h-5 w-5" />
                Transcribe into notes
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
