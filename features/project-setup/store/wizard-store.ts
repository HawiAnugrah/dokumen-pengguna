// features/project-setup/store/wizard-store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { projectApi } from '@/services/projectsApi';
import { workspaceApi } from '@/services/workspaceApi';

export interface PersonaDraft {
  name: string;
  age?: number;
  location?: string;
  familyStatus?: string;
  jobTitle?: string;
  about?: string;
  goals?: string;
  frustrations?: string;
}

export interface UserTypeItem {
  id: string;
  name: string;
  description: string;
  personas?: PersonaDraft[];
}

export interface UserGoalItem {
  id: string;
  userTypeName: string;
  goals: string;
  frustrations: string;
}

export interface EpicItem {
  id: string;
  title: string;
  description: string;
}

export interface NonFunctionalItem {
  id: string;
  category: string;
  description: string;
}

export interface UserStoryItem {
  id: string;
  epicId: string;
  epicTitle: string;
  storyName: string;
  userType: string;
  description: string;
  acceptanceCriteria?: string[];
  techNotes?: string[];
  testCases?: string[];
}

export interface JourneyStepItem {
  title: string;
  description: string;
  persona_name?: string | null;
}

export type ProjectTypeEnum = 'generate' | 'translate' | 'example' | null;

interface WizardState {
  step: number;
  teamName: string;
  projectName: string;
  useAi: boolean | null;
  projectType: ProjectTypeEnum;
  projectDescription: string;
  platformType: string;
  userTypes: UserTypeItem[];
  userGoals: UserGoalItem[];
  epics: EpicItem[];
  nonFunctionals: NonFunctionalItem[];
  userStories: UserStoryItem[];
  userJourney: string;
  userJourneySteps: JourneyStepItem[];
  projectId: number | null;
  isCreatingProject: boolean;
  workspaceId: number | null;
  isCreatingWorkspace: boolean;

  // ---- Jalur "Translate" (reverse engineer existing software) ----
  softwareName: string;
  softwareOverview: string;
  softwareTechnologies: string[];

  // SoftwareScale step
  knowsSoftwareSize: string | null;
  linesOfCode: string;
  yearsInDev: string;
  softwareSizeClass: string;
  codeStructure: string;

  // SoftwareDetails step
  hasDbLogic: string | null;
  useMicroservice: string | null;
  otherComplexity: string;

  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  updateTeamName: (name: string) => void;
  updateProjectName: (name: string) => void;
  setUseAi: (choice: boolean) => void;
  setProjectType: (type: ProjectTypeEnum) => void;
  setProjectDescription: (desc: string) => void;
  setPlatformType: (platform: string) => void;
  setUserJourney: (journey: string, steps?: JourneyStepItem[]) => void;

  setSoftwareName: (name: string) => void;
  setSoftwareOverview: (overview: string) => void;
  setSoftwareTechnologies: (techs: string[]) => void;

  setKnowsSoftwareSize: (value: string | null) => void;
  setLinesOfCode: (value: string) => void;
  setYearsInDev: (value: string) => void;
  setSoftwareSizeClass: (value: string) => void;
  setCodeStructure: (value: string) => void;

  setHasDbLogic: (value: string | null) => void;
  setUseMicroservice: (value: string | null) => void;
  setOtherComplexity: (value: string) => void;

  addUserType: (item: UserTypeItem) => void;
  removeUserType: (id: string) => void;
  updateUserTypeDescription: (id: string, description: string) => void;
  // BARU: update name dan/atau description sekaligus (dipakai UserTypes.tsx)
  updateUserType: (id: string, patch: Partial<Pick<UserTypeItem, 'name' | 'description'>>) => void;
  updateUserGoal: (userTypeName: string, goals: string, frustrations: string) => void;

  addEpic: (item: EpicItem) => void;
  removeEpic: (id: string) => void;
  updateEpic: (id: string, updatedData: Partial<EpicItem>) => void;

  addNonFunctional: (item: NonFunctionalItem) => void;
  removeNonFunctional: (id: string) => void;
  updateNonFunctional: (id: string, updatedData: Partial<NonFunctionalItem>) => void;

  addUserStory: (item: UserStoryItem) => void;
  removeUserStory: (id: string) => void;
  updateStory: (id: string, updatedData: Partial<UserStoryItem>) => void;

