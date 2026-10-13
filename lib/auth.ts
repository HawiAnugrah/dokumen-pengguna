// lib/auth.ts

export const AUTH_TOKEN_KEY = 'token';
export const AUTH_REFRESH_TOKEN_KEY = 'refresh_token';

/**
 * Ambil token auth dari localStorage.
 * Terpusat di sini supaya kalau nama key berubah di masa depan,
 * cukup ubah satu tempat ini, nggak perlu cari-cari ke semua komponen.
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null; // guard untuk SSR / build time
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_REFRESH_TOKEN_KEY);
}

export function setRefreshToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTH_REFRESH_TOKEN_KEY, token);
}

export function clearAuthToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_REFRESH_TOKEN_KEY);
  localStorage.removeItem('user');
}

let isRefreshing = false;
let refreshSubscribers: ((token: string | null) => void)[] = [];

function notifySubscribers(newToken: string | null) {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
}

/**
 * Meminta access token baru ke server menggunakan refresh token.
 * Dilengkapi queue agar jika ada banyak request bersamaan saat token expired,
 * request refresh hanya dikirim 1 kali.
 */
export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    clearAuthToken();
    return null;
  }

  if (isRefreshing) {
    return new Promise((resolve) => {
      refreshSubscribers.push((token) => resolve(token));
    });
  }

  isRefreshing = true;
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  try {
    const res = await fetch(`${apiBase}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) {
      clearAuthToken();
      notifySubscribers(null);
      return null;
    }

    const data = await res.json();
    if (data.access_token) {
      setAuthToken(data.access_token);
      if (data.refresh_token) {
        setRefreshToken(data.refresh_token);
      }
      notifySubscribers(data.access_token);
      return data.access_token;
    }

    clearAuthToken();
    notifySubscribers(null);
    return null;
  } catch (err) {
    console.error('Gagal memperbarui access token:', err);
    clearAuthToken();
    notifySubscribers(null);
    return null;
  } finally {
    isRefreshing = false;
  }
}

/**
 * Wrapper fetch otomatis dengan autentikasi:
 * - Menyisipkan header Authorization: Bearer <token>
 * - Jika server mengembalikan 401 Unauthorized, otomatis melakukan refresh token dan retry request 1 kali.
 */
export async function fetchWithAuth(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  let token = getAuthToken();
  const headers = new Headers(init?.headers || {});

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(input, { ...init, headers });

  if (response.status === 401) {
    // Coba refresh token
    const newToken = await refreshAccessToken();
    if (newToken) {
      const retryHeaders = new Headers(init?.headers || {});
      retryHeaders.set('Authorization', `Bearer ${newToken}`);
      return fetch(input, { ...init, headers: retryHeaders });
    }
  }

  return response;
}