const API_PROXY_PREFIX = '/api';
// const LOCALHOST_HOSTNAMES = new Set(['localhost', '127.0.0.1', '0.0.0.0']);

export const AUTH_TOKEN_STORAGE_KEY = 'meeting-notes-access-token-v1';
export const AUTH_USER_STORAGE_KEY = 'meeting-notes-user-v1';

export function resolveApiEndpoint(path) {
  const normalizedPath = normalizePath(path);
  // Falls back to empty string if the .env variable is not set
  const configuredApiUrl = normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL);

  // If .env is missing, it falls back to the local relative proxy path
  if (!configuredApiUrl) {
    return `${API_PROXY_PREFIX}${normalizedPath}`;
  }

  // Forces the application to use the exact .env value directly
  return `${configuredApiUrl}${normalizedPath}`;
}


class ApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

function normalizeApiUrl(value) {
  return typeof value === 'string' ? value.trim().replace(/\/+$/, '') : '';
}

function normalizePath(path) {
  if (typeof path !== 'string' || !path.trim()) {
    return '/';
  }

  return path.startsWith('/') ? path : `/${path}`;
}


async function parseTextResponse(response) {
  try {
    return await response.text();
  } catch (error) {
    return '';
  }
}

function parseJsonSafely(text) {
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    return null;
  }
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



export function extractErrorMessage(payload, fallbackMessage) {
  if (typeof payload === 'string' && payload.trim()) {
    return payload;
  }

  if (typeof payload?.error === 'string') {
    return payload.error;
  }

  if (typeof payload?.message === 'string') {
    return payload.message;
  }

  if (typeof payload?.detail === 'string' && payload.detail.trim()) {
    return payload.detail;
  }

  if (Array.isArray(payload?.detail) && payload.detail.length > 0) {
    const validationMessage = payload.detail
      .map((item) => item?.msg || item?.message || '')
      .filter(Boolean)
      .join(', ');

    if (validationMessage) {
      return validationMessage;
    }
  }

  return fallbackMessage;
}

export function getAccessToken() {
  if (typeof window === 'undefined') {
    return '';
  }

  return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) || '';
}

export function setAccessToken(token) {
  if (typeof window === 'undefined') {
    return;
  }

  if (token) {
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
    return;
  }

  localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
}

export function getStoredUser() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const rawValue = localStorage.getItem(AUTH_USER_STORAGE_KEY);

    if (!rawValue) {
      return null;
    }

    const parsed = JSON.parse(rawValue);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch (error) {
    return null;
  }
}

export function setStoredUser(user) {
  if (typeof window === 'undefined') {
    return;
  }

  if (user) {
    localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
    return;
  }

  localStorage.removeItem(AUTH_USER_STORAGE_KEY);
}

export function clearStoredSession() {
  setAccessToken('');
  setStoredUser(null);
}

export async function validateToken(signal) {
  try {
    const user = await apiRequest('/auth/me', { signal });
    setStoredUser(user);
    return user;
  } catch (error) {
    if (isUnauthorizedError(error)) {
      clearStoredSession();
    }
    throw error;
  }
}

export function isUnauthorizedError(error) {
  return error instanceof ApiError && (error.status === 401 || error.status === 403);
}

export async function apiRequest(
  path,
  {
    method = 'GET',
    headers = {},
    body,
    signal,
    auth = true,
    responseType = 'json',
    token,
  } = {},
) {
  const requestHeaders = new Headers(headers);
  const accessToken = token ?? getAccessToken();

  if (!requestHeaders.has('Accept')) {
    if (responseType === 'blob') {
      requestHeaders.set('Accept', 'application/pdf, application/octet-stream;q=0.9, */*;q=0.8');
    } else if (responseType === 'text') {
      requestHeaders.set('Accept', 'text/plain, */*;q=0.8');
    } else {
      requestHeaders.set('Accept', 'application/json');
    }
  }

  if (auth && accessToken) {
    requestHeaders.set('Authorization', `Bearer ${accessToken}`);
  }

  let requestBody = body;

  if (body && !(body instanceof FormData) && !(body instanceof Blob) && typeof body === 'object') {
    requestHeaders.set('Content-Type', 'application/json');
    requestBody = JSON.stringify(body);
  }

  const response = await fetch(resolveApiEndpoint(path), {
    method,
    headers: requestHeaders,
    body: requestBody,
    signal,
  });

  if (!response.ok) {
    const errorText = await parseTextResponse(response);
    const errorPayload = parseJsonSafely(errorText) ?? errorText;

    throw new ApiError(
      extractErrorMessage(errorPayload, `Request failed with status ${response.status}.`),
      response.status,
      errorPayload,
    );
  }

  if (responseType === 'blob') {
    return response.blob();
  }

  if (response.status === 204) {
    return null;
  }

  const text = await parseTextResponse(response);

  if (!text) {
    return null;
  }

  if (responseType === 'text') {
    return text;
  }

  return parseJsonSafely(text) ?? text;
}

export async function registerUser(payload, signal) {
  return apiRequest('/auth/register', {
    method: 'POST',
    auth: false,
    body: payload,
    signal,
  });
}

export async function loginUser(payload, signal) {
  return apiRequest('/auth/login', {
    method: 'POST',
    auth: false,
    body: payload,
    signal,
  });
}

export async function fetchCurrentUser(signal) {
  const user = await apiRequest('/auth/me', { signal });
  setStoredUser(user);
  return user;
}

export async function fetchMeetings(signal) {
  const payload = await apiRequest('/meetings/', { signal });
  return Array.isArray(payload) ? payload : [];
}

export async function fetchMeeting(meetingId, signal) {
  const normalizedMeetingId = normalizeMeetingId(meetingId);

  if (normalizedMeetingId == null) {
    throw new Error('A valid meeting id is required.');
  }

  return apiRequest(`/meetings/${normalizedMeetingId}`, { signal });
}

export async function deleteMeeting(meetingId, signal) {
  const normalizedMeetingId = normalizeMeetingId(meetingId);

  if (normalizedMeetingId == null) {
    throw new Error('A valid meeting id is required.');
  }

  return apiRequest(`/meetings/${normalizedMeetingId}`, {
    method: 'DELETE',
    signal,
  });
}

export async function exportMeetingPdf(meetingId, signal) {
  const normalizedMeetingId = normalizeMeetingId(meetingId);

  if (normalizedMeetingId == null) {
    throw new Error('A valid meeting id is required.');
  }

  return apiRequest(`/meetings/${normalizedMeetingId}/export-pdf`, {
    responseType: 'blob',
    signal,
  });
}

export async function sendMeetingEmail(meetingId, attendees, attachPdf = true, signal) {
  const normalizedMeetingId = normalizeMeetingId(meetingId);

  if (normalizedMeetingId == null) {
    throw new Error('A valid meeting id is required.');
  }

  return apiRequest(`/meetings/${normalizedMeetingId}/send-email`, {
    method: 'POST',
    body: {
      attendees,
      attach_pdf: attachPdf,
    },
    signal,
  });
}
