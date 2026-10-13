// services/profileApi.ts
import { formatApiError } from '@/lib/api-error';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  full_name?: string | null;
  avatar_url?: string | null;
  last_login?: string | null;
}

export const profileApi = {
  getProfile: async (token: string): Promise<UserProfile> => {
    const response = await fetch(`${API_BASE_URL}/api/profile`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(formatApiError(errorData, 'Gagal mengambil profil pengguna'));
    }
    return response.json();
  },

  // TAMBAHAN: dipakai halaman Manage Profile
  updateProfile: async (data: { full_name?: string; avatar_url?: string }, token: string): Promise<UserProfile> => {
    const response = await fetch(`${API_BASE_URL}/api/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(formatApiError(errorData, 'Gagal memperbarui profil'));
    }
    return response.json();
  },

  changePassword: async (
    data: { current_password: string; new_password: string },
    token: string
  ): Promise<{ message: string }> => {
    const response = await fetch(`${API_BASE_URL}/api/profile/change-password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(formatApiError(result, 'Gagal mengubah kata sandi'));
    }
    return result;
  },
};