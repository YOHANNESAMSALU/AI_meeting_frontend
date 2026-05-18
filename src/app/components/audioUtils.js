import { apiRequest } from '../lib/api';

export const MAX_RECORDING_SECONDS = 5 * 60;

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeMeetingId(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : null;
  }

  return null;
}

export function normalizeSummaryResponse(payload, fallbackTranscript = '') {
  // If payload is directly a MeetingResponse
  if (payload && typeof payload === 'object' && 'summary' in payload && 'id' in payload) {
    return {
      summary: normalizeText(payload.summary),
      transcript: normalizeText(payload.transcription) || fallbackTranscript,
      decisions: [], // API doesn't provide decisions directly
      actionItems: [], // API doesn't provide action items directly
      meeting: {
        id: normalizeMeetingId(payload.id),
        title: normalizeText(payload.title),
        language: normalizeText(payload.language) || 'English',
        transcription: normalizeText(payload.transcription),
        source: normalizeText(payload.source),
        created_at: normalizeText(payload.created_at),
      },
    };
  }

  // Fallback for old format
  const meetingPayload =
    payload?.meeting && typeof payload.meeting === 'object' && payload.meeting !== null ? payload.meeting : payload;

  const summary =
    normalizeText(payload?.summary) || normalizeText(payload?.recap) || normalizeText(meetingPayload?.summary);

  const transcript =
    normalizeText(payload?.transcript) ||
    normalizeText(payload?.text) ||
    normalizeText(payload?.transcription) ||
    normalizeText(meetingPayload?.transcript) ||
    normalizeText(meetingPayload?.transcription) ||
    fallbackTranscript;

  const decisionsSource = Array.isArray(payload?.decisions)
    ? payload.decisions
    : Array.isArray(payload?.key_decisions)
      ? payload.key_decisions
      : Array.isArray(meetingPayload?.decisions)
        ? meetingPayload.decisions
        : [];

  const rawActionItems = Array.isArray(payload?.actionItems)
    ? payload.actionItems
    : Array.isArray(payload?.action_items)
      ? payload.action_items
      : Array.isArray(meetingPayload?.actionItems)
        ? meetingPayload.actionItems
        : Array.isArray(meetingPayload?.action_items)
          ? meetingPayload.action_items
          : [];

  const decisions = decisionsSource.map((item) => String(item || '').trim()).filter(Boolean);

  const actionItems = rawActionItems
    .map((item) => {
      if (typeof item === 'string') {
        return { task: item.trim(), assignee: 'Unassigned' };
      }

      return {
        task: String(item?.task || item?.title || '').trim(),
        assignee: String(item?.assignee || item?.owner || 'Unassigned').trim() || 'Unassigned',
      };
    })
    .filter((item) => item.task);

  return {
    summary,
    transcript,
    decisions,
    actionItems,
    meeting: {
      id: normalizeMeetingId(payload?.meeting_id ?? payload?.id ?? meetingPayload?.id),
      title: normalizeText(payload?.title) || normalizeText(meetingPayload?.title) || null,
      language: normalizeText(payload?.language) || normalizeText(meetingPayload?.language) || 'English',
      transcription: transcript || null,
      source: normalizeText(payload?.source) || normalizeText(meetingPayload?.source) || null,
      created_at: normalizeText(payload?.created_at) || normalizeText(meetingPayload?.created_at) || null,
    },
  };
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

  const payload = await apiRequest('/summarize-audio', {
    method: 'POST',
    body: formData,
    signal,
  });

  const normalized = normalizeSummaryResponse(payload);

  if (!normalized.summary) {
    throw new Error('The transcription service did not return transcript and summary.');
  }

  return normalized;
}

export async function summarizeMeetingNotes(notes, signal) {
  const payload = await apiRequest('/summarize-text', {
    method: 'POST',
    body: { text: notes },
    signal,
  });

  const normalized = normalizeSummaryResponse(payload, notes.trim());

  if (!normalized.summary) {
    throw new Error('The summarization service did not return a summary.');
  }

  return normalized;
}