  setProjectId: (id: number) => void;
  setWorkspaceId: (id: number) => void;

  createWorkspaceIfNeeded: (token: string) => Promise<number | null>;
  createProjectIfNeeded: (token: string) => Promise<number | null>;
  generateAIRequirements: (projectId: number, token: string) => Promise<boolean>;
  resetStore: () => void;
}

const getValidToken = (token?: string): string => {
  return token || localStorage.getItem('token') || localStorage.getItem('access_token') || '';
};

// Backend belum punya field khusus untuk detail teknis software existing
// (teknologi, ukuran, kompleksitas database), jadi sementara kita rangkum
// jadi teks dan sisipkan ke `description` project. Kalau nanti backend
// sudah punya field dedicated, tinggal pecah fungsi ini.
function buildTranslateDescription(state: {
  softwareOverview: string;
  softwareTechnologies: string[];
  knowsSoftwareSize: string | null;
  linesOfCode: string;
  yearsInDev: string;
  softwareSizeClass: string;
  codeStructure: string;
  hasDbLogic: string | null;
  useMicroservice: string | null;
  otherComplexity: string;
}): string {
  const parts: string[] = [];

  if (state.softwareOverview) parts.push(state.softwareOverview);

  if (state.softwareTechnologies && state.softwareTechnologies.length > 0) {
    parts.push(`Technologies: ${state.softwareTechnologies.join(', ')}`);
  }

  if (state.knowsSoftwareSize === 'yes' && state.linesOfCode) {
    parts.push(`Estimated size: ${state.linesOfCode} lines of code`);
  } else if (state.knowsSoftwareSize === 'no') {
    const sizeParts: string[] = [];
    if (state.yearsInDev) sizeParts.push(`${state.yearsInDev} in development`);
    if (state.softwareSizeClass) sizeParts.push(`classified as ${state.softwareSizeClass}`);
    if (state.codeStructure) sizeParts.push(`structure: ${state.codeStructure}`);
    if (sizeParts.length > 0) parts.push(`Size estimate: ${sizeParts.join(', ')}`);
  }

  if (state.hasDbLogic === 'yes') {
    const dbParts: string[] = ['Uses database logic (stored procedures/triggers)'];
    if (state.useMicroservice) dbParts.push(`microservice architecture: ${state.useMicroservice}`);
    if (state.otherComplexity) dbParts.push(`additional complexity: ${state.otherComplexity}`);
    parts.push(dbParts.join(', '));
  }

  return parts.join('\n\n');
}

