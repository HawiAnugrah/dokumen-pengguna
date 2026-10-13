// lib/resilientFetch.ts

/**
 * Konfigurasi opsi tambahan untuk resilientFetch
 */
export interface ResilientFetchOptions extends RequestInit {
  retries?: number;
  backoffMs?: number;
  timeoutMs?: number;
}

/**
 * Helper fetch tangguh dengan:
 * 1. Automatic Retry & Exponential Backoff untuk menangani jaringan WiFi/seluler yang fluktuatif/terputus sesaat.
 * 2. Deteksi Cold Start pada server backend di Render (otomatis retry jika menerima status 502/503/504 saat server sedang bangun).
 * 3. Timeout Controller (AbortController) agar permintaan tidak menggantung tanpa batas jika koneksi mati total.
 * 4. Pesan error yang jelas dan ramah pengguna (user-friendly).
 */
export async function resilientFetch(
  url: string,
  options: ResilientFetchOptions = {}
): Promise<Response> {
  const {
    retries = 2,
    backoffMs = 1500,
    timeoutMs = 60000, // 60 detik default
    ...fetchInit
  } = options;

  let lastError: any = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...fetchInit,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      // Server Render free-tier saat cold start (bangun dari sleep) sering mengembalikan status 502/503/504
      // selama 15-30 detik pertama. Kita lakukan retry otomatis setelah jeda backoff.
      if ([502, 503, 504].includes(response.status) && attempt < retries) {
        console.warn(
          `[ResilientFetch] Server merespons ${response.status} (kemungkinan cold-start). Mencoba ulang ${attempt + 1}/${retries}...`
        );
        await new Promise((resolve) => setTimeout(resolve, backoffMs * (attempt + 1)));
        continue;
      }

      return response;
    } catch (err: any) {
      clearTimeout(timeoutId);
      lastError = err;

      const isTimeout = err?.name === 'AbortError';
      const isNetworkDrop =
        err?.name === 'TypeError' ||
        err?.message?.includes('Failed to fetch') ||
        err?.message?.includes('NetworkError') ||
        err?.message?.includes('Load failed') ||
        err?.message?.includes('network');

      // Jika terjadi timeout atau koneksi terputus sesaat, coba lagi jika masih ada jatah retry
      if ((isTimeout || isNetworkDrop) && attempt < retries) {
        console.warn(
          `[ResilientFetch] Gangguan koneksi (${err?.message || err?.name}). Mencoba ulang ${attempt + 1}/${retries} dalam ${backoffMs * (attempt + 1)}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, backoffMs * (attempt + 1)));
        continue;
      }

      // Format pesan error yang informatif jika semua percobaan gagal
      if (isTimeout) {
        throw new Error(
          'Permintaan melebihi batas waktu (Request Timeout). Koneksi internet lambat atau server backend sedang memulai ulang. Silakan coba lagi.'
        );
      }

      if (isNetworkDrop) {
        throw new Error(
          'Gagal terhubung ke server (Failed to fetch). Periksa stabilitas koneksi internet Anda atau pastikan server backend aktif.'
        );
      }

      throw err;
    }
  }

  throw lastError;
}
