// services/usersApi.ts
import { UserType, Persona } from '@/features/users/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_URL = `${API_BASE_URL}/api`;

const getAuthHeaders = (token: string) => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`,
});

// ============ Mapping backend <-> frontend ============
// Backend Persona pakai nama field: job_title, family_status.
// Frontend Persona pakai: workTitle, familyStatus.
// Mapping ini supaya komponen (userDetailPanel, userFormPanel) tidak perlu berubah.

function mapPersonaFromBackend(p: any): Persona & { id?: number } {
  return {
    id: p.id,
    name: p.name,
    avatarUrl: p.avatar_url || p.avatar || '', // 👈 Tambahkan ini
    age: p.age != null ? String(p.age) : '',
    location: p.location || '',
    familyStatus: p.family_status || '',
    workTitle: p.job_title || '',
    about: p.about || '',
    goals: p.goals || '',
    frustrations: p.frustrations || '',
  };
}

function mapPersonaToBackend(p: any, userTypeId: number) {
  return {
    name: p.name,
    avatar_url: p.avatarUrl || null, // 👈 Tambahkan ini
    age: p.age ? Number(p.age) : null,
    location: p.location || null,
    family_status: p.familyStatus || null,
    job_title: p.workTitle || null,
    about: p.about || null,
    goals: p.goals || null,
    frustrations: p.frustrations || null,
    user_type_id: userTypeId,
  };
}

function mapUserTypeFromBackend(ut: any): UserType {
  const personas = (ut.personas || []).map(mapPersonaFromBackend);
  return {
    id: String(ut.id),
    name: ut.name,
    description: ut.description || '',
    personasCount: personas.length,
    storiesCount: 0, // backend belum expose story count per user type
    personas,
  };
}

// ============ API ============

export const usersApi = {
  fetchUserTypes: async (projectId: number, token: string): Promise<UserType[]> => {
    const response = await fetch(`${API_URL}/users/types?project_id=${projectId}`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Gagal mengambil data User Types');
    }
    const data = await response.json();
    return data.map(mapUserTypeFromBackend);
  },

  createUserType: async (
    payload: { name: string; description: string; project_id: number },
    token: string
  ) => {
    const response = await fetch(`${API_URL}/users/types`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Gagal membuat User Type');
    }
    return response.json();
  },

  updateUserType: async (
    id: number,
    payload: { name: string; description: string; project_id: number },
    token: string
  ) => {
    const response = await fetch(`${API_URL}/users/types/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(token),
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Gagal memperbarui User Type');
    }
    return response.json();
  },

  deleteUserType: async (id: number, token: string) => {
    const response = await fetch(`${API_URL}/users/types/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(token),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Gagal menghapus User Type');
    }
    return response.json();
  },

  createPersona: async (persona: any, userTypeId: number, token: string) => {
    const response = await fetch(`${API_URL}/users/personas`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(mapPersonaToBackend(persona, userTypeId)),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Gagal membuat Persona');
    }
    return response.json();
  },

  updatePersona: async (id: number, persona: any, userTypeId: number, token: string) => {
    const response = await fetch(`${API_URL}/users/personas/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(token),
      body: JSON.stringify(mapPersonaToBackend(persona, userTypeId)),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Gagal memperbarui Persona');
    }
    return response.json();
  },

  deletePersona: async (id: number, token: string) => {
    const response = await fetch(`${API_URL}/users/personas/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(token),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Gagal menghapus Persona');
    }
    return response.json();
  },
};