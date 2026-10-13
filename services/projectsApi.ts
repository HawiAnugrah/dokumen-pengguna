const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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

function handleUnauthorized(status: number): boolean {
  if (status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    return true;
  }
  return false;
}

export interface ProjectCreate {
  name: string;
  description?: string;
  workspace_id: number;
  application_type?: string;
  domain_business?: string;
  target_users?: string;
  business_goals?: string;
  repo_url?: string;
}

export interface ProjectUpdate {
  name?: string;
  description?: string;
  application_type?: string;
  domain_business?: string;
  target_users?: string;
  business_goals?: string;
  repo_url?: string;
}

export interface ProjectResponse {
  id: number;
  name: string;
  description?: string | null;
  application_type?: string | null;
  domain_business?: string | null;
  target_users?: string | null;
  business_goals?: string | null;
  repo_url?: string | null;
  created_at: string;
  workspace_id: number;
  creator_id: number;
}

export interface SuggestEpicDraftPayload {
  project_name: string;
  project_description?: string;
  application_type?: string;
  domain_business?: string;
  existing_epics?: string[];
}

export interface SuggestEpicDraftResponse {
  title: string;
  description: string;
}

export interface SuggestEpicRefinePayload {
  project_name?: string;
  title: string;
  description?: string;
}

export interface SuggestEpicRefineResponse {
  title: string;
  description: string;
}

export interface SuggestDescriptionPayload {
  project_name: string;
  platform_type: string;
}
export interface GenerateRequirementsResponse {
  user_types?: any[];
  epics?: any[];
  user_stories?: any[];
  nfrs?: any[];
}

export interface SuggestNFRDraftPayload {
  project_name: string;
  project_description?: string;
  application_type?: string;
  domain_business?: string;
  existing_categories?: string[];
}

export interface SuggestNFRDraftResponse {
  category: string;
  description: string;
}

export interface SuggestNFRRefinePayload {
  project_name?: string;
  category: string;
  description?: string;
}

export interface SuggestNFRRefineResponse {
  category: string;
  description: string;
}

export interface SuggestDescriptionResponse {
  description: string;
}

export interface SuggestUserGoalsPayload {
  project_name: string;
  user_type_name: string;
  user_type_description?: string;
}

export interface SuggestUserGoalsResponse {
  goals: string;
  frustrations: string;
}

export interface SuggestUserJourneyPersonaItem {
  name: string;
  user_type?: string;
  about?: string;
}

export interface SuggestUserJourneyPayload {
  project_name: string;
  project_description?: string;
  personas?: SuggestUserJourneyPersonaItem[];
}

export interface SuggestUserJourneyStepItem {
  title: string;
  description: string;
  persona_name?: string | null;
}

export interface SuggestUserJourneyResponse {
  journey: string;
  steps: SuggestUserJourneyStepItem[];
}

export interface SuggestUserTypeDescriptionPayload {
  project_name: string;
  user_type_name: string;
  project_description?: string;
}

export interface SuggestUserTypeDescriptionResponse {
  description: string;
}

export interface SuggestUserTypeDraftPayload {
  project_name: string;
  project_description?: string;
  application_type?: string;
  domain_business?: string;
  existing_user_types?: string[];
}

export interface SuggestUserTypeDraftResponse {
  name: string;
  description: string;
}

