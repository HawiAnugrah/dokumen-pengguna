// features/common/components/AppSidebar.tsx
'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import LogoUserdoc from '@/public/logoUserDoc';
import { FileText, Users, Map, Code, Settings, HelpCircle, GitGraph } from 'lucide-react';
import { getStoredProjectId } from '@/lib/project-context';

interface AppSidebarProps {
  activeMenu: 'stories' | 'graph' | 'users' | 'journeys' | 'build' | 'settings' | 'knowledge';
  projectId?: string | number | null;
}

export default function AppSidebar({ activeMenu, projectId }: AppSidebarProps) {
  const searchParams = useSearchParams();
  const searchProjectId = searchParams.get('project_id');
  const storedProjectId = getStoredProjectId();

  // Fallback berlapis supaya jika prop projectId dari halaman Journeys kosong,
  // komponen tetap dapat mengambil ID dari URL searchParams atau localStorage context.
  const activeProjectId = projectId || searchProjectId || storedProjectId;

  const getButtonStyle = (menuName: string) => {
    const isActive = activeMenu === menuName;
    if (isActive) {
      return "flex flex-col items-center justify-center p-2 rounded-xl bg-blue-50 text-blue-600 transition-colors w-full";
    }
    return "flex flex-col items-center justify-center p-2 rounded-xl hover:bg-blue-600/60 hover:text-white transition-colors w-full text-slate-200";
  };

  // Tempel query ?project_id=... ke path kalau activeProjectId tersedia.
  const withProject = (path: string) => (activeProjectId ? `${path}?project_id=${activeProjectId}` : path);

  return (
    <div className="w-20 bg-blue-500 border-r border-blue-400 flex flex-col items-center py-4 gap-6 z-10 shrink-0">
      <LogoUserdoc />

      <div className="flex flex-col gap-7 w-full px-2">
        <Link href={withProject('/stories')} className={getButtonStyle('stories')}>
          <FileText className="w-5 h-5 mb-1" />
          <span className="text-[9px] font-medium leading-tight">Stories</span>
        </Link>

        <Link href={withProject('/graph')} className={getButtonStyle('graph')}>
          <GitGraph className="w-5 h-5 mb-1" />
          <span className="text-[9px] font-medium leading-tight">Graph</span>
        </Link>

        <Link href={withProject('/users')} className={getButtonStyle('users')}>
          <Users className="w-5 h-5 mb-1" />
          <span className="text-[9px] font-medium leading-tight text-center">User Types</span>
        </Link>

        <Link href={withProject('/journeys')} className={getButtonStyle('journeys')}>
          <Map className="w-5 h-5 mb-1" />
          <span className="text-[9px] font-medium leading-tight text-center">Journeys</span>
        </Link>

        <Link href={withProject('/build')} className={getButtonStyle('build')}>
          <Code className="w-5 h-5 mb-1" />
          <span className="text-[9px] font-medium leading-tight text-center">Build</span>
        </Link>

        {/* Settings sekarang ikut menggunakan activeProjectId yang konsisten */}
        <Link href={withProject('/settings')} className={getButtonStyle('settings')}>
          <Settings className="w-5 h-5 mb-1" />
          <span className="text-[9px] font-medium leading-tight">Settings</span>
        </Link>

        {/* Knowledge Base */}
        <Link href={withProject('/knowledge')} className={getButtonStyle('knowledge')}>
          <HelpCircle className="w-5 h-5 mb-1" />
          <span className="text-[9px] font-medium leading-tight text-center">Knowledge Base</span>
        </Link>
      </div>
    </div>
  );
}