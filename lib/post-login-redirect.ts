// lib/post-login-redirect.ts
import { workspaceApi } from '@/services/workspaceApi';
import { useWizardStore } from '@/features/project-setup/store/wizard-store';

/**
 * Titik masuk setelah login. Hanya menjawab SATU pertanyaan: user ini sudah
 * punya team/workspace atau belum. Urusan project (ada berapa, mana yang
 * dibuka) sepenuhnya jadi tanggung jawab halaman /workspace.
 *
 * Kalau token ternyata sudah tidak valid/kedaluwarsa, workspaceApi.getMyWorkspaces
 * akan otomatis membersihkan token & mengarahkan ke /login (lihat
 * services/workspaceApi.ts -> handleAuthError). '/login' di bawah ini adalah
 * fallback aman untuk kasus lain (misal error jaringan) supaya user tidak
 * pernah nyangkut diam di halaman kosong.
 */
export async function resolvePostLoginRoute(token: string): Promise<string> {
  const { resetStore } = useWizardStore.getState();

  try {
    const workspaces = await workspaceApi.getMyWorkspaces(token);

    // KONDISI 1: Belum punya team sama sekali -> wizard mulai dari step 1 (TeamName)
    if (!workspaces || workspaces.length === 0) {
      resetStore();
      return '/project-setup';
    }

    // KONDISI 2 & 3 (punya team, dengan/tanpa project) -> diputuskan di /workspace
    return '/workspace';

  } catch (err) {
    console.error('Gagal menentukan halaman tujuan setelah login:', err);
    return '/login';
  }
}