// services/personasApi.ts

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface Persona {
  id: number;
  name: string;
  avatar_url?: string | null;
  age?: number | null;
  location?: string | null;
  family_status?: string | null;
  job_title?: string | null;
  about?: string | null;
  goals?: string | null;
  frustrations?: string | null;
  user_type_id: number;
}

interface UserTypeWithPersonas {
  id: number;
  name: string;
  description?: string | null;
  project_id: number;
  personas: Persona[];
}

const getAuthHeaders = (token: string) => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`,
});

export const personasApi = {
  // Ambil semua persona di sebuah project, lintas semua UserType.
  // Endpoint asli: GET /api/users/types?project_id=... (routers/users.py),
  // return UserTypeResponse[] dengan `personas` nested -- kita flatten di sini.
  getPersonasByProject: async (projectId: number, token: string): Promise<Persona[]> => {
    const response = await fetch(`${API_BASE_URL}/api/users/types?project_id=${projectId}`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });
    if (!response.ok) {
      throw new Error('Gagal mengambil data persona');
    }
    const userTypes: UserTypeWithPersonas[] = await response.json();
    return userTypes.flatMap((ut) => ut.personas || []);
  },
};