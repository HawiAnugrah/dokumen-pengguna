// services/settingsApi.ts

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

const getAuthHeaders = (token: string) => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`,
});

// ============ Interfaces ============

export interface AIRule {
  id: number;
  name: string;
  content: string;
  created_at: string;
  project_id?: number | null;
  workspace_id?: number | null;
}

export interface AIRuleSuggestion {
  name: string;
  content: string;
}

export interface ProviderInfo {
  name: string;
  provider_key: string;
  model: string;
  status: string;
  rpd_limit?: number;
  rpd_used?: number;
  rpd_remaining?: number;
  rpd_percentage?: number;
  daily_limit: number;
  daily_used: number;
  daily_remaining: number;
  daily_percentage: number;
  monthly_limit: number;
  monthly_used: number;
  monthly_remaining: number;
  monthly_percentage: number;
  requests_today: number;
  requests_month: number;
}

export interface TokenUsageHistoryItem {
  id: number;
  feature: string;
  provider: string;
  model_name: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  created_at: string | null;
}

export interface TokenUsageData {
  rpd_total_limit?: number;
  rpd_total_used?: number;
  rpd_total_remaining?: number;
  rpd_total_percentage?: number;
  monthly_requests_total?: number;
  monthly_quota: number;
  monthly_used: number;
  daily_used?: number;
  remaining_tokens: number;
  usage_percentage: number;
  usage_by_provider: Record<string, number>;
  usage_by_feature: Record<string, number>;
  providers_info: ProviderInfo[];
  history: TokenUsageHistoryItem[];
}

// ============ API ============
// PENTING: semua endpoint AI Rules di sini path-based (project_id di URL path),
// mengikuti routers/ai_rules.py asli -- BUKAN query param seperti versi sebelumnya.

export const settingsApi = {
  getProjectAIRules: async (projectId: number, token: string): Promise<AIRule[]> => {
    const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/ai-rules`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(formatApiError(errorData, 'Gagal mengambil aturan AI'));
    }
    return response.json();
  },

  createProjectAIRule: async (
    projectId: number,
    data: { name: string; content: string },
    token: string
  ): Promise<AIRule> => {
    const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/ai-rules`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(data), // tidak perlu project_id di body, sudah di path
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(formatApiError(errorData, 'Gagal menambahkan aturan AI'));
    }
    return response.json();
  },

  deleteAIRule: async (ruleId: number, token: string) => {
    const response = await fetch(`${API_BASE_URL}/api/ai-rules/${ruleId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(token),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(formatApiError(errorData, 'Gagal menghapus aturan AI'));
    }
    return response.json();
  },

  generateAIRuleSuggestions: async (
    projectId: number,
    token: string
  ): Promise<AIRuleSuggestion[]> => {
    const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/ai-rules/suggest`, {
      method: 'POST',
      headers: getAuthHeaders(token),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(formatApiError(errorData, 'AI gagal memberikan saran aturan'));
    }
    const data = await response.json();
    return data.suggestions || [];
  },

  getTokenUsage: async (token: string, projectId?: number): Promise<TokenUsageData> => {
    const url = projectId
      ? `${API_BASE_URL}/api/tokens/usage?project_id=${projectId}`
      : `${API_BASE_URL}/api/tokens/usage`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(formatApiError(errorData, 'Gagal mengambil data token usage'));
    }
    return response.json();
  },
};