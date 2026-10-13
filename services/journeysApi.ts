// services/journeysApi.ts

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Helper untuk menangani format error dari FastAPI
function formatApiError(errorData: any, fallback: string): string {
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

// ============ Interfaces ============

export interface PersonaSummary {
  id: number;
  name: string;
  avatar_url?: string | null;
  job_title?: string | null;
}

export interface JourneyStep {
  id?: number;
  step_order: number;
  title: string;
  description?: string;
  persona_id?: number | null;       // <-- field yang bikin error TS, sekarang ada
  persona?: PersonaSummary | null;  // <-- nested persona dari backend (JourneyStepResponse.persona)
}

export interface UserJourneyResponse {
  id: number;
  project_id: number;
  name: string;
  description?: string | null;
  steps: JourneyStep[];
  created_at?: string;
}

export interface CreateJourneyPayload {
  project_id: number;
  name: string;
  description?: string;
  steps: Array<{
    step_order: number;
    title: string;
    description?: string;
    persona_id?: number | null;
  }>;
}

// ============ Helper ============

const getAuthHeaders = (token: string) => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`,
});

// ============ API ============

export const journeysApi = {
  // Mengambil daftar user journey berdasarkan project_id
  getJourneysByProject: async (projectId: number, token: string): Promise<UserJourneyResponse[]> => {
    const response = await fetch(`${API_BASE_URL}/api/journeys?project_id=${projectId}`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(formatApiError(errorData, 'Gagal mengambil data user journey'));
    }
    return response.json();
  },

  // Mengambil detail user journey berdasarkan ID
  getJourneyById: async (journeyId: number, token: string): Promise<UserJourneyResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/journeys/${journeyId}`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(formatApiError(errorData, 'User journey tidak ditemukan'));
    }
    return response.json();
  },

  // Membuat/Menyimpan user journey baru beserta langkah-langkahnya
  createJourney: async (data: CreateJourneyPayload, token: string): Promise<UserJourneyResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/journeys`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(formatApiError(errorData, 'Gagal menyimpan user journey'));
    }
    return response.json();
  },

  // Memperbarui user journey yang sudah ada (nama & deskripsi saja -- untuk
  // step-nya pakai replaceSteps di bawah, sesuai endpoint PUT /{id}/steps
  // yang terpisah di backend).
  updateJourney: async (
    journeyId: number,
    data: { name: string; description?: string },
    token: string
  ): Promise<UserJourneyResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/journeys/${journeyId}`, {
      method: 'PUT',
      headers: getAuthHeaders(token),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(formatApiError(errorData, 'Gagal memperbarui user journey'));
    }
    return response.json();
  },
  
  // Mengganti seluruh steps sebuah journey (dipakai saat user edit steps
  // secara manual lewat JourneyDetailPanel). Cocok dengan endpoint backend
  // PUT /api/journeys/{id}/steps.
  replaceSteps: async (
    journeyId: number,
    steps: Array<{ step_order: number; title: string; description?: string; persona_id?: number | null }>,
    token: string
  ): Promise<UserJourneyResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/journeys/${journeyId}/steps`, {
      method: 'PUT',
      headers: getAuthHeaders(token),
      body: JSON.stringify({ steps }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(formatApiError(errorData, 'Gagal menyimpan langkah-langkah journey'));
    }
    return response.json();
  },

  // Trigger AI untuk generate steps sebuah journey. Cocok dengan endpoint
  // backend POST /api/journeys/{id}/generate-ai-steps.
  generateAiSteps: async (journeyId: number, token: string): Promise<UserJourneyResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/journeys/${journeyId}/generate-ai-steps`, {
      method: 'POST',
      headers: getAuthHeaders(token),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(formatApiError(errorData, 'Gagal men-generate langkah journey dengan AI'));
    }
    return response.json();
  },

  // Menghapus user journey
  deleteJourney: async (journeyId: number, token: string) => {
    const response = await fetch(`${API_BASE_URL}/api/journeys/${journeyId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(token),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(formatApiError(errorData, 'Gagal menghapus user journey'));
    }
    return response.json();
  },

  linkStoryToStep: async (stepId: number, storyId: number, token: string) => {
  const res = await fetch(`${API_BASE_URL}/api/journeys/steps/${stepId}/link-story`, {  // ✅
    method: 'POST',
    headers: getAuthHeaders(token),  // sekalian pakai helper yang sudah ada
    body: JSON.stringify({ story_id: storyId }),
  });
  if (!res.ok) throw new Error('Gagal menghubungkan story ke step');
  return res.json();
},

unlinkStoryFromStep: async (stepId: number, storyId: number, token: string) => {
  const res = await fetch(`${API_BASE_URL}/api/journeys/steps/${stepId}/link-story/${storyId}`, {  // ✅
    method: 'DELETE',
    headers: getAuthHeaders(token),
  });
  if (!res.ok) throw new Error('Gagal melepas story dari step');
  return res.json();
},
};

