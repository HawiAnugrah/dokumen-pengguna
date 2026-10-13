'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import useSWR from 'swr';
import { useSearchParams, useRouter } from 'next/navigation';
import AppSidebar from '@/features/common/components/AppSidebar';
import AccountMenu from '@/features/common/components/accountMenu';
import { fetchEpics, fetchStories, fetchNFRs } from '@/services/storiesApi';
import { projectApi } from '@/services/projectsApi';
import { getAuthToken } from '@/lib/auth';
import ProjectMenuDropdown from '@/features/stories/components/ProjectMenuDropdown';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCcw,
  Loader2,
  Shield,
  ExternalLink,
  GitGraph,
  Sparkles,
  Download,
  MessageSquare,
  ChevronRight,
  ChevronDown,
  X,
  GripVertical,
} from 'lucide-react';

interface EpicNode {
  id: number;
  name: string;
  description?: string;
}

interface StoryNode {
  id: number;
  epic_id?: number | null;
  code?: string;
  name?: string;
  as_a?: string;
  i_want?: string;
  so_that?: string;
  role?: string;
  action?: string;
  benefit?: string;
  status?: string;
  acceptance_criteria?: any[];
}

interface NfrNode {
  id: number;
  category: string;
  description: string;
}

type Pos = { x: number; y: number };
type Size = { width: number; height: number };

const EPIC_PALETTE = [
  { bg: 'bg-blue-50/60', border: 'border-blue-200', text: 'text-blue-700', badgeBg: 'bg-blue-100', dot: '#2563eb' },
  { bg: 'bg-emerald-50/60', border: 'border-emerald-200', text: 'text-emerald-700', badgeBg: 'bg-emerald-100', dot: '#059669' },
  { bg: 'bg-rose-50/60', border: 'border-rose-200', text: 'text-rose-700', badgeBg: 'bg-rose-100', dot: '#e11d48' },
  { bg: 'bg-amber-50/60', border: 'border-amber-200', text: 'text-amber-700', badgeBg: 'bg-amber-100', dot: '#d97706' },
  { bg: 'bg-violet-50/60', border: 'border-violet-200', text: 'text-violet-700', badgeBg: 'bg-violet-100', dot: '#7c3aed' },
  { bg: 'bg-cyan-50/60', border: 'border-cyan-200', text: 'text-cyan-700', badgeBg: 'bg-cyan-100', dot: '#0891b2' },
  { bg: 'bg-orange-50/60', border: 'border-orange-200', text: 'text-orange-700', badgeBg: 'bg-orange-100', dot: '#ea580c' },
];

const STATUS_PILL: Record<string, string> = {
  Approved: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  Review: 'bg-amber-50 text-amber-700 border border-amber-200',
};

const CARD_WIDTH = 300;
const HUB_KEY = 'hub';
const NFR_KEY = 'nfr';

// Lay cards out in a shortest-column-first pattern, similar in spirit to the mockup's
// masonry columns, but every card gets its own independent (x, y) that can then be dragged.
function buildInitialPositions(epics: EpicNode[], stories: StoryNode[], nfrs: NfrNode[]): Record<string, Pos> {
  const COLS = 4;
  const START_X = 300;
  const GAP_X = 28;
  const GAP_Y = 24;
  const colY = Array(COLS).fill(20);
  const positions: Record<string, Pos> = { [HUB_KEY]: { x: 20, y: 20 } };

  epics.forEach((epic) => {
    const storyCount = stories.filter((s) => s.epic_id === epic.id).length;
    const estHeight = 84 + Math.ceil(storyCount / 2) * 64 + (epic.description ? 24 : 0);
    let col = 0;
    for (let c = 1; c < COLS; c++) if (colY[c] < colY[col]) col = c;
    positions[`epic-${epic.id}`] = { x: START_X + col * (CARD_WIDTH + GAP_X), y: colY[col] };
    colY[col] += estHeight + GAP_Y;
  });

  if (nfrs.length > 0) {
    let col = 0;
    for (let c = 1; c < COLS; c++) if (colY[c] < colY[col]) col = c;
    positions[NFR_KEY] = { x: START_X + col * (CARD_WIDTH + GAP_X), y: colY[col] };
  }

  return positions;
}

function GraphPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = searchParams.get('project_id');
  const [mounted, setMounted] = useState(false);
  const token = typeof window !== 'undefined' ? getAuthToken() : null;
  const [zoom, setZoom] = useState(1);
  const [selectedNode, setSelectedNode] = useState<StoryNode | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showNFR, setShowNFR] = useState(true);
  const [showStories, setShowStories] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Free-form positions & measured sizes for every draggable node (hub / epics / nfr cluster)
  const [positions, setPositions] = useState<Record<string, Pos>>({});
  const [sizes, setSizes] = useState<Record<string, Size>>({});

  const wrapperRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const roRef = useRef<ResizeObserver | null>(null);

  const dragRef = useRef<{ key: string; startX: number; startY: number; origin: Pos } | null>(null);
  const panRef = useRef<{ startX: number; startY: number; scrollLeft: number; scrollTop: number } | null>(null);

  // 🚀 SWR Cache: Data Graph langsung tampil seketika (0 detik)
  const { data: cacheData, error: swrError, isLoading } = useSWR(
    mounted && projectId && token ? [`graph-data`, projectId, token] : null,
    async ([, projId, tok]: [string, string, string]) => {
      const [epicsData, storiesData, nfrsData, projData] = await Promise.all([
        fetchEpics(Number(projId), tok).catch(() => []),
        fetchStories(Number(projId), tok).catch(() => []),
        fetchNFRs(Number(projId), tok).catch(() => []),
        projectApi.getProjectById(Number(projId), tok).catch(() => null),
      ]);
      return {
        epics: (epicsData || []) as EpicNode[],
        stories: (storiesData || []) as StoryNode[],
        nfrs: (nfrsData || []) as NfrNode[],
        project: projData,
      };
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 10000,
    }
  );

  const epics = cacheData?.epics || [];
  const stories = cacheData?.stories || [];
  const nfrs = cacheData?.nfrs || [];
  const projectName = cacheData?.project?.name || 'Project';
  const projectWorkspaceId = cacheData?.project?.workspace_id || null;
  const loadError = swrError ? (swrError.message || 'Gagal memuat data diagram graph.') : '';

  useEffect(() => {
    if (cacheData) {
      setPositions((prev) =>
        Object.keys(prev).length > 0 ? prev : buildInitialPositions(cacheData.epics, cacheData.stories, cacheData.nfrs)
      );
    }
  }, [cacheData]);

  // One shared ResizeObserver measures every registered node's real rendered size,
  // so connector lines can be derived purely from state (position + size) instead of re-querying the DOM.
  useEffect(() => {
    roRef.current = new ResizeObserver((entries) => {
      setSizes((prev) => {
        const next = { ...prev };
        entries.forEach((entry) => {
          const key = (entry.target as HTMLElement).dataset.nodeKey;
          if (key) next[key] = { width: entry.contentRect.width, height: entry.contentRect.height };
        });
        return next;
      });
    });
    return () => roRef.current?.disconnect();
  }, []);

  const registerNode = useCallback(
    (key: string) => (el: HTMLDivElement | null) => {
      if (!el) return;
      el.dataset.nodeKey = key;
      roRef.current?.observe(el);
    },
    []
  );

  // ---- Node dragging ----
  const startDrag = (key: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const origin = positions[key] || { x: 0, y: 0 };
    dragRef.current = { key, startX: e.clientX, startY: e.clientY, origin };
    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const { key, startX, startY, origin } = dragRef.current;
      const dx = (e.clientX - startX) / zoom;
      const dy = (e.clientY - startY) / zoom;
      setPositions((prev) => ({ ...prev, [key]: { x: origin.x + dx, y: origin.y + dy } }));
    };
    const onUp = () => {
      dragRef.current = null;
      document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [zoom]);

  // ---- Canvas panning (drag empty space) ----
  const onCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target !== e.currentTarget) return; // only pan when clicking empty canvas, not a card
    const el = scrollRef.current;
    if (!el) return;
    panRef.current = { startX: e.clientX, startY: e.clientY, scrollLeft: el.scrollLeft, scrollTop: el.scrollTop };
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!panRef.current || !scrollRef.current) return;
      const { startX, startY, scrollLeft, scrollTop } = panRef.current;
      scrollRef.current.scrollLeft = scrollLeft - (e.clientX - startX);
      scrollRef.current.scrollTop = scrollTop - (e.clientY - startY);
    };
    const onUp = () => {
      panRef.current = null;
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      wrapperRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const resetView = () => {
    setZoom(1);
    setSelectedNode(null);
    setPositions(buildInitialPositions(epics, stories, nfrs));
  };

  const handleExport = () => {
    const payload = { project: projectName, epics, stories, nfrs };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', `${projectName || 'project'}-graph.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const hasArtifacts = epics.length > 0 || stories.length > 0 || nfrs.length > 0;
  const totalRequirements = stories.length + nfrs.length;

  const hubPos = positions[HUB_KEY] || { x: 20, y: 20 };
  const hubSize = sizes[HUB_KEY] || { width: 224, height: 70 };
  const hubAnchor = { x: hubPos.x + hubSize.width, y: hubPos.y + hubSize.height / 2 };

  const connectors: { key: string; x1: number; y1: number; x2: number; y2: number; color: string }[] = [];
  epics.forEach((epic, idx) => {
    const key = `epic-${epic.id}`;
    const p = positions[key];
    if (!p) return;
    const s = sizes[key] || { width: CARD_WIDTH, height: 100 };
    connectors.push({
      key,
      x1: hubAnchor.x,
      y1: hubAnchor.y,
      x2: p.x,
      y2: p.y + Math.min(s.height, 56) / 2,
      color: EPIC_PALETTE[idx % EPIC_PALETTE.length].dot,
    });
  });
  if (showNFR && nfrs.length > 0 && positions[NFR_KEY]) {
    const p = positions[NFR_KEY];
    const s = sizes[NFR_KEY] || { width: CARD_WIDTH, height: 100 };
    connectors.push({ key: NFR_KEY, x1: hubAnchor.x, y1: hubAnchor.y, x2: p.x, y2: p.y + Math.min(s.height, 56) / 2, color: '#059669' });
  }

  const allPositions = Object.values(positions);
  const canvasWidth = Math.max(1400, ...allPositions.map((p) => p.x + CARD_WIDTH + 60));
  const canvasHeight = Math.max(900, ...allPositions.map((p) => p.y + 300));

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50 font-sans">
      {/* 🚀 AppSidebar SELALU Tampil di Layar Secara Konsisten */}
      <AppSidebar activeMenu="graph" projectId={projectId} />

      {!mounted || isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-white">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-xs text-gray-500 font-medium mt-3">Rendering Software Definition Graph...</p>
        </div>
      ) : loadError ? (
        <div className="flex-1 flex items-center justify-center bg-gray-50 p-6">
          <div className="bg-white border border-red-200 rounded-2xl p-6 text-center max-w-md shadow-sm">
            <p className="text-red-600 text-sm mb-4 font-semibold">{loadError}</p>
            <button
              onClick={() => router.push('/workspace')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl"
            >
              Kembali ke Workspace
            </button>
          </div>
        </div>
      ) : (
        <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b border-gray-200 px-6 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2">
            <ProjectMenuDropdown
              workspaceId={projectWorkspaceId}
              activeProjectId={projectId}
              renderTrigger={({ onClick, isOpen, triggerRef }) => (
                <button
                  ref={triggerRef}
                  type="button"
                  onClick={onClick}
                  className="flex items-center gap-1.5 text-xs font-bold text-gray-800 hover:text-blue-600 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer group"
                >
                  <span>{projectName || 'Untitled Project'}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-gray-400 group-hover:text-blue-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
              )}
            />
            <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
            <GitGraph className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-semibold text-gray-800">Software Definition Graph</span>
            <span className="ml-2 text-xs text-gray-400">
              {epics.length} epics • {totalRequirements} requirements
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl text-xs">
              <button
                onClick={() => setShowStories((v) => !v)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  showStories ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Stories ({stories.length})
              </button>
              <button
                onClick={() => setShowNFR((v) => !v)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  showNFR ? 'bg-amber-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                NFR ({nfrs.length})
              </button>
            </div>

            <button
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 border border-gray-200 hover:bg-gray-50 rounded-lg text-xs font-medium text-gray-600 transition-colors cursor-pointer"
              title="Chat to Userdoc Assistant"
            >
              <MessageSquare className="w-3.5 h-3.5" /> Chat to Userdoc Assistant
            </button>

            <button
              onClick={handleExport}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 cursor-pointer text-gray-500"
              title="Export graph as JSON"
            >
              <Download className="w-4 h-4" />
            </button>

            <AccountMenu currentWorkspaceId={projectWorkspaceId} />
          </div>
        </header>

        <div ref={wrapperRef} className="flex-1 relative overflow-hidden bg-gray-50">
          <div className="absolute top-4 right-6 z-30 flex items-center gap-1 bg-white p-1.5 rounded-2xl border border-gray-200 shadow-sm text-gray-500">
            <button onClick={() => setZoom((p) => Math.min(p + 0.1, 1.6))} className="p-2 hover:bg-gray-100 hover:text-gray-800 rounded-xl transition-colors cursor-pointer" title="Zoom In">
              <ZoomIn className="w-4 h-4" />
            </button>
            <button onClick={() => setZoom((p) => Math.max(p - 0.1, 0.6))} className="p-2 hover:bg-gray-100 hover:text-gray-800 rounded-xl transition-colors cursor-pointer" title="Zoom Out">
              <ZoomOut className="w-4 h-4" />
            </button>
            <div className="w-[1px] h-4 bg-gray-200 mx-0.5" />
            <span className="text-[11px] font-mono font-semibold px-1.5 min-w-[38px] text-center text-gray-400">
              {Math.round(zoom * 100)}%
            </span>
            <div className="w-[1px] h-4 bg-gray-200 mx-0.5" />
            <button onClick={resetView} className="p-2 hover:bg-gray-100 hover:text-gray-800 rounded-xl transition-colors cursor-pointer" title="Reset Layout & View">
              <RotateCcw className="w-4 h-4" />
            </button>
            <button onClick={toggleFullscreen} className="p-2 hover:bg-gray-100 hover:text-gray-800 rounded-xl transition-colors cursor-pointer" title="Fullscreen">
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>

          {!hasArtifacts ? (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center">
              <div className="w-16 h-16 rounded-3xl bg-white border border-gray-200 flex items-center justify-center text-gray-300 mb-4 shadow-sm">
                <GitGraph className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Belum Ada Artefak Requirement</h3>
              <p className="text-xs text-gray-500 max-w-sm mb-6 leading-relaxed">
                Tambahkan Epics, User Stories, atau jalankan AI generator di halaman Stories untuk melihat visualisasi diagram node graph.
              </p>
              <button
                onClick={() => router.push(`/stories?project_id=${projectId}`)}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors cursor-pointer"
              >
                Buka Halaman Stories
              </button>
            </div>
          ) : (
            <div
              ref={scrollRef}
              onMouseDown={onCanvasMouseDown}
              className="h-full overflow-auto cursor-grab active:cursor-grabbing"
              style={{
                backgroundImage: `radial-gradient(circle, rgba(0,0,0,0.06) 1px, transparent 1px)`,
                backgroundSize: `${22 * zoom}px ${22 * zoom}px`,
              }}
            >
              <div
                className="relative origin-top-left"
                style={{ width: canvasWidth, height: canvasHeight, transform: `scale(${zoom})` }}
              >
                <svg className="absolute inset-0 pointer-events-none" width={canvasWidth} height={canvasHeight} style={{ zIndex: 0 }}>
                  {connectors.map((c) => (
                    <path
                      key={c.key}
                      d={`M ${c.x1} ${c.y1} C ${c.x1 + 50} ${c.y1}, ${c.x2 - 50} ${c.y2}, ${c.x2} ${c.y2}`}
                      stroke={c.color}
                      strokeWidth={1.5}
                      strokeDasharray="5 5"
                      fill="none"
                      opacity={0.45}
                    />
                  ))}
                </svg>

                {/* Root hub node — draggable like everything else */}
                <div
                  ref={registerNode(HUB_KEY)}
                  className="absolute z-10 p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg flex items-center gap-3 w-56 cursor-grab active:cursor-grabbing select-none"
                  style={{ left: hubPos.x, top: hubPos.y }}
                  onMouseDown={startDrag(HUB_KEY)}
                >
                  <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4.5 h-4.5 text-yellow-300" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-blue-200">Root System</span>
                    <h2 className="text-sm font-bold leading-tight">{projectName || 'Project'}</h2>
                    <span className="text-[10px] text-blue-200/90">{epics.length} Epics • {stories.length} Stories</span>
                  </div>
                </div>

                {epics.map((epic, epicIdx) => {
                  const key = `epic-${epic.id}`;
                  const pos = positions[key];
                  if (!pos) return null;
                  const epicStories = stories.filter((s) => s.epic_id === epic.id);
                  const palette = EPIC_PALETTE[epicIdx % EPIC_PALETTE.length];
                  return (
                    <div
                      key={epic.id}
                      ref={registerNode(key)}
                      className="absolute z-10 rounded-2xl bg-white border border-gray-200 shadow-sm flex flex-col select-none"
                      style={{ left: pos.x, top: pos.y, width: CARD_WIDTH }}
                    >
                      <div
                        className="flex items-start justify-between gap-2 p-4 pb-3 cursor-grab active:cursor-grabbing"
                        onMouseDown={startDrag(key)}
                      >
                        <div className="flex items-start gap-1.5">
                          <GripVertical className="w-3.5 h-3.5 text-gray-300 mt-0.5 shrink-0" />
                          <h3 className="text-sm font-bold text-gray-900 leading-tight">{epic.name}</h3>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className="text-[9px] text-gray-400 whitespace-nowrap">{epicStories.length} requirements</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${palette.badgeBg} ${palette.text}`}>EPIC</span>
                        </div>
                      </div>

                      <div className="px-4 pb-4 flex flex-col gap-3">
                        {epic.description && (
                          <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">{epic.description}</p>
                        )}

                        {showStories && epicStories.length > 0 && (
                          <div className="grid grid-cols-2 gap-2">
                            {epicStories.map((story) => {
                              const isSelected = selectedNode?.id === story.id;
                              return (
                                <button
                                  key={story.id}
                                  onMouseDown={(e) => e.stopPropagation()}
                                  onClick={() => setSelectedNode(isSelected ? null : story)}
                                  className={`text-left p-2.5 rounded-lg border transition-all cursor-pointer ${
                                    isSelected
                                      ? 'bg-blue-50 border-blue-300 shadow-sm'
                                      : `${palette.bg} ${palette.border} hover:border-gray-300`
                                  }`}
                                >
                                  <p className="text-[11px] font-semibold text-gray-800 leading-snug line-clamp-2">
                                    {story.i_want || story.name || story.code || `Story #${story.id}`}
                                  </p>
                                  <div className="flex items-center justify-between mt-1.5">
                                    <span className="text-[9px] font-mono text-gray-400">{story.code || `#${story.id}`}</span>
                                    {story.status && (
                                      <span className={`text-[8px] font-semibold px-1.5 py-0.5 rounded-full ${STATUS_PILL[story.status] || 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
                                        {story.status}
                                      </span>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {showNFR && nfrs.length > 0 && positions[NFR_KEY] && (
                  <div
                    ref={registerNode(NFR_KEY)}
                    className="absolute z-10 rounded-2xl bg-white border border-emerald-200 shadow-sm flex flex-col select-none"
                    style={{ left: positions[NFR_KEY].x, top: positions[NFR_KEY].y, width: CARD_WIDTH }}
                  >
                    <div
                      className="flex items-start justify-between gap-2 p-4 pb-3 cursor-grab active:cursor-grabbing"
                      onMouseDown={startDrag(NFR_KEY)}
                    >
                      <div className="flex items-start gap-1.5">
                        <GripVertical className="w-3.5 h-3.5 text-gray-300 mt-0.5 shrink-0" />
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                            <Shield className="w-3.5 h-3.5" />
                          </div>
                          <h3 className="text-sm font-bold text-gray-900 leading-tight">Non-Functional Requirements</h3>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-[9px] text-gray-400 whitespace-nowrap">{nfrs.length} requirements</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">EPIC</span>
                      </div>
                    </div>

                    <div className="px-4 pb-4 grid grid-cols-2 gap-2">
                      {nfrs.map((nfr) => (
                        <div key={nfr.id} className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-100">
                          <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider block mb-0.5">{nfr.category}</span>
                          <p className="text-[11px] text-gray-600 leading-snug line-clamp-2">{nfr.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {selectedNode && (
            <div className="absolute bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-96 z-40 bg-white border border-gray-200 rounded-2xl p-5 shadow-xl">
              <div className="flex items-start justify-between pb-3 border-b border-gray-100">
                <div>
                  <span className="text-[10px] font-mono font-bold text-blue-600">{selectedNode.code || `#ST-${selectedNode.id}`}</span>
                  <h3 className="text-sm font-bold text-gray-900 mt-0.5">{selectedNode.i_want || selectedNode.name || 'User Story'}</h3>
                </div>
                <button onClick={() => setSelectedNode(null)} className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="py-3 space-y-3 text-xs">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-gray-200 space-y-2 text-gray-800">
                  <p className="leading-relaxed"><strong className="text-gray-900 font-semibold">As a:</strong> <span className="text-gray-700 font-medium">{selectedNode.as_a || selectedNode.role || '-'}</span></p>
                  <p className="leading-relaxed"><strong className="text-gray-900 font-semibold">I want:</strong> <span className="text-gray-700 font-medium">{selectedNode.i_want || selectedNode.action || '-'}</span></p>
                  <p className="leading-relaxed"><strong className="text-gray-900 font-semibold">So that:</strong> <span className="text-gray-700 font-medium">{selectedNode.so_that || selectedNode.benefit || '-'}</span></p>
                </div>

                {selectedNode.acceptance_criteria && selectedNode.acceptance_criteria.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider block mb-1.5">
                      Acceptance Criteria ({selectedNode.acceptance_criteria.length})
                    </span>
                    <ul className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {selectedNode.acceptance_criteria.map((ac: any, i: number) => {
                        const text = typeof ac === 'string' ? ac : ac.description || ac.text || ac.criteria;
                        return (
                          <li key={i} className="text-[11px] text-gray-800 bg-gray-50 p-2 rounded-lg border border-gray-200 leading-normal">
                            • {text || '-'}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>

            <button
              onClick={() => router.push(`/stories?project_id=${projectId}`)}
              className="w-full mt-2 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm hover:shadow"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Buka di Stories Editor
            </button>
          </div>
        )}
        </div>
      </main>
      )}
    </div>
  );
}

export default function GraphPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      }
    >
      <GraphPageContent />
    </Suspense>
  );
}