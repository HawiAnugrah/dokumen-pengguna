// lib/project-context.ts
const ACTIVE_PROJECT_KEY = 'active_project_id';

/**
 * Fallback penyimpanan project_id yang sedang aktif. Dipakai saat sebuah halaman
 * (Stories/Users/Journeys) dibuka tanpa ?project_id= di URL — misalnya karena
 * browser back navigation atau URL diketik ulang manual — supaya halaman tetap
 * bisa memuat data project terakhir yang dibuka, bukan langsung menampilkan error.
 */
export function getStoredProjectId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACTIVE_PROJECT_KEY);
}

export function setStoredProjectId(id: string | number): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACTIVE_PROJECT_KEY, String(id));
}

// TAMBAHAN: dipakai saat project yang sedang aktif dihapus, supaya halaman lain tidak
// otomatis fallback ke project yang sudah tidak ada lagi di database.
export function clearStoredProjectId(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ACTIVE_PROJECT_KEY);
}