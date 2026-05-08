import { useEffect, useRef, useState } from 'react';
import { Loader2, Mic, Pause, Play, Square, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import AudioWaveform from './AudioWaveform';
import {
  MAX_RECORDING_SECONDS,
  createAudioFileFromBlob,
  formatFileSize,
  formatTime,
  getMicrophoneErrorMessage,
  getSupportedAudioMimeType,
  revokeObjectUrl,
  stopMediaStream,
  transcribeAudioFile,
} from './audioUtils';

export default function AudioRecorder({ onTranscript }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioUrlRef = useRef(null);
  const abortControllerRef = useRef(null);
  const isMountedRef = useRef(false);

  function clearTimer() {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function stopStream() {
    stopMediaStream(streamRef.current);
    streamRef.current = null;
  }

  function updateAudioPreview(blob) {
    const nextAudioUrl = URL.createObjectURL(blob);

    revokeObjectUrl(audioUrlRef.current);
    audioUrlRef.current = nextAudioUrl;

    setAudioBlob(blob);
    setAudioUrl(nextAudioUrl);
  }

  function clearSavedRecording() {
    chunksRef.current = [];
    revokeObjectUrl(audioUrlRef.current);
    audioUrlRef.current = null;
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
  }

  function resetRecorderState() {
    clearTimer();
    setIsRecording(false);
    setIsPaused(false);
    clearSavedRecording();
  }

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      abortControllerRef.current?.abort();
      clearTimer();

      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }

      mediaRecorderRef.current = null;
      stopStream();
      revokeObjectUrl(audioUrlRef.current);
      audioUrlRef.current = null;
      chunksRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (!isRecording || isPaused) {
      clearTimer();
      return undefined;
    }

    timerRef.current = window.setInterval(() => {
      setRecordingTime((previousTime) => Math.min(previousTime + 1, MAX_RECORDING_SECONDS));
    }, 1000);

    return clearTimer;
  }, [isPaused, isRecording]);

  useEffect(() => {
    if (isRecording && !isPaused && recordingTime >= MAX_RECORDING_SECONDS) {
      stopRecording({ notifyMaxDuration: true });
    }
  }, [isPaused, isRecording, recordingTime]);

  async function startRecording() {
    if (isRecording || isProcessing) {
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      const unsupportedMessage =
        'This browser does not support in-browser audio recording. Try a recent version of Chrome, Edge, or Safari.';

      setErrorMessage(unsupportedMessage);
      toast.error(unsupportedMessage);
      return;
    }

    try {
      setErrorMessage('');
      clearSavedRecording();
      stopStream();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      if (!isMountedRef.current) {
        stopMediaStream(stream);
        return;
      }

      const preferredMimeType = getSupportedAudioMimeType();
      const mediaRecorder = preferredMimeType
        ? new MediaRecorder(stream, { mimeType: preferredMimeType })
        : new MediaRecorder(stream);

      streamRef.current = stream;
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data?.size) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onerror = () => {
        const recordingErrorMessage =
          'Recording stopped because the microphone encountered an unexpected error. Please try again.';

        clearTimer();
        mediaRecorderRef.current = null;
        stopStream();

        if (isMountedRef.current) {
          setErrorMessage(recordingErrorMessage);
          toast.error(recordingErrorMessage);
          setIsRecording(false);
          setIsPaused(false);
        }
      };

      mediaRecorder.onstop = () => {
        clearTimer();

        const hasRecordedAudio = chunksRef.current.some((chunk) => chunk.size > 0);
        const finalMimeType = mediaRecorder.mimeType || preferredMimeType || 'audio/webm';

        if (hasRecordedAudio) {
          const blob = new Blob(chunksRef.current, { type: finalMimeType });

          if (isMountedRef.current) {
            updateAudioPreview(blob);
            toast.success('Recording saved');
          }
        } else {
          if (isMountedRef.current) {
            clearSavedRecording();
            setErrorMessage('No audio was captured. Please try recording again.');
            toast.error('No audio was captured. Please try recording again.');
          }
        }

        chunksRef.current = [];
        mediaRecorderRef.current = null;
        stopStream();
      };

      mediaRecorder.start();
      setRecordingTime(0);
      setIsRecording(true);
      setIsPaused(false);
      toast.success('Recording started');
    } catch (error) {
      mediaRecorderRef.current = null;
      stopStream();

      if (!isMountedRef.current) {
        return;
      }

      const message = getMicrophoneErrorMessage(error);
      setErrorMessage(message);
      toast.error(message);
    }
  }

  function stopRecording({ notifyMaxDuration = false } = {}) {
    const mediaRecorder = mediaRecorderRef.current;

    if (!mediaRecorder) {
      return;
    }

    if (mediaRecorder.state === 'inactive') {
      clearTimer();
      setIsRecording(false);
      setIsPaused(false);
      stopStream();
      mediaRecorderRef.current = null;
      return;
    }

    mediaRecorder.stop();
    setIsRecording(false);
    setIsPaused(false);

    if (notifyMaxDuration) {
      toast.info('Recording stopped automatically at the 5 minute limit.');
    }
  }

  function pauseRecording() {
    if (mediaRecorderRef.current?.state !== 'recording') {
      return;
    }

    mediaRecorderRef.current.pause();
    setIsPaused(true);
  }

  function resumeRecording() {
    if (mediaRecorderRef.current?.state !== 'paused') {
      return;
    }

    mediaRecorderRef.current.resume();
    setIsPaused(false);
  }

  function deleteRecording() {
    if (isProcessing) {
      return;
    }

    setErrorMessage('');
    resetRecorderState();
  }

  async function handleRecordAgain() {
    if (isProcessing) {
      return;
    }

    deleteRecording();
    await startRecording();
  }

  async function transcribeRecording() {
    if (!audioBlob || isProcessing) {
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMessage('');

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const audioFile = createAudioFileFromBlob(audioBlob);
      const transcript = await transcribeAudioFile(audioFile, controller.signal);

      onTranscript(transcript);

      if (isMountedRef.current) {
        clearSavedRecording();
      }
    } catch (error) {
      if (error?.name === 'AbortError') {
        return;
      }

      if (!isMountedRef.current) {
        return;
      }

      const message =
        error instanceof Error ? error.message : 'We could not transcribe this recording. Please try again.';

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
    <div className="space-y-5">
      {!audioBlob ? (
        <div className="rounded-[24px] border border-dashed border-[var(--shell-line)] bg-white/85 p-6">
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="w-full rounded-[24px] border border-[var(--shell-line)] bg-[var(--surface-muted)] px-4 py-6">
              <AudioWaveform isActive={isRecording} isPaused={isPaused} />
            </div>

            <div className="space-y-2">
              <p className="text-lg font-semibold text-[var(--shell-ink)]">Record a quick meeting voice note</p>
              <p className="max-w-xl text-sm leading-7 text-[var(--shell-copy)]">
                Start recording when you are ready. Pause if you need a break, then stop and transcribe the clip back into the composer.
              </p>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--shell-soft)]">
                Max duration: {formatTime(MAX_RECORDING_SECONDS)}
              </p>
            </div>

            {errorMessage ? (
              <div className="w-full max-w-xl rounded-[20px] border border-red-200 bg-red-50 px-4 py-3 text-left text-sm leading-6 text-red-700">
                {errorMessage}
              </div>
            ) : null}

            {isRecording ? (
              <div className="inline-flex items-center gap-3 rounded-full bg-[var(--surface-muted)] px-4 py-2 text-sm text-[var(--shell-ink)]">
                <span className={`h-2.5 w-2.5 rounded-full ${isPaused ? 'bg-amber-500' : 'animate-pulse bg-red-500'}`} />
                <span className="font-mono text-base font-semibold">{formatTime(recordingTime)}</span>
                <span className="text-[var(--shell-soft)]">{isPaused ? 'Paused' : 'Recording'}</span>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center justify-center gap-3">
              {!isRecording ? (
                <button
                  type="button"
                  onClick={startRecording}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#ef4444] px-5 py-3 text-sm font-semibold text-white shadow-[0_20px_40px_-24px_rgba(239,68,68,0.7)] transition-all hover:bg-[#dc2626]"
                >
                  <Mic className="h-5 w-5" />
                  Start recording
                </button>
              ) : (
                <>
                  {!isPaused ? (
                    <button
                      type="button"
                      onClick={pauseRecording}
                      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[var(--shell-line)] bg-white px-5 py-3 text-sm font-semibold text-[var(--shell-ink)] transition-all hover:border-amber-300 hover:bg-amber-50"
                    >
                      <Pause className="h-5 w-5" />
                      Pause
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={resumeRecording}
                      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--chat-primary)] px-5 py-3 text-sm font-semibold text-white shadow-[0_20px_40px_-24px_rgba(15,118,110,0.7)] transition-all hover:bg-[var(--chat-primary-strong)]"
                    >
                      <Play className="h-5 w-5" />
                      Resume
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => stopRecording()}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--shell-ink)] px-5 py-3 text-sm font-semibold text-white shadow-[0_20px_40px_-24px_rgba(15,23,42,0.8)] transition-all hover:bg-slate-800"
                  >
                    <Square className="h-5 w-5" />
                    Stop
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {audioBlob && !isRecording ? (
        <div className="animate-in slide-in-from-bottom-4 fade-in space-y-4 duration-300">
          <div className="rounded-[24px] border border-[var(--shell-line)] bg-transparent p-4 shadow-[0_20px_40px_-28px_rgba(15,23,42,0.55)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-[var(--chat-primary-soft)] px-3 py-1 text-xs font-medium text-[var(--chat-primary-strong)]">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Recording complete
                </div>
                <div className="mt-2 space-y-1 text-sm text-[var(--shell-soft)]">
                  <p>Clip length: {formatTime(recordingTime)}</p>
                  <p>File size: {formatFileSize(audioBlob.size)}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleRecordAgain}
                  disabled={isProcessing}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-[var(--shell-line)] bg-white px-4 py-2 text-sm font-semibold text-[var(--shell-ink)] transition-colors hover:border-[var(--chat-primary)]/30 hover:bg-[var(--chat-primary-soft)]/40 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Mic className="h-4 w-4" />
                  Record again
                </button>
                <button
                  type="button"
                  onClick={deleteRecording}
                  disabled={isProcessing}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--shell-line)] bg-white text-[var(--shell-soft)] transition-colors hover:border-red-200 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-60"
                  title="Delete recording"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
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

            <audio src={audioUrl} controls className="mt-4 h-10 w-full" style={{ maxHeight: '40px' }} />
          </div>

          <button
            type="button"
            onClick={transcribeRecording}
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
      ) : null}
    </div>
  );
}
