'use client';

import { useState, Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWizardStore } from '@/features/project-setup/store/wizard-store';
import { LogOut, FastForward, Loader2, ArrowLeft } from 'lucide-react';

import { projectApi } from '@/services/projectsApi';
import { workspaceApi } from '@/services/workspaceApi';
import { buildApi } from '@/services/buildApi';
import { journeysApi } from '@/services/journeysApi';
import { seedExampleStory } from '@/services/storiesApi';
import { getAuthToken } from '@/lib/auth';

import TeamName from '@/features/project-setup/components/teamName';
import NameProject from '@/features/project-setup/components/nameProject';
import ProjectType from '@/features/project-setup/components/projectType';
import AiIntro from '@/features/project-setup/components/aiIntro';
import DescribeProject from '@/features/project-setup/components/describeProject';
import UserTypes from '@/features/project-setup/components/userTypes';
import AiChoice from '@/features/project-setup/components/aiChoice';
import EpicsList from '@/features/project-setup/components/epicList';
import NonFunctionalList from '@/features/project-setup/components/nonFunctionalList';
import UserStoriesList from '@/features/project-setup/components/userStoriesList';
import UserTypeGoals from '@/features/project-setup/components/userTypeGoals';
import UserJourney from '@/features/project-setup/components/userJourney';

import SoftwareIntro from '@/features/project-setup/components/softwareIntro';
import SoftwareName from '@/features/project-setup/components/softwareName';
import SoftwareOverview from '@/features/project-setup/components/softwareOverview';
import SoftwareDetails from '@/features/project-setup/components/softwareDetails';
import SoftwareScale from '@/features/project-setup/components/softwareScale';
import SoftwareTechnologies from '@/features/project-setup/components/softwareTechnologies';

