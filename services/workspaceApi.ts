// services/workspaceApi.ts
import { formatApiError } from '@/lib/api-error';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface WorkspaceCreate {
  name: string;
}

export interface WorkspaceResponse {
  id: number;
  name: string;
  created_at: string;
  owner_id: number;
}

export interface WorkspaceMemberResponse {
  user_id: number;
  username: string;
  email: string;
  role: 'owner' | 'editor' | 'viewer';
  joined_at: string;
}

const getAuthHeaders = (token: string) => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`,
});

// 401 = token invalid/expired -> paksa logout.
// 403 = user login VALID tapi ditolak akses ke resource spesifik (misal bukan
// anggota workspace ini) -> BUKAN soal token, jangan logout paksa. Biarkan
// errornya tampil sebagai pesan biasa ke user.
const handleUnauthorized = (status: number): boolean => {
  if (status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    return true;
  }
  return false;
};

export const workspaceApi = {
  createWorkspace: async (data: WorkspaceCreate, token: string): Promise<WorkspaceResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/workspaces`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      handleUnauthorized(response.status);
      const errorData = await response.json().catch(() => ({}));
      throw new Error(formatApiError(errorData, 'Gagal membuat ruang kerja'));
    }
    return response.json();
  },

  getMyWorkspaces: async (token: string): Promise<WorkspaceResponse[]> => {
    const response = await fetch(`${API_BASE_URL}/api/workspaces`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });
    if (!response.ok) {
      if (handleUnauthorized(response.status)) return [];
      const errorData = await response.json().catch(() => ({}));
      throw new Error(formatApiError(errorData, 'Gagal mengambil daftar ruang kerja'));
    }
    return response.json();
  },

  getWorkspaceMembers: async (id: number, token: string): Promise<WorkspaceMemberResponse[]> => {
    const response = await fetch(`${API_BASE_URL}/api/workspaces/${id}/members`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });
    if (!response.ok) {
      if (handleUnauthorized(response.status)) return [];
      const errorData = await response.json().catch(() => ({}));
      throw new Error(formatApiError(errorData, 'Gagal mengambil daftar anggota ruang kerja'));
    }
    return response.json();
  },

  updateWorkspace: async (id: number, data: { name: string }, token: string): Promise<WorkspaceResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/workspaces/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(token),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      handleUnauthorized(response.status);
      const errorData = await response.json().catch(() => ({}));
      throw new Error(formatApiError(errorData, 'Gagal memperbarui nama team'));
    }
    return response.json();
  },

  deleteWorkspace: async (id: number, token: string): Promise<{ message: string }> => {
    const response = await fetch(`${API_BASE_URL}/api/workspaces/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(token),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      handleUnauthorized(response.status);
      throw new Error(formatApiError(data, 'Gagal menghapus team'));
    }
    return data;
  },

  getWorkspaceAIRules: async (workspaceId: number, token: string): Promise<any[]> => {
    const response = await fetch(`${API_BASE_URL}/api/workspaces/${workspaceId}/ai-rules`, {
      headers: getAuthHeaders(token),
    });
    if (!response.ok) {
      if (handleUnauthorized(response.status)) return [];
      const errorData = await response.json().catch(() => ({}));
      throw new Error(formatApiError(errorData, 'Gagal mengambil AI Rules team'));
    }
    return response.json();
  },

  createWorkspaceAIRule: async (workspaceId: number, data: { name: string; content: string }, token: string): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/api/workspaces/${workspaceId}/ai-rules`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      handleUnauthorized(response.status);
      const errorData = await response.json().catch(() => ({}));
      throw new Error(formatApiError(errorData, 'Gagal menambahkan AI Rule team'));
    }
    return response.json();
  },

  deleteWorkspaceAIRule: async (ruleId: number, token: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/ai-rules/${ruleId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(token),
    });
    if (!response.ok) {
      handleUnauthorized(response.status);
      const errorData = await response.json().catch(() => ({}));
      throw new Error(formatApiError(errorData, 'Gagal menghapus AI Rule team'));
    }
  },

  addWorkspaceMember: async (
    workspaceId: number,
    email: string,
    role: 'editor' | 'viewer',
    token: string
  ): Promise<{ message: string }> => {
    const response = await fetch(
      `${API_BASE_URL}/api/workspaces/${workspaceId}/members?email=${encodeURIComponent(email)}&role=${role}`,
      { method: 'POST', headers: getAuthHeaders(token) }
    );
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      handleUnauthorized(response.status);
      throw new Error(formatApiError(data, 'Gagal mengundang anggota'));
    }
    return data;
  },

  removeWorkspaceMember: async (workspaceId: number, userId: number, token: string): Promise<{ message: string }> => {
    const response = await fetch(`${API_BASE_URL}/api/workspaces/${workspaceId}/members/${userId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(token),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      handleUnauthorized(response.status);
      throw new Error(formatApiError(data, 'Gagal menghapus anggota'));
    }
    return data;
  },
};