/**
 * Shared HTTP client for AssetBridge API calls.
 * Attaches Firebase ID token when a getAuthToken callback is provided.
 */

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '');

let getAuthToken = null;

/** @param {() => Promise<string|null>} fn */
export function setAuthTokenProvider(fn) {
  getAuthToken = fn;
}

export class ApiError extends Error {
  constructor(message, { status, body } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

/**
 * @param {string} path - Path from ENDPOINTS (e.g. "/api/v1/goals")
 * @param {RequestInit & { params?: Record<string, string|number|boolean|undefined|null> }} [options]
 */
export async function apiRequest(path, options = {}) {
  const { params, headers: customHeaders, ...fetchOptions } = options;

  let url = `${API_BASE_URL}${path}`;
  if (params) {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        search.set(key, String(value));
      }
    });
    const qs = search.toString();
    if (qs) url += `?${qs}`;
  }

  const headers = new Headers(customHeaders || {});
  if (!headers.has('Content-Type') && fetchOptions.body && !(fetchOptions.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (getAuthToken) {
    const token = await getAuthToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, { ...fetchOptions, headers });

  if (response.status === 204) return null;

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const body = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message = isJson && body?.message ? body.message : `Request failed (${response.status})`;
    throw new ApiError(message, { status: response.status, body });
  }

  return body;
}

/**
 * Like apiRequest, but calls onChunk(text) as data arrives instead of waiting
 * for the full response. Resolves with the fully concatenated text.
 * @param {string} path
 * @param {RequestInit} options
 * @param {(chunk: string) => void} onChunk
 */
export async function streamRequest(path, options = {}, onChunk) {
  const { headers: customHeaders, ...fetchOptions } = options;
  const url = `${API_BASE_URL}${path}`;

  const headers = new Headers(customHeaders || {});
  if (!headers.has('Content-Type') && fetchOptions.body) {
    headers.set('Content-Type', 'application/json');
  }

  if (getAuthToken) {
    const token = await getAuthToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, { ...fetchOptions, headers });

  if (!response.ok || !response.body) {
    const text = await response.text().catch(() => '');
    throw new ApiError(text || `Request failed (${response.status})`, { status: response.status });
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let full = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    full += chunk;
    onChunk(chunk);
  }

  return full;
}

export function getApiBaseUrl() {
  return API_BASE_URL;
}