const getAuthHeaders = (token: string) => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`,
});

async function parseOrThrow<T>(response: Response, fallback: string): Promise<T> {
  if (!response.ok) {
    handleUnauthorized(response.status);
    const errorData = await response.json().catch(() => ({}));
    throw new Error(formatApiError(errorData, fallback));
  }
  return response.json();
}

export const projectApi = {
  createProject: async (data: ProjectCreate, token: string): Promise<ProjectResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/projects`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(data),
    });
    return parseOrThrow(response, 'Gagal membuat proyek');
  },

  getProjects: async (workspaceIdOrToken?: any, tokenArg?: string): Promise<ProjectResponse[]> => {
    let url = `${API_BASE_URL}/api/projects`;
    let token = '';
    let workspaceId: any = null;

    if (typeof workspaceIdOrToken === 'number') {
      workspaceId = workspaceIdOrToken;
      token = tokenArg || '';
    } else if (typeof workspaceIdOrToken === 'string') {
      token = workspaceIdOrToken;
    }

    if (!workspaceId) {
      workspaceId = localStorage.getItem('workspace_id') || localStorage.getItem('team_id');
    }

    if (workspaceId) {
      url += `?workspace_id=${workspaceId}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });

    if (!response.ok) {
      if (handleUnauthorized(response.status)) return [];
      const errorData = await response.json().catch(() => ({}));
      throw new Error(formatApiError(errorData, 'Gagal mengambil daftar proyek'));
    }
    return response.json();
  },

  getProjectById: async (id: number, token: string): Promise<ProjectResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/projects/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });
    return parseOrThrow(response, 'Proyek tidak ditemukan');
  },

  updateProject: async (id: number, data: ProjectUpdate, token: string): Promise<ProjectResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/projects/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(token),
      body: JSON.stringify(data),
    });
    return parseOrThrow(response, 'Gagal memperbarui proyek');
  },

  deleteProject: async (id: number, token: string) => {
    const response = await fetch(`${API_BASE_URL}/api/projects/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(token),
    });
    return parseOrThrow(response, 'Gagal menghapus proyek');
  },

  suggestDescription: async (
    data: SuggestDescriptionPayload,
    token: string
  ): Promise<SuggestDescriptionResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/projects/suggest-description`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(data),
    });
    return parseOrThrow(response, 'AI gagal memberikan saran deskripsi');
  },

  suggestUserGoals: async (
    data: SuggestUserGoalsPayload,
    token: string
  ): Promise<SuggestUserGoalsResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/projects/suggest-user-goals`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(data),
    });
    return parseOrThrow(response, 'AI gagal memberikan saran goals & frustrations');
  },

  suggestUserTypeDescription: async (
    data: SuggestUserTypeDescriptionPayload,
    token: string
  ): Promise<SuggestUserTypeDescriptionResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/projects/suggest-user-type-description`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(data),
    });
    return parseOrThrow(response, 'AI gagal memberikan saran deskripsi tipe pengguna');
  },

    suggestUserTypeDraft: async (
    data: SuggestUserTypeDraftPayload,
    token: string
  ): Promise<SuggestUserTypeDraftResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/projects/suggest-user-type-draft`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(data),
    });
    return parseOrThrow(response, 'AI gagal membuat draf tipe pengguna');
  },
  
    suggestEpicDraft: async (
    data: SuggestEpicDraftPayload,
    token: string
  ): Promise<SuggestEpicDraftResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/projects/suggest-epic-draft`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(data),
    });
    return parseOrThrow(response, 'AI gagal membuat draf epic');
  },

  suggestEpicRefine: async (
    data: SuggestEpicRefinePayload,
    token: string
  ): Promise<SuggestEpicRefineResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/projects/suggest-epic-refine`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(data),
    });
    return parseOrThrow(response, 'AI gagal menyempurnakan epic');
  },

    suggestNFRDraft: async (
    data: SuggestNFRDraftPayload,
    token: string
  ): Promise<SuggestNFRDraftResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/projects/suggest-nfr-draft`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(data),
    });
    return parseOrThrow(response, 'AI gagal membuat draf NFR');
  },

  suggestNFRRefine: async (
    data: SuggestNFRRefinePayload,
    token: string
  ): Promise<SuggestNFRRefineResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/projects/suggest-nfr-refine`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(data),
    });
    return parseOrThrow(response, 'AI gagal menyempurnakan NFR');
  },

  suggestUserJourney: async (
    data: SuggestUserJourneyPayload,
    token: string
  ): Promise<SuggestUserJourneyResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/projects/suggest-user-journey`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(data),
    });
    return parseOrThrow(response, 'AI gagal memberikan saran user journey');
  },

  generateRequirements: async (id: number, token: string): Promise<GenerateRequirementsResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/projects/${id}/generate-requirements`, {
    method: 'POST',
    headers: getAuthHeaders(token),
  });
  return parseOrThrow<GenerateRequirementsResponse>(response, 'AI gagal memproses data');
},

  saveRequirements: async (id: number, aiRequirementsData: any, token: string) => {
    const response = await fetch(`${API_BASE_URL}/api/projects/${id}/save-requirements`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(aiRequirementsData),
    });
    return parseOrThrow(response, 'Gagal menyimpan draf kebutuhan');
  },

  downloadProjectPdf: async (projectId: number, projectName: string, token: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/export/pdf`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(formatApiError(errorData, 'Gagal mengunduh dokumen PDF'));
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeName = (projectName || 'project').replace(/[^a-zA-Z0-9_\-]/g, '_');
    a.download = `${safeName}-spesifikasi.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },
};