export const useWizardStore = create<WizardState>()(
  persist(
    (set, get: any) => ({
      step: 1,
      teamName: '',
      projectName: '',
      useAi: null,
      projectType: null,
      projectDescription: '',
      platformType: 'Web Application',
      userTypes: [],
      userGoals: [],
      epics: [],
      nonFunctionals: [],
      userStories: [],
      userJourney: '',
      userJourneySteps: [],
      projectId: null,
      isCreatingProject: false,
      workspaceId: null,
      isCreatingWorkspace: false,

      softwareName: '',
      softwareOverview: '',
      softwareTechnologies: [],

      knowsSoftwareSize: null,
      linesOfCode: '',
      yearsInDev: '',
      softwareSizeClass: '',
      codeStructure: '',

      hasDbLogic: null,
      useMicroservice: null,
      otherComplexity: '',

      setStep: (step) => set({ step }),
      nextStep: () => set((state) => ({ step: state.step + 1 })),
      prevStep: () => set((state) => ({ step: Math.max(state.step - 1, 1) })),

      updateTeamName: (name) => set({ teamName: name }),
      updateProjectName: (name) => set({ projectName: name }),
      setUseAi: (choice) => set({ useAi: choice }),
      setProjectType: (type) => set({ projectType: type }),
      setProjectDescription: (desc) => set({ projectDescription: desc }),
      setPlatformType: (platform) => set({ platformType: platform }),
      setUserJourney: (journey, steps = []) => set({ userJourney: journey, userJourneySteps: steps }),

      setSoftwareName: (name) => set({ softwareName: name }),
      setSoftwareOverview: (overview) => set({ softwareOverview: overview }),
      setSoftwareTechnologies: (techs) => set({ softwareTechnologies: techs }),

      setKnowsSoftwareSize: (value) => set({ knowsSoftwareSize: value }),
      setLinesOfCode: (value) => set({ linesOfCode: value }),
      setYearsInDev: (value) => set({ yearsInDev: value }),
      setSoftwareSizeClass: (value) => set({ softwareSizeClass: value }),
      setCodeStructure: (value) => set({ codeStructure: value }),

      setHasDbLogic: (value) => set({ hasDbLogic: value }),
      setUseMicroservice: (value) => set({ useMicroservice: value }),
      setOtherComplexity: (value) => set({ otherComplexity: value }),

      addUserType: (item) => set((state) => ({ userTypes: [...state.userTypes, item] })),
      removeUserType: (id) => set((state) => ({ userTypes: state.userTypes.filter((u) => u.id !== id) })),
      updateUserTypeDescription: (id, description) => set((state) => ({
        userTypes: state.userTypes.map((ut) => ut.id === id ? { ...ut, description } : ut)
      })),
      updateUserType: (id, patch) => set((state) => ({
        userTypes: state.userTypes.map((ut) => (ut.id === id ? { ...ut, ...patch } : ut)),
      })),

      updateUserGoal: (userTypeName, goals, frustrations) => set((state) => {
        const existingIndex = state.userGoals.findIndex((g: any) => g.userTypeName === userTypeName);
        if (existingIndex !== -1) {
          const updated = [...state.userGoals];
          updated[existingIndex] = { ...updated[existingIndex], goals, frustrations };
          return { userGoals: updated };
        } else {
          return {
            userGoals: [...state.userGoals, { id: Date.now().toString(), userTypeName, goals, frustrations }]
          };
        }
      }),

      addEpic: (item) => set((state) => ({ epics: [...state.epics, item] })),
      removeEpic: (id) => set((state) => ({ epics: state.epics.filter((e) => e.id !== id) })),
      updateEpic: (id, updatedData) => set((state) => ({
        epics: state.epics.map((e) => (e.id === id ? { ...e, ...updatedData } : e))
      })),

      addNonFunctional: (item) => set((state) => ({ nonFunctionals: [...state.nonFunctionals, item] })),
      removeNonFunctional: (id) => set((state) => ({ nonFunctionals: state.nonFunctionals.filter((n) => n.id !== id) })),
      updateNonFunctional: (id, updatedData) => set((state) => ({
        nonFunctionals: state.nonFunctionals.map((n) => (n.id === id ? { ...n, ...updatedData } : n))
      })),

      addUserStory: (item) => set((state) => ({ userStories: [...state.userStories, item] })),
      removeUserStory: (id) => set((state) => ({ userStories: state.userStories.filter((s) => s.id !== id) })),
      updateStory: (id, updatedData) => set((state) => ({
        userStories: state.userStories.map((s) => (s.id === id ? { ...s, ...updatedData } : s))
      })),

      setProjectId: (id) => set({ projectId: id }),
      setWorkspaceId: (id) => set({ workspaceId: id }),

      createWorkspaceIfNeeded: async (token: string) => {
        const activeToken = getValidToken(token);
        if (!activeToken) throw new Error('Token tidak ditemukan.');

        const existingId = get().workspaceId;
        if (existingId) return existingId;

        const teamName = get().teamName?.trim() || 'Workspace Utama';
        set({ isCreatingWorkspace: true });

        try {
          const newWs = await workspaceApi.createWorkspace({ name: teamName }, activeToken);
          set({ workspaceId: newWs.id, isCreatingWorkspace: false });
          return newWs.id;
        } catch (error) {
          console.error('Gagal membuat workspace:', error);
          set({ isCreatingWorkspace: false });
          return null;
        }
      },

      createProjectIfNeeded: async (token: string) => {
        const activeToken = getValidToken(token);
        if (!activeToken) throw new Error('Token tidak ditemukan.');
        if (get().projectId) return get().projectId;

        set({ isCreatingProject: true });
        try {
          let activeWorkspaceId = get().workspaceId;
          if (!activeWorkspaceId) {
            const myWorkspaces = await workspaceApi.getMyWorkspaces(activeToken);
            if (!myWorkspaces || myWorkspaces.length === 0) {
              const newWs = await workspaceApi.createWorkspace({ name: get().teamName || 'Workspace Utama' }, activeToken);
              activeWorkspaceId = newWs.id;
            } else {
              activeWorkspaceId = myWorkspaces[0].id;
            }
            set({ workspaceId: activeWorkspaceId });
          }

          const state = get();
          const isTranslate = state.projectType === 'translate';

          const projectName = isTranslate
            ? (state.softwareName?.trim() || 'Proyek Baru')
            : (state.projectName?.trim() || 'Proyek Baru');

          const projectDescription = isTranslate
            ? buildTranslateDescription(state)
            : (state.projectDescription || '');

          const newProject = await projectApi.createProject({
            name: projectName,
            description: projectDescription,
            workspace_id: activeWorkspaceId!,
            application_type: get().platformType || 'Web Application',
            domain_business: 'General',
            target_users: 'General User',
            business_goals: '',
          }, activeToken);

          set({ projectId: newProject.id, isCreatingProject: false });
          return newProject.id;
        } catch (error) {
          console.error('Gagal membuat proyek:', error);
          set({ isCreatingProject: false });
          return null;
        }
      },

      generateAIRequirements: async (projectId: number, token: string) => {
        const activeToken = getValidToken(token);
        try {
          const response = await projectApi.generateRequirements(projectId, activeToken);

          // ID dibuat unik (bukan ut.name / n.category) supaya edit/hapus satu item
          // tidak ikut mengenai item lain yang namanya kebetulan sama.
          const stamp = Date.now();

          const mappedUserTypes: UserTypeItem[] = (response.user_types || []).map(
            (ut: any, index: number) => ({
              id: `ut-${stamp}-${index}`,
              name: ut.name,
              description: ut.description,
              personas: (ut.personas || []).map((p: any) => ({
                name: p.name,
                age: p.age,
                location: p.location,
                familyStatus: p.family_status,
                jobTitle: p.job_title,
                about: p.about,
                goals: p.goals,
                frustrations: p.frustrations,
              })),
            })
          );

          const mappedEpics: EpicItem[] = (response.epics || []).map((e: any, i: number) => ({
            id: `e-${i}`,
            title: e.name,
            description: e.description,
          }));

          const mappedStories: UserStoryItem[] = (response.user_stories || []).map((s: any, i: number) => ({
            id: `s-${i}`,
            epicId: mappedEpics.find(e => e.title === s.epic_name)?.id || '',
            epicTitle: s.epic_name,
            storyName: s.story_name,
            userType: s.user_type,
            description: s.description || '',
            acceptanceCriteria: s.acceptance_criteria || [],
            techNotes: s.tech_notes || [],
            testCases: s.test_cases || [],
          }));

          const mappedNonFunctionals: NonFunctionalItem[] = (response.nfrs || []).map(
            (n: any, i: number) => ({
              id: `nfr-${stamp}-${i}`,
              category: n.category,
              description: n.description,
            })
          );

          const mappedUserGoals: UserGoalItem[] = mappedUserTypes.map((ut: any, index: number) => {
            const persona = ut.personas && ut.personas[0];
            return {
              id: `ug-${stamp}-${index}`,
              userTypeName: ut.name,
              goals: persona?.goals?.trim() || `Mempermudah pengelolaan dan pencapaian target kerja sebagai ${ut.name}.`,
              frustrations: persona?.frustrations?.trim() || `Sistem yang rumit, lambat, atau kurang transparan dalam memberikan informasi yang dibutuhkan.`,
            };
          });

          set({
            epics: mappedEpics,
            userStories: mappedStories,
            userTypes: mappedUserTypes,
            userGoals: mappedUserGoals,
            nonFunctionals: mappedNonFunctionals
          });
          return true;
        } catch (error) {
          console.error('AI Gen Error:', error);
          return false;
        }
      },

      resetStore: () => set({
        step: 1,
        teamName: '',
        projectName: '',
        projectDescription: '',
        userTypes: [],
        userGoals: [],
        epics: [],
        nonFunctionals: [],
        userStories: [],
        userJourney: '',
        userJourneySteps: [],
        projectId: null,
        workspaceId: null,
        softwareName: '',
        softwareOverview: '',
        softwareTechnologies: [],
        knowsSoftwareSize: null,
        linesOfCode: '',
        yearsInDev: '',
        softwareSizeClass: '',
        codeStructure: '',
        hasDbLogic: null,
        useMicroservice: null,
        otherComplexity: '',
      }),
    }),
    {
      name: 'userdoc-wizard-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);