export default function WizardPage() {
  const router = useRouter();

  const {
    step,
    projectType,
    projectName,
    projectId,
    userTypes,
    userGoals,
    epics,
    userStories,
    nonFunctionals,
    userJourney,
    userJourneySteps,
    resetStore,
  } = useWizardStore() as any;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [isSeedingExample, setIsSeedingExample] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 🔒 Auth Guard & State Sync
  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.replace('/login');
    }
  }, [router]);

  useEffect(() => {
    if (mounted && step > 2 && !projectType) {
      useWizardStore.getState().setStep(2);
    }
  }, [mounted, step, projectType]);

  // 🚪 Fungsi Logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('active_workspace_id');
    localStorage.removeItem('active_project_id');
    localStorage.removeItem('userdoc-wizard-storage');
    resetStore();
    router.push('/login');
  };

  // 🔙 Batal dan Kembali ke Dashboard
  const handleBackToDashboard = () => {
    resetStore();
    const activeProj = localStorage.getItem('active_project_id');
    if (activeProj) {
      router.push(`/stories?project_id=${activeProj}`);
    } else {
      router.push('/stories');
    }
  };

  // ⏩ Fungsi Skip Langsung ke Stories Proyek Akun Sendiri
  const handleSkip = async () => {
    setIsSkipping(true);
    const token = getAuthToken();
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      // 1. Ambil workspace milik user yang sedang aktif
      const myWorkspaces = await workspaceApi.getMyWorkspaces(token);
      let targetWsId: number;

      if (myWorkspaces && myWorkspaces.length > 0) {
        targetWsId = myWorkspaces[0].id;
      } else {
        const newWs = await workspaceApi.createWorkspace({ name: 'Workspace Utama' }, token);
        targetWsId = newWs.id;
      }

      // 2. Ambil proyek milik user di workspace ini
      let targetProjId: number;
      const myProjects = await projectApi.getProjects(targetWsId, token);

      if (myProjects && myProjects.length > 0) {
        targetProjId = myProjects[0].id;
      } else {
        const newProj = await projectApi.createProject({
          name: 'Proyek Baru',
          description: 'Spesifikasi proyek baru',
          workspace_id: targetWsId,
          application_type: 'Web Application',
          domain_business: 'General',
          target_users: 'General User',
          business_goals: '',
        }, token);
        targetProjId = newProj.id;
      }

      // 3. Simpan ID yang valid dan arahkan ke Stories
      localStorage.setItem('active_workspace_id', String(targetWsId));
      localStorage.setItem('active_project_id', String(targetProjId));
      resetStore();
      router.push(`/stories?project_id=${targetProjId}`);
    } catch (e) {
      console.error('Gagal skip setup:', e);
      router.push('/login');
    } finally {
      setIsSkipping(false);
    }
  };

  // ✍️ Fungsi Isi Manual:
  // 1. Simpan User Types yang sudah di-generate AI di step DescribeProject
  //    (belum pernah dikirim ke backend sebelum titik ini, cuma ada di
  //    wizard store/localStorage). Epics/User Stories/NFR SENGAJA tidak ikut
  //    disimpan -- itu yang nanti diisi manual oleh user dari dashboard.
  // 2. Seed 1 example story (epic + acceptance criteria) biar dashboard
  //    Stories tidak kosong total.
  // 3. Redirect ke /stories.
  const handleManualSetup = async () => {
    if (!projectId) {
      alert('Project belum berhasil dibuat sebelumnya. Silakan ulangi dari awal wizard.');
      return;
    }

    const token = getAuthToken();
    if (!token) {
      alert('Sesi habis, silakan login kembali.');
      router.push('/login');
      return;
    }

    setIsSeedingExample(true);
    try {
      if (userTypes && userTypes.length > 0) {
        const userTypesPayload = {
          user_types: userTypes.map((ut: any) => ({
            name: ut.name,
            description: ut.description || '',
            personas: (ut.personas || []).map((p: any) => ({
              name: p.name || 'Persona',
              age: p.age || 25,
              location: p.location || '-',
              family_status: p.familyStatus || '-',
              job_title: p.jobTitle || '-',
              about: p.about || '-',
              goals: p.goals || '-',
              frustrations: p.frustrations || '-',
            })),
          })),
          epics: [],
          user_stories: [],
          nfrs: [],
        };
        await projectApi.saveRequirements(projectId, userTypesPayload, token);
      }

      await seedExampleStory(projectId, token);
    } catch (e) {
      // Non-fatal: kalau salah satu gagal, tetap lanjut ke Stories daripada
      // user ke-block di layar loading.
      console.error('Gagal menyiapkan project untuk mode manual:', e);
    } finally {
      setIsSeedingExample(false);
    }

    resetStore();
    router.push(`/stories?project_id=${projectId}`);
  };

  const handleFinishWizard = async () => {
    setIsSubmitting(true);
    const token = getAuthToken();

    if (!token) {
      alert('Sesi habis, silakan login kembali.');
      router.push('/login');
      setIsSubmitting(false);
      return;
    }

    if (!projectId) {
      alert('Project belum berhasil dibuat sebelumnya. Silakan ulangi dari awal wizard.');
      setIsSubmitting(false);
      return;
    }

    try {
      if (projectType === 'generate') {
        const payload = {
          user_types: (userTypes || []).map((ut: any) => {
            const userGoal = (userGoals || []).find((g: any) => g.userTypeName === ut.name);
            return {
              name: ut.name,
              description: ut.description || '',
              personas: (ut.personas && ut.personas.length > 0)
                ? ut.personas.map((p: any) => ({
                    name: p.name || 'Persona',
                    age: p.age || 25,
                    location: p.location || '-',
                    family_status: p.familyStatus || '-',
                    job_title: p.jobTitle || '-',
                    about: p.about || '-',
                    goals: userGoal?.goals || p.goals || '-',
                    frustrations: userGoal?.frustrations || p.frustrations || '-',
                  }))
                : [
                    {
                      name: `${ut.name} Persona`,
                      age: 28,
                      location: 'Jakarta',
                      family_status: 'Single',
                      job_title: ut.name,
                      about: ut.description || '-',
                      goals: userGoal?.goals || `• Mempermudah aktivitas sebagai ${ut.name}`,
                      frustrations: userGoal?.frustrations || `• Kendala proses manual dan minim transparansi`,
                    }
                  ],
            };
          }),
          epics: (epics || []).map((e: any) => ({
            name: e.title,
            description: e.description || '',
          })),
          user_stories: (userStories || []).map((s: any) => ({
            epic_name: s.epicTitle,
            story_name: s.storyName,
            user_type: s.userType,
            description: s.description || '',
            acceptance_criteria: s.acceptanceCriteria || [],
            tech_notes: s.techNotes || [],
            test_cases: s.testCases || [],
          })),
          nfrs: (nonFunctionals || []).map((n: any) => ({
            category: n.category,
            description: n.description,
          })),
        };

        await projectApi.saveRequirements(projectId, payload, token);

        if (userJourney && userJourney.trim()) {
          try {
            await journeysApi.createJourney(
              {
                name: `${projectName || 'Project'} — Main User Journey`,
                description: userJourney,
                project_id: projectId,
                steps: (userJourneySteps || []).map((step: any, index: number) => ({
                  step_order: index + 1,
                  title: step.title,
                  description: step.description,
                })),
              },
              token
            );
          } catch (journeyErr) {
            console.warn('Gagal menyimpan journey secara terpisah (non-fatal):', journeyErr);
          }
        }

        try {
          await buildApi.generateDefaults(projectId, token);
        } catch (buildErr) {
          console.error('Gagal auto-generate Build defaults (non-fatal):', buildErr);
        }
      } else if (projectType === 'translate') {
        // 🚀 Untuk alur Translate: AI otomatis membedah kode/overview menjadi Stories & Epics
        try {
          const aiReqs = await projectApi.generateRequirements(projectId, token);
          const payload = {
            user_types: (aiReqs.user_types || []).map((ut: any) => ({
              name: ut.name,
              description: ut.description || '',
              personas: (ut.personas || []).map((p: any) => ({
                name: p.name || 'Persona',
                age: p.age || 25,
                location: p.location || '-',
                family_status: p.family_status || '-',
                job_title: p.job_title || '-',
                about: p.about || '-',
                goals: p.goals || '-',
                frustrations: p.frustrations || '-',
              })),
            })),
            epics: (aiReqs.epics || []).map((e: any) => ({
              name: e.name,
              description: e.description || '',
            })),
            user_stories: (aiReqs.user_stories || []).map((s: any) => ({
              epic_name: s.epic_name,
              story_name: s.story_name,
              user_type: s.user_type,
              description: s.description || '',
              acceptance_criteria: s.acceptance_criteria || [],
              tech_notes: s.tech_notes || [],
              test_cases: s.test_cases || [],
            })),
            nfrs: (aiReqs.nfrs || []).map((n: any) => ({
              category: n.category,
              description: n.description,
            })),
          };
          await projectApi.saveRequirements(projectId, payload, token);
        } catch (genErr) {
          console.error("Auto generate requirements for translate error:", genErr);
        }

        try {
          await buildApi.generateDefaults(projectId, token);
        } catch (buildErr) {
          console.error('Gagal auto-generate Build defaults (non-fatal):', buildErr);
        }
      }

      localStorage.setItem('active_project_id', String(projectId));
      resetStore();
      router.push(`/stories?project_id=${projectId}`);

    } catch (error: any) {
      console.error('Gagal menyimpan project setup:', error);
      const errMsg = error?.message || '';
      if (errMsg.includes('Failed to fetch') || errMsg.includes('NetworkError') || errMsg.includes('Load failed')) {
        alert('Gagal terhubung ke server backend. Jika testing di lokal, pastikan server FastAPI (port 8000) sudah aktif. Jika di production, pastikan layanan backend sudah aktif.');
      } else {
        alert(errMsg || 'Terjadi kesalahan saat menyimpan data.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-blue-600 flex items-center justify-center p-6 relative">

      {isSeedingExample && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center text-white font-medium">
          Menyiapkan project kamu...
        </div>
      )}

      <div className="absolute top-6 right-6 flex items-center gap-3 z-40">
        <button
          type="button"
          onClick={handleBackToDashboard}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-blue-100 hover:text-white text-xs font-medium backdrop-blur-md border border-white/20 transition-all cursor-pointer shadow-sm"
          title="Batal dan kembali ke dashboard"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Dashboard</span>
        </button>

        <button
          type="button"
          onClick={handleSkip}
          disabled={isSkipping}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-blue-100 hover:text-white text-xs font-medium backdrop-blur-md border border-white/20 transition-all cursor-pointer shadow-sm disabled:opacity-50"
          title="Lewati setup dan langsung ke workspace"
        >
          {isSkipping ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <FastForward className="w-3.5 h-3.5" />
          )}
          <span>Skip Setup</span>
        </button>

        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-100 hover:text-white text-xs font-medium backdrop-blur-md border border-red-300/30 transition-all cursor-pointer shadow-sm"
          title="Keluar dari akun"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Logout</span>
        </button>
      </div>

      {!mounted ? (
        <div className="flex items-center justify-center w-full h-64">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
      ) : (
        <>
          {step === 1 && (
            <Suspense fallback={<div className="flex items-center justify-center w-full h-64"><Loader2 className="w-6 h-6 text-white animate-spin" /></div>}>
              <TeamName />
            </Suspense>
          )}

          {(step === 2 || (step > 2 && !projectType)) && <ProjectType />}

          {projectType === 'generate' && (
            <>
              {step === 3 && <AiIntro />}
              {step === 4 && <NameProject />}
              {step === 5 && <DescribeProject />}
              {step === 6 && <UserTypes />}
              {step === 7 && <UserTypeGoals />}
              {step === 8 && <EpicsList />}
              {step === 9 && <UserStoriesList />}
              {step === 10 && <NonFunctionalList />}
              {step === 11 && <UserJourney onFinishProject={handleFinishWizard} />}
            </>
          )}

          {projectType === 'translate' && (
            <>
              {step === 3 && <SoftwareIntro />}
              {step === 4 && <SoftwareName />}
              {step === 5 && <SoftwareOverview />}
              {step === 6 && <SoftwareScale />}
              {step === 7 && <SoftwareDetails />}
              {step === 8 && <SoftwareTechnologies />}
              {step === 9 && <UserJourney onFinishProject={handleFinishWizard} />}
            </>
          )}

          {projectType === 'example' && (
            <>
              {step === 4 && <UserJourney onFinishProject={handleFinishWizard} />}
            </>
          )}
        </>
      )}
    </main>
  );
}