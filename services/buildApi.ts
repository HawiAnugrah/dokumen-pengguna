// services/buildApi.ts
import { formatApiError } from '@/lib/api-error';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const getAuthHeaders = (token: string) => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`,
});

export interface TechStack {
  id: number;
  project_id: number;
  target_users: string | null;
  scale: string | null;
  platform: string | null;
  ui_language: string | null;
  ui_framework: string | null;
  ui_library: string | null;
  app_language: string | null;
  app_framework: string | null;
  data_layer: string | null;
  integration_layer: string | null;
}

export type GuidelineCategory = 'project_structure' | 'security' | 'frontend' | 'backend' | 'database';

export interface CodingGuideline {
  id: number;
  project_id: number;
  category: GuidelineCategory | string | null;
  title: string;
  content: string;
  created_at: string;
}

export type DevPlanStatus = 'draft' | 'todo' | 'in_progress' | 'completed';

export interface DevelopmentPlan {
  id: number;
  project_id: number;
  epic_id: number | null;
  title: string;
  description: string | null;
  status: DevPlanStatus;
  created_at: string;
}

export interface EpicOption {
  id: number;
  name: string;
}

const handleJson = async (response: Response, fallbackMsg: string) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(formatApiError(errorData, fallbackMsg));
  }
  return response.json();
};

const handleVoid = async (response: Response, fallbackMsg: string) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(formatApiError(errorData, fallbackMsg));
  }
};

export const buildApi = {
  // ---------- TECH STACK ----------
  getTechStack: async (projectId: number, token: string): Promise<TechStack | null> => {
    const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/tech-stack`, {
      headers: getAuthHeaders(token),
    });
    if (response.status === 404) return null;
    return handleJson(response, 'Gagal mengambil tech stack');
  },

  upsertTechStack: async (
    projectId: number,
    data: Partial<Omit<TechStack, 'id' | 'project_id'>>,
    token: string
  ): Promise<TechStack> => {
    const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/tech-stack`, {
      method: 'PUT',
      headers: getAuthHeaders(token),
      body: JSON.stringify(data),
    });
    return handleJson(response, 'Gagal menyimpan tech stack');
  },

  generateTechStack: async (projectId: number, token: string): Promise<TechStack> => {
    const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/tech-stack/generate`, {
      method: 'POST',
      headers: getAuthHeaders(token),
    });
    return handleJson(response, 'Gagal generate tech stack');
  },

  // ---------- CODING GUIDELINES ----------
  getGuidelines: async (projectId: number, token: string): Promise<CodingGuideline[]> => {
    const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/guidelines`, {
      headers: getAuthHeaders(token),
    });
    return handleJson(response, 'Gagal mengambil coding guidelines');
  },

  createGuideline: async (
    projectId: number,
    data: { title: string; content: string; category?: string | null },
    token: string
  ): Promise<CodingGuideline> => {
    const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/guidelines`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(data),
    });
    return handleJson(response, 'Gagal membuat guideline');
  },

  updateGuideline: async (
    projectId: number,
    guidelineId: number,
    data: { title?: string; content?: string; category?: string | null },
    token: string
  ): Promise<CodingGuideline> => {
    const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/guidelines/${guidelineId}`, {
      method: 'PUT',
      headers: getAuthHeaders(token),
      body: JSON.stringify(data),
    });
    return handleJson(response, 'Gagal memperbarui guideline');
  },

  deleteGuideline: async (projectId: number, guidelineId: number, token: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/guidelines/${guidelineId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(token),
    });
    return handleVoid(response, 'Gagal menghapus guideline');
  },

  generateGuideline: async (projectId: number, category: string, token: string): Promise<CodingGuideline> => {
    const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/guidelines/generate`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify({ category }),
    });
    return handleJson(response, 'Gagal generate guideline');
  },

  generateCustomGuideline: async (
    projectId: number,
    title: string,
    token: string
  ): Promise<CodingGuideline> => {
    const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/guidelines/generate-custom`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify({ title }),
    });
    return handleJson(response, 'Gagal generate custom guideline');
  },

  generateAllGuidelines: async (
    projectId: number,
    token: string
  ): Promise<{ guidelines: CodingGuideline[]; errors: string[] }> => {
    const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/guidelines/generate-all`, {
      method: 'POST',
      headers: getAuthHeaders(token),
    });
    return handleJson(response, 'Gagal generate semua guidelines');
  },

  // ---------- DEVELOPMENT PLANS ----------
  getEpicOptions: async (projectId: number, token: string): Promise<EpicOption[]> => {
    const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/epics-options`, {
      headers: getAuthHeaders(token),
    });
    return handleJson(response, 'Gagal mengambil daftar epic');
  },

  getDevPlans: async (projectId: number, token: string): Promise<DevelopmentPlan[]> => {
    const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/dev-plans`, {
      headers: getAuthHeaders(token),
    });
    return handleJson(response, 'Gagal mengambil development plans');
  },

  createDevPlan: async (
    projectId: number,
    data: { title: string; description?: string; status?: string; epic_id?: number },
    token: string
  ): Promise<DevelopmentPlan> => {
    const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/dev-plans`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(data),
    });
    return handleJson(response, 'Gagal membuat development plan');
  },

  updateDevPlan: async (
    projectId: number,
    planId: number,
    data: Partial<{ title: string; description: string; status: string; epic_id: number }>,
    token: string
  ): Promise<DevelopmentPlan> => {
    const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/dev-plans/${planId}`, {
      method: 'PUT',
      headers: getAuthHeaders(token),
      body: JSON.stringify(data),
    });
    return handleJson(response, 'Gagal memperbarui development plan');
  },

  deleteDevPlan: async (projectId: number, planId: number, token: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/dev-plans/${planId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(token),
    });
    return handleVoid(response, 'Gagal menghapus development plan');
  },

  generateDevPlan: async (projectId: number, epicId: number, token: string): Promise<DevelopmentPlan> => {
    const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/dev-plans/generate`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify({ epic_id: epicId }),
    });
    return handleJson(response, 'Gagal generate development plan');
  },

    // ---------- AUTO-GENERATE SEMUA (dipanggil dari wizard project-setup) ----------
  generateDefaults: async (projectId: number, token: string): Promise<any> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/generate-build-defaults`, {
        method: 'POST',
        headers: getAuthHeaders(token),
      });
      return await handleJson(response, 'Gagal auto-generate Build defaults');
    } catch (err) {
      console.warn('Auto-generate Build defaults non-fatal error:', err);
      return null;
    }
  },
};