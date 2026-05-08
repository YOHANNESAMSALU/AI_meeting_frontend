export const MAX_RECORDING_SECONDS = 5 * 60;
const API_PROXY_PREFIX = '/api'; 

const LOCALHOST_HOSTNAMES = new Set(['localhost', '127.0.0.1', '0.0.0.0']);

function normalizeApiUrl(value) {
  return typeof value === 'string' ? value.trim().replace(/\/+$/, '') : '';
}

function shouldUseProxy(configuredApiUrl) {
  if (!configuredApiUrl || configuredApiUrl === API_PROXY_PREFIX) {
    return true;
  }

  if (typeof window === 'undefined') {
    return false;
  }

  if (LOCALHOST_HOSTNAMES.has(window.location.hostname)) {
    return false;
  }

  try {
    const targetUrl = new URL(configuredApiUrl, window.location.origin);
    return LOCALHOST_HOSTNAMES.has(targetUrl.hostname);
  } catch (error) {
    return false;
  }
}

function resolveApiEndpoint(path) {
  const configuredApiUrl = normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL);

  if (!configuredApiUrl || shouldUseProxy(configuredApiUrl)) {
    return `${API_PROXY_PREFIX}${path}`;
  }

  return `${configuredApiUrl}${path}`;
}

function extractErrorMessage(payload, fallbackMessage) {
  if (typeof payload?.error === 'string') {
    return payload.error;
  }
  if (typeof payload?.message === 'string') {
    return payload.message;
  }
  if (Array.isArray(payload?.detail) && payload.detail.length > 0) {
    return payload.detail.map((item) => item?.msg).filter(Boolean).join(', ') || fallbackMessage;
  }
  return fallbackMessage;
}

function normalizeSummaryResponse(payload, fallbackTranscript = '') {
  const summary =
    typeof payload?.summary === 'string'
      ? payload.summary.trim()
      : typeof payload?.recap === 'string'
        ? payload.recap.trim()
        : '';

  const transcript =
    typeof payload?.transcript === 'string'
      ? payload.transcript.trim()
      : typeof payload?.text === 'string'
        ? payload.text.trim()
        : fallbackTranscript;

  const decisions = Array.isArray(payload?.decisions)
    ? payload.decisions
    : Array.isArray(payload?.key_decisions)
      ? payload.key_decisions
      : [];

  const rawActionItems = Array.isArray(payload?.actionItems)
    ? payload.actionItems
    : Array.isArray(payload?.action_items)
      ? payload.action_items
      : [];

  const actionItems = rawActionItems
    .map((item) => {
      if (typeof item === 'string') {
        return { task: item, assignee: 'Unassigned' };
      }
      return {
        task: String(item?.task || '').trim(),
        assignee: String(item?.assignee || item?.owner || 'Unassigned').trim() || 'Unassigned',
      };
    })
    .filter((item) => item.task);

  return { summary, transcript, decisions, actionItems };
}

const SUPPORTED_AUDIO_MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg;codecs=opus',
  'audio/mp4',
  'audio/mpeg',
];

const AUDIO_EXTENSION_BY_TYPE = {
  'audio/mpeg': 'mp3',
  'audio/mp4': 'm4a',
  'audio/ogg': 'ogg',
  'audio/ogg;codecs=opus': 'ogg',
  'audio/webm': 'webm',
  'audio/webm;codecs=opus': 'webm',
};

export function formatTime(totalSeconds) {
  const safeSeconds = Number.isFinite(totalSeconds) ? Math.max(0, totalSeconds) : 0;
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;

  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export function formatFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 Bytes';
  }

  const units = ['Bytes', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${Math.round(value * 100) / 100} ${units[unitIndex]}`;
}

export function stopMediaStream(stream) {
  if (!stream) {
    return;
  }

  stream.getTracks().forEach((track) => {
    if (track.readyState !== 'ended') {
      track.stop();
    }
  });
}

export function revokeObjectUrl(url) {
  if (url) {
    URL.revokeObjectURL(url);
  }
}

export function getSupportedAudioMimeType() {
  if (typeof MediaRecorder === 'undefined') {
    return '';
  }

  if (typeof MediaRecorder.isTypeSupported !== 'function') {
    return SUPPORTED_AUDIO_MIME_TYPES[0];
  }

  return SUPPORTED_AUDIO_MIME_TYPES.find((mimeType) => MediaRecorder.isTypeSupported(mimeType)) ?? '';
}

export function createAudioFileFromBlob(blob, baseName = `meeting-notes-${Date.now()}`) {
  const type = blob.type || 'audio/webm';
  const normalizedType = type.split(';')[0];
  const extension = AUDIO_EXTENSION_BY_TYPE[type] ?? AUDIO_EXTENSION_BY_TYPE[normalizedType] ?? 'webm';

  return new File([blob], `${baseName}.${extension}`, { type });
}

export function getMicrophoneErrorMessage(error) {
  switch (error?.name) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
    case 'SecurityError':
      return 'Microphone access was blocked. Please allow microphone permission in your browser and try again.';
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return 'No microphone was found. Connect a microphone and try again.';
    case 'NotReadableError':
    case 'TrackStartError':
      return 'Your microphone is currently unavailable. Close any other recording apps and try again.';
    case 'AbortError':
      return 'Microphone setup was interrupted. Please try again.';
    default:
      return 'We could not start recording. Please check your microphone and try again.';
  }
}

export async function transcribeAudioFile(audioFile, signal) {
  const formData = new FormData();
  formData.append('file', audioFile);

  const response = await fetch(resolveApiEndpoint('/summarize-audio'), {
    method: 'POST',
    body: formData,
    signal,
  });

  let payload = null;

  try {
    payload = await response.json();
  } catch (error) {
    if (!response.ok) {
      throw new Error('The transcription service returned an unexpected response.');
    }
    throw new Error('The transcription service did not return valid transcript data.');
  }

  if (!response.ok) {
    throw new Error(extractErrorMessage(payload, 'We could not transcribe this audio right now. Please try again.'));
  }

  const normalized = normalizeSummaryResponse(payload);

  if (!normalized.summary) {
    throw new Error('The transcription service did not return transcript and summary.');
  }

  return normalized;
}

export async function summarizeMeetingNotes(notes, signal) {
  const response = await fetch(resolveApiEndpoint('/summarize-text'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text: notes }),
    signal,
  });

  let payload = null;

  try {
    payload = await response.json();
  } catch (error) {
    if (!response.ok) {
      throw new Error('The summarization service returned an unexpected response.');
    }
    throw new Error('The summarization service did not return valid summary data.');
  }

  if (!response.ok) {
    throw new Error(extractErrorMessage(payload, 'We could not summarize these meeting notes right now. Please try again.'));
  }

  const normalized = normalizeSummaryResponse(payload, notes.trim());

  if (!normalized.summary) {
    throw new Error('The summarization service did not return a summary.');
  }

  return normalized;
}
