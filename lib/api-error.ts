// lib/api-error.ts

/**
 * FastAPI mengembalikan error validasi (422) sebagai `detail: [{loc, msg, type}, ...]`,
 * bukan string tunggal. Helper ini mengubahnya jadi pesan yang bisa dibaca, dan tetap
 * menangani kasus `detail` berupa string biasa (400/403/404/500 dari HTTPException).
 */
export function formatApiError(errorData: any, fallback: string): string {
  const detail = errorData?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((d: any) => {
        const field = Array.isArray(d.loc) ? d.loc.join('.') : 'field';
        return `${field}: ${d.msg}`;
      })
      .join(' | ');
  }
  return fallback;
}