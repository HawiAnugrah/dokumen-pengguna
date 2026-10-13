'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { UserStory, TestCase, StoryImage, Comment, LinkedStory } from '../types';
import {
  Code,
  History,
  BookOpen,
  FileText,
  Map,
  Trash2,
  Edit3,
  Sparkles,
  Plus,
  Loader2,
  Image as ImageIcon,
  X,
  Upload,
  Link as LinkIcon,
  MessageSquare,
  Send,
  Tag,
} from 'lucide-react';
import {
  suggestStoryWithAi,
  fetchStoryComments,
  createStoryComment,
  fetchStoryLinks,
  createStoryLink,
  deleteStoryLink,
  generateStoryLinksForStory,
  getJourneysLinkedFromStory, 
} from '@/services/storiesApi';
import { getAuthToken } from '@/lib/auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function resolveImageUrl(url: string) {
  return url.startsWith('http') ? url : `${API_BASE}${url}`;
}

interface ManualStoryDetailPanelProps {
  story: UserStory;
  onDelete?: () => void;
  onUpdate?: (updated: UserStory) => void;
  onImagesUpdated?: (storyId: number | string, rawImages: any[]) => void;
  allStories?: UserStory[];
  projectId?: string | null;
}

// Helper: bikin id sementara di client sebelum backend kasih id asli.
function makeTempId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function toRawImage(img: StoryImage) {
  return { id: img.id, url: img.url, caption: img.caption, created_at: img.createdAt };
}

function fromRawImage(raw: any): StoryImage {
  return { id: raw.id, url: raw.url, caption: raw.caption, createdAt: raw.created_at };
}

function formatRelativeTime(isoString: string): string {
  const hasTz = /Z$|[+-]\d{2}:\d{2}$/.test(isoString);
  const date = new Date(hasTz ? isoString : `${isoString}Z`);

  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Baru saja';
  if (diffMin < 60) return `${diffMin} menit lalu`;
  if (diffHour < 24) return `${diffHour} jam lalu`;
  if (diffDay < 7) return `${diffDay} hari lalu`;
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?';
}

const linkTypeLabel: Record<string, string> = {
  relates_to: 'Relates to',
  blocked_by: 'Blocked by',
};

function mapRawLink(raw: any): LinkedStory {
  return {
    linkId: raw.link_id,
    storyId: raw.story_id,
    code: raw.code,
    iWant: raw.i_want,
    linkType: raw.link_type,
  };
}

function SidebarCard({
  icon: Icon,
  iconBg,
  iconColor,
  title,
  action,
  children,
}: {
  icon: any;
  iconBg: string;
  iconColor: string;
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-gray-200 rounded-xl p-4 space-y-3 shadow-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${iconBg}`}>
            <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
          </div>
          <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">{title}</span>
        </div>
        {action}
      </div>
      <div className="border-t border-gray-100 pt-3">{children}</div>
    </div>
  );
}

export default function ManualStoryDetailPanel({
  story,
  onDelete,
  onUpdate,
  onImagesUpdated,
  allStories,
  projectId,
}: ManualStoryDetailPanelProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'criteria' | 'notes' | 'tests' | 'images' | 'comments'>('criteria');
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState<'draft' | 'review' | 'approved'>('draft');
  const [isRegenerating, setIsRegenerating] = useState(false);

  const [asA, setAsA] = useState(story.as_a);
  const [iWant, setIWant] = useState(story.i_want);
  const [soThat, setSoThat] = useState(story.so_that);

  const [criteriaList, setCriteriaList] = useState<string[]>(story.acceptanceCriteria || []);
  const [newCriterion, setNewCriterion] = useState('');

  const [techNotesList, setTechNotesList] = useState<string[]>(story.techNotes || []);
  const [newTechNote, setNewTechNote] = useState('');

  const [testCasesList, setTestCasesList] = useState<TestCase[]>(story.testCases || []);
  const [newTestAction, setNewTestAction] = useState('');
  const [newTestExpected, setNewTestExpected] = useState('');
  const [isAddingTestCase, setIsAddingTestCase] = useState(false);

  const [imagesList, setImagesList] = useState<StoryImage[]>(story.images || []);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newImageCaption, setNewImageCaption] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isAddingImageUrl, setIsAddingImageUrl] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<StoryImage | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [commentsList, setCommentsList] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [isSendingComment, setIsSendingComment] = useState(false);

  // ===== Labels =====
  const [labelsList, setLabelsList] = useState<string[]>(story.labels || []);
  const [isAddingLabel, setIsAddingLabel] = useState(false);
  const [newLabelInput, setNewLabelInput] = useState('');

  // ===== Linked Stories =====
  const [linkedTo, setLinkedTo] = useState<LinkedStory[]>([]);
  const [linkedFrom, setLinkedFrom] = useState<LinkedStory[]>([]);
  const [isLoadingLinks, setIsLoadingLinks] = useState(false);
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [linkTargetId, setLinkTargetId] = useState<string>('');
  const [linkType, setLinkType] = useState<'relates_to' | 'blocked_by'>('relates_to');
  const [isSavingLink, setIsSavingLink] = useState(false);
  const [isGeneratingLinks, setIsGeneratingLinks] = useState(false);

  const [linkedJourneys, setLinkedJourneys] = useState<
    { journey_id: number; journey_title: string; step_id: number; step_title: string }[]
  >([]);
  const [isLoadingJourneys, setIsLoadingJourneys] = useState(false);

  useEffect(() => {
    setAsA(story.as_a);
    setIWant(story.i_want);
    setSoThat(story.so_that);
    setCriteriaList(story.acceptanceCriteria || []);
    setTechNotesList(story.techNotes || []);
    setTestCasesList(story.testCases || []);
    setImagesList(story.images || []);
    setLabelsList(story.labels || []);
  }, [story]);

  useEffect(() => {
    if (activeTab !== 'comments') return;

    const token = getAuthToken();
    if (!token) return;

    setIsLoadingComments(true);
    fetchStoryComments(story.id, token)
      .then((raw: any[]) => {
        setCommentsList(
          raw.map((c) => ({
            id: c.id,
            content: c.content,
            createdAt: c.created_at,
            user: {
              id: c.user.id,
              username: c.user.username,
              fullName: c.user.full_name,
              avatarUrl: c.user.avatar_url,
            },
          }))
        );
      })
      .catch((err) => {
        console.error('Gagal memuat komentar:', err);
      })
      .finally(() => setIsLoadingComments(false));
  }, [activeTab, story.id]);

  // Fetch linked stories tiap kali pindah story.
  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;

    setIsLoadingLinks(true);
    fetchStoryLinks(story.id, token)
      .then((raw: any) => {
        setLinkedTo((raw.linked_to || []).map(mapRawLink));
        setLinkedFrom((raw.linked_from || []).map(mapRawLink));
      })
      .catch((err) => {
        console.error('Gagal memuat linked stories:', err);
      })
      .finally(() => setIsLoadingLinks(false));

    // Reset form nambah link tiap ganti story.
    setIsAddingLink(false);
    setLinkTargetId('');
    setLinkType('relates_to');
  }, [story.id]);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;

    setIsLoadingJourneys(true);
    getJourneysLinkedFromStory(story.id, token)
      .then((raw: any[]) => {
        setLinkedJourneys(raw || []);
      })
      .catch((err) => {
        console.error('Gagal memuat journeys yang terhubung:', err);
      })
      .finally(() => setIsLoadingJourneys(false));
  }, [story.id]);

  const handleAiRegenerate = async () => {
    const token = getAuthToken();
    if (!token) {
      alert('Sesi login habis, silakan login kembali.');
      return;
    }

    setIsRegenerating(true);
    try {
      const result = await suggestStoryWithAi(
        {
          as_a: asA,
          i_want: iWant,
          so_that: soThat,
        },
        token
      );

      setAsA(result.as_a);
      setIWant(result.i_want);
      setSoThat(result.so_that);
      setCriteriaList(result.acceptance_criteria || []);
      setTechNotesList(result.tech_notes || []);

      const normalizedTestCases: TestCase[] = (result.test_cases || []).map((tc: any) =>
        typeof tc === 'string'
          ? { id: makeTempId(), action: tc, expectedResult: '' }
          : {
              id: tc.id ?? makeTempId(),
              action: tc.action ?? '',
              expectedResult: tc.expectedResult ?? tc.expected_result ?? '',
            }
      );
      setTestCasesList(normalizedTestCases);

      if (onUpdate) {
        onUpdate({
          ...story,
          as_a: result.as_a,
          i_want: result.i_want,
          so_that: result.so_that,
          acceptanceCriteria: result.acceptance_criteria,
          techNotes: result.tech_notes,
          testCases: normalizedTestCases,
        });
      }
    } catch (err: any) {
      console.error('Error AI regenerate:', err);
      alert(err.message || 'Gagal generate story dengan AI');
    } finally {
      setIsRegenerating(false);
    }
  };

  const statusConfig = {
    draft: { label: 'Draft', bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' },
    review: { label: 'In Review', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    approved: { label: 'Approved', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  };

  const handleSaveEdit = () => {
    if (onUpdate) {
      onUpdate({
        ...story,
        as_a: asA,
        i_want: iWant,
        so_that: soThat,
      });
    }
    setIsEditing(false);
  };

  const handleAddCriterion = () => {
    if (!newCriterion.trim()) return;
    const updated = [...criteriaList, newCriterion.trim()];
    setCriteriaList(updated);
    setNewCriterion('');
    if (onUpdate) {
      onUpdate({ ...story, acceptanceCriteria: updated });
    }
  };

  const handleDeleteCriterion = (indexToRemove: number) => {
    const updated = criteriaList.filter((_, idx) => idx !== indexToRemove);
    setCriteriaList(updated);
    if (onUpdate) {
      onUpdate({ ...story, acceptanceCriteria: updated });
    }
  };

  const handleAddTechNote = () => {
    if (!newTechNote.trim()) return;
    const updated = [...techNotesList, newTechNote.trim()];
    setTechNotesList(updated);
    setNewTechNote('');
    if (onUpdate) {
      onUpdate({ ...story, techNotes: updated });
    }
  };

  const handleDeleteTechNote = (indexToRemove: number) => {
    const updated = techNotesList.filter((_, idx) => idx !== indexToRemove);
    setTechNotesList(updated);
    if (onUpdate) {
      onUpdate({ ...story, techNotes: updated });
    }
  };

  const handleAddTestCase = () => {
    if (!newTestAction.trim() && !newTestExpected.trim()) return;
    const updated: TestCase[] = [
      ...testCasesList,
      {
        id: makeTempId(),
        action: newTestAction.trim(),
        expectedResult: newTestExpected.trim(),
      },
    ];
    setTestCasesList(updated);
    setNewTestAction('');
    setNewTestExpected('');
    setIsAddingTestCase(false);
    if (onUpdate) {
      onUpdate({ ...story, testCases: updated });
    }
  };

  const handleCancelAddTestCase = () => {
    setNewTestAction('');
    setNewTestExpected('');
    setIsAddingTestCase(false);
  };

  const handleDeleteTestCase = (indexToRemove: number) => {
    const updated = testCasesList.filter((_, idx) => idx !== indexToRemove);
    setTestCasesList(updated);
    if (onUpdate) {
      onUpdate({ ...story, testCases: updated });
    }
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const token = getAuthToken();
    if (!token) {
      alert('Sesi habis, silakan login kembali.');
      return;
    }

    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (newImageCaption.trim()) formData.append('caption', newImageCaption.trim());

      const response = await fetch(
        `${API_BASE}/api/stories/${story.id}/images/upload`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Gagal upload gambar');
      }

      const created = await response.json();
      const updatedRaw = [...imagesList.map(toRawImage), created];
      setImagesList(updatedRaw.map(fromRawImage));
      setNewImageCaption('');
      if (onImagesUpdated) onImagesUpdated(story.id, updatedRaw);
    } catch (err: any) {
      console.error('Gagal upload gambar:', err);
      alert(err.message || 'Gagal upload gambar.');
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddImageUrl = async () => {
    if (!newImageUrl.trim()) return;

    const token = getAuthToken();
    if (!token) {
      alert('Sesi habis, silakan login kembali.');
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE}/api/stories/${story.id}/images`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            url: newImageUrl.trim(),
            caption: newImageCaption.trim() || null,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Gagal menambah gambar');
      }

      const created = await response.json();
      const updatedRaw = [...imagesList.map(toRawImage), created];
      setImagesList(updatedRaw.map(fromRawImage));
      setNewImageUrl('');
      setNewImageCaption('');
      setIsAddingImageUrl(false);
      if (onImagesUpdated) onImagesUpdated(story.id, updatedRaw);
    } catch (err: any) {
      console.error('Gagal menambah gambar:', err);
      alert(err.message || 'Gagal menambah gambar.');
    }
  };

  const handleDeleteImage = async (image: StoryImage) => {
    if (!confirm('Hapus gambar ini?')) return;

    const token = getAuthToken();
    if (!token) {
      alert('Sesi habis, silakan login kembali.');
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE}/api/stories/images/${image.id}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Gagal menghapus gambar');
      }

      const updatedRaw = imagesList.filter((img) => img.id !== image.id).map(toRawImage);
      setImagesList(updatedRaw.map(fromRawImage));
      if (lightboxImage?.id === image.id) setLightboxImage(null);
      if (onImagesUpdated) onImagesUpdated(story.id, updatedRaw);
    } catch (err: any) {
      console.error('Gagal menghapus gambar:', err);
      alert(err.message || 'Gagal menghapus gambar.');
    }
  };

  const handleSendComment = async () => {
    if (!newCommentText.trim()) return;

    const token = getAuthToken();
    if (!token) {
      alert('Sesi habis, silakan login kembali.');
      return;
    }

    setIsSendingComment(true);
    try {
      const created = await createStoryComment(story.id, newCommentText.trim(), token);
      setCommentsList([
        ...commentsList,
        {
          id: created.id,
          content: created.content,
          createdAt: created.created_at,
          user: {
            id: created.user.id,
            username: created.user.username,
            fullName: created.user.full_name,
            avatarUrl: created.user.avatar_url,
          },
        },
      ]);
      setNewCommentText('');
    } catch (err: any) {
      console.error('Gagal mengirim komentar:', err);
      alert(err.message || 'Gagal mengirim komentar.');
    } finally {
      setIsSendingComment(false);
    }
  };

  // ===== Labels handlers =====
  const handleAddLabel = () => {
    const trimmed = newLabelInput.trim();
    if (!trimmed) {
      setIsAddingLabel(false);
      return;
    }
    if (labelsList.includes(trimmed)) {
      setNewLabelInput('');
      setIsAddingLabel(false);
      return;
    }
    const updated = [...labelsList, trimmed];
    setLabelsList(updated);
    setNewLabelInput('');
    setIsAddingLabel(false);
    if (onUpdate) {
      onUpdate({ ...story, labels: updated });
    }
  };

  const handleRemoveLabel = (indexToRemove: number) => {
    const updated = labelsList.filter((_, idx) => idx !== indexToRemove);
    setLabelsList(updated);
    if (onUpdate) {
      onUpdate({ ...story, labels: updated });
    }
  };

  // ===== Linked stories handlers =====
  const linkableStories = (allStories || []).filter(
    (s) => s.id !== story.id && !linkedTo.some((l) => String(l.storyId) === String(s.id))
  );

  const handleAddLink = async () => {
    if (!linkTargetId) return;

    const token = getAuthToken();
    if (!token) {
      alert('Sesi habis, silakan login kembali.');
      return;
    }

    setIsSavingLink(true);
    try {
      const created = await createStoryLink(story.id, linkTargetId, linkType, token);
      setLinkedTo([...linkedTo, mapRawLink(created)]);
      setLinkTargetId('');
      setLinkType('relates_to');
      setIsAddingLink(false);
    } catch (err: any) {
      console.error('Gagal menambah link:', err);
      alert(err.message || 'Gagal menambah link.');
    } finally {
      setIsSavingLink(false);
    }
  };

  const handleGenerateLinksAi = async () => {
  const token = getAuthToken();
  if (!token) {
    alert('Sesi habis, silakan login kembali.');
    return;
  }

  setIsGeneratingLinks(true);
  try {
    const raw = await generateStoryLinksForStory(story.id, token);
    setLinkedTo((raw.linked_to || []).map(mapRawLink));
    setLinkedFrom((raw.linked_from || []).map(mapRawLink));
  } catch (err: any) {
    console.error('Gagal generate links AI:', err);
    alert(err.message || 'Gagal generate links dengan AI.');
  } finally {
    setIsGeneratingLinks(false);
  }
};

  const handleDeleteLink = async (linkId: number | string, direction: 'to' | 'from') => {
    if (!confirm('Hapus link ini?')) return;

    const token = getAuthToken();
    if (!token) {
      alert('Sesi habis, silakan login kembali.');
      return;
    }

    try {
      await deleteStoryLink(linkId, token);
      if (direction === 'to') {
        setLinkedTo(linkedTo.filter((l) => l.linkId !== linkId));
      } else {
        setLinkedFrom(linkedFrom.filter((l) => l.linkId !== linkId));
      }
    } catch (err: any) {
      console.error('Gagal menghapus link:', err);
      alert(err.message || 'Gagal menghapus link.');
    }
  };

  const handleOpenStoryHelp = () => {
    const params = new URLSearchParams();
    if (projectId) params.set('project_id', projectId);
    params.set('article', 'stories-epics');
    router.push(`/knowledge?${params.toString()}`);
  };

  return (
    <div className="flex-1 bg-gray-50/50 flex overflow-y-auto">
      <div className="flex-1 bg-white p-8 overflow-y-auto border-r border-gray-200">
        <div className="flex items-start justify-between border-b border-gray-100 pb-6 mb-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className={`text-xs font-semibold px-2.5 py-1 rounded-full border cursor-pointer outline-none transition-colors ${statusConfig[status].bg} ${statusConfig[status].text} ${statusConfig[status].border}`}
              >
                <option value="draft">📝 Draft</option>
                <option value="review">⏳ In Review</option>
                <option value="approved">✅ Approved</option>
              </select>

              <span className="text-xs text-gray-400 font-mono font-medium">{story.code}</span>
              <span className="text-xs text-gray-400 font-mono font-medium">v0.1</span>
            </div>

            <h1 className="text-2xl font-bold text-gray-900">
              {story.i_want ? `I want ${story.i_want}` : 'User Story'}
            </h1>

            <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
              {labelsList.map((label, index) => (
                <span
                  key={index}
                  className="group/label flex items-center gap-1 pl-2 pr-1 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-[10px] font-semibold"
                >
                  {label}
                  <button
                    onClick={() => handleRemoveLabel(index)}
                    className="p-0.5 opacity-0 group-hover/label:opacity-100 hover:text-red-600 transition-opacity cursor-pointer"
                    title="Hapus label"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}

              {isAddingLabel ? (
                <input
                  autoFocus
                  type="text"
                  value={newLabelInput}
                  onChange={(e) => setNewLabelInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddLabel();
                    if (e.key === 'Escape') {
                      setIsAddingLabel(false);
                      setNewLabelInput('');
                    }
                  }}
                  onBlur={handleAddLabel}
                  placeholder="Nama label..."
                  className="px-2 py-0.5 text-[10px] bg-white border border-blue-300 rounded-full outline-none w-24 text-gray-700"
                />
              ) : (
                <button
                  onClick={() => setIsAddingLabel(true)}
                  className="flex items-center gap-0.5 px-2 py-0.5 border border-dashed border-gray-300 text-gray-400 hover:text-blue-600 hover:border-blue-300 rounded-full text-[10px] font-semibold transition-colors cursor-pointer"
                >
                  <Tag className="w-2.5 h-2.5" />
                  Label
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleAiRegenerate}
              disabled={isRegenerating}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title="Regenerate with AI"
            >
              {isRegenerating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 text-purple-600 animate-spin" />
                  <span>Thinking...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                </>
              )}
            </button>

            <button
              onClick={() => setIsEditing(!isEditing)}
              className="p-1.5 text-gray-400 hover:text-blue-600 rounded-md transition-colors cursor-pointer border border-transparent hover:border-gray-200"
              title="Edit Story"
            >
              <Edit3 className="w-4 h-4" />
            </button>

            <button
              onClick={onDelete}
              className="p-1.5 text-gray-400 hover:text-red-600 rounded-md transition-colors cursor-pointer border border-transparent hover:border-red-100"
              title="Delete Story"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {isEditing ? (
          <div className="space-y-4 mb-8 bg-blue-50/30 p-4 rounded-xl border border-blue-100">
            <h3 className="text-xs font-bold text-blue-600 uppercase">Edit Manual Story</h3>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">As a...</label>
              <input
                type="text"
                value={asA}
                onChange={(e) => setAsA(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">I want to...</label>
              <input
                type="text"
                value={iWant}
                onChange={(e) => setIWant(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">So that...</label>
              <input
                type="text"
                value={soThat}
                onChange={(e) => setSoThat(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-800"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold cursor-pointer hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 text-sm text-gray-800 mb-8 leading-relaxed">
            <p><strong className="text-gray-900">As a</strong> {story.as_a},</p>
            <p><strong className="text-gray-900">I want to</strong> {story.i_want},</p>
            <p><strong className="text-gray-900">So that</strong> {story.so_that}</p>
          </div>
        )}

        <div className="border-b border-gray-200 mb-6 flex gap-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('criteria')}
            className={`pb-3 transition-colors relative cursor-pointer ${
              activeTab === 'criteria' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            ACCEPTANCE CRITERIA
            {criteriaList.length > 0 && (
              <span className="ml-1.5 text-[10px] text-gray-400 font-normal">({criteriaList.length})</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`pb-3 transition-colors relative cursor-pointer ${
              activeTab === 'notes' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            TECH NOTES
            {techNotesList.length > 0 && (
              <span className="ml-1.5 text-[10px] text-gray-400 font-normal">({techNotesList.length})</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('tests')}
            className={`pb-3 transition-colors relative cursor-pointer ${
              activeTab === 'tests' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            TEST CASES
            {testCasesList.length > 0 && (
              <span className="ml-1.5 text-[10px] text-gray-400 font-normal">({testCasesList.length})</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('images')}
            className={`pb-3 transition-colors relative cursor-pointer ${
              activeTab === 'images' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            IMAGES
            {imagesList.length > 0 && (
              <span className="ml-1.5 text-[10px] text-gray-400 font-normal">({imagesList.length})</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('comments')}
            className={`pb-3 transition-colors relative cursor-pointer ${
              activeTab === 'comments' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            COMMENTS
            {commentsList.length > 0 && (
              <span className="ml-1.5 text-[10px] text-gray-400 font-normal">({commentsList.length})</span>
            )}
          </button>
        </div>

        {activeTab === 'criteria' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Contoh: Given pengguna login, When klik submit, Then data tersimpan"
                value={newCriterion}
                onChange={(e) => setNewCriterion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCriterion()}
                className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                onClick={handleAddCriterion}
                className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {criteriaList.length > 0 ? (
              <ul className="space-y-2">
                {criteriaList.map((ac, index) => (
                  <li
                    key={index}
                    className="flex items-start justify-between gap-3 p-3 bg-gray-50/70 border border-gray-100 rounded-lg hover:border-gray-200 transition-colors group"
                  >
                    <div className="flex items-start gap-2.5">
                      <input
                        type="checkbox"
                        className="mt-0.5 w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="text-xs text-gray-700 leading-relaxed font-mono">
                        {ac}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteCriterion(index)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 transition-opacity cursor-pointer"
                      title="Hapus kriteria"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-4 bg-gray-50 rounded-lg border border-dashed border-gray-200 text-center">
                <p className="text-xs text-gray-500">Belum ada acceptance criteria. Tulis format Given-When-Then di atas lalu klik Tambah.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Tambah catatan arsitektur / database / API endpoint..."
                value={newTechNote}
                onChange={(e) => setNewTechNote(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTechNote()}
                className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                onClick={handleAddTechNote}
                className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {techNotesList.length > 0 ? (
              <ul className="space-y-2.5">
                {techNotesList.map((note, index) => (
                  <li
                    key={index}
                    className="flex items-start justify-between gap-2.5 p-3 bg-blue-50/40 border border-blue-100 rounded-lg group hover:border-blue-200 transition-colors"
                  >
                    <div className="flex items-start gap-2.5">
                      <Code className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                      <span className="text-xs text-gray-700 leading-relaxed font-mono">{note}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteTechNote(index)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 transition-opacity cursor-pointer"
                      title="Hapus tech note"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-4 bg-gray-50 rounded-lg border border-dashed border-gray-200 text-center">
                <p className="text-xs text-gray-500">Belum ada tech notes. Tambahkan arsitektur atau instruksi teknis di atas.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'tests' && (
          <div className="space-y-4">
            {isAddingTestCase ? (
              <div className="space-y-2 p-3 bg-gray-50/70 border border-gray-100 rounded-lg">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Action / Step</label>
                  <textarea
                    autoFocus
                    placeholder="Contoh: User membuka halaman login lalu mengisi email yang sudah terdaftar"
                    value={newTestAction}
                    onChange={(e) => setNewTestAction(e.target.value)}
                    rows={2}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Expected Result</label>
                  <textarea
                    placeholder="Contoh: Sistem menampilkan pesan error 'Email sudah terdaftar'"
                    value={newTestExpected}
                    onChange={(e) => setNewTestExpected(e.target.value)}
                    rows={2}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={handleCancelAddTestCase}
                    className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-300 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddTestCase}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsAddingTestCase(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Test Case
              </button>
            )}

            {testCasesList.length > 0 ? (
              <ul className="space-y-2.5">
                {testCasesList.map((tc, index) => (
                  <li
                    key={tc.id ?? index}
                    className="flex items-start justify-between gap-2.5 p-3 bg-gray-50 border border-gray-200 rounded-lg group hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                      <span className="text-[10px] font-mono font-bold text-gray-500 bg-gray-200/70 px-1.5 py-0.5 rounded shrink-0 mt-0.5">
                        TC-{index + 1}
                      </span>
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="text-xs text-gray-700 leading-relaxed">
                          <span className="font-semibold text-gray-500">Action: </span>
                          {tc.action || <span className="italic text-gray-400">(kosong)</span>}
                        </p>
                        <p className="text-xs text-gray-700 leading-relaxed">
                          <span className="font-semibold text-gray-500">Expected: </span>
                          {tc.expectedResult || <span className="italic text-gray-400">(kosong)</span>}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteTestCase(index)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 transition-opacity cursor-pointer shrink-0"
                      title="Hapus test case"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-4 bg-gray-50 rounded-lg border border-dashed border-gray-200 text-center">
                <p className="text-xs text-gray-500">Belum ada test cases. Isi Action dan Expected Result di atas lalu klik Tambah.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'images' && (
          <div className="space-y-4">
            <div className="space-y-2 p-3 bg-gray-50/70 border border-gray-100 rounded-lg">
              <div>
                <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">
                  Caption (opsional, berlaku untuk gambar berikutnya yang ditambahkan)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Wireframe halaman login versi 2"
                  value={newImageCaption}
                  onChange={(e) => setNewImageCaption(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelected}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingImage}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploadingImage ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Mengupload...
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      Upload File
                    </>
                  )}
                </button>

                <button
                  onClick={() => setIsAddingImageUrl(!isAddingImageUrl)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  Tambah dari URL
                </button>
              </div>

              {isAddingImageUrl && (
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="https://contoh.com/gambar.png"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddImageUrl()}
                    className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleAddImageUrl}
                    className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {imagesList.length > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {imagesList.map((img) => (
                  <div
                    key={img.id}
                    className="group relative border border-gray-200 rounded-lg overflow-hidden bg-gray-50 aspect-square cursor-pointer"
                    onClick={() => setLightboxImage(img)}
                  >
                    <img
                      src={resolveImageUrl(img.url)}
                      alt={img.caption || 'Story image'}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteImage(img);
                      }}
                      className="absolute top-1.5 right-1.5 p-1 bg-white/90 rounded-md text-gray-500 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      title="Hapus gambar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    {img.caption && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] px-2 py-1 truncate">
                        {img.caption}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-gray-50 rounded-lg border border-dashed border-gray-200 text-center">
                <ImageIcon className="w-6 h-6 text-gray-300 mx-auto mb-1" />
                <p className="text-xs text-gray-500">Belum ada gambar/wireframe. Upload file atau tambahkan lewat URL di atas.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'comments' && (
          <div className="space-y-4">
            {isLoadingComments ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              </div>
            ) : commentsList.length > 0 ? (
              <ul className="space-y-3">
                {commentsList.map((c) => (
                  <li key={c.id} className="flex items-start gap-3">
                    {c.user.avatarUrl ? (
                      <img
                        src={c.user.avatarUrl}
                        alt={c.user.fullName || c.user.username}
                        className="w-8 h-8 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0">
                        {getInitial(c.user.fullName || c.user.username)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-semibold text-gray-800">
                          {c.user.fullName || c.user.username}
                        </span>
                        <span className="text-[10px] text-gray-400">{formatRelativeTime(c.createdAt)}</span>
                      </div>
                      <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">{c.content}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-4 bg-gray-50 rounded-lg border border-dashed border-gray-200 text-center">
                <MessageSquare className="w-6 h-6 text-gray-300 mx-auto mb-1" />
                <p className="text-xs text-gray-500">Belum ada komentar. Mulai diskusi di bawah.</p>
              </div>
            )}

            <div className="flex gap-2 pt-2 border-t border-gray-100">
              <textarea
                placeholder="Tulis komentar..."
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendComment();
                  }
                }}
                rows={2}
                className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              />
              <button
                onClick={handleSendComment}
                disabled={isSendingComment || !newCommentText.trim()}
                className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0 self-end"
              >
                {isSendingComment ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="w-80 bg-white p-6 space-y-4 overflow-y-auto border-l border-gray-200">
        <SidebarCard
          icon={History}
          iconBg="bg-rose-100"
          iconColor="text-rose-600"
          title="Version History"
          action={
            <button
              type="button"
              disabled
              title="Fitur riwayat versi lengkap belum tersedia"
              className="text-[10px] text-gray-300 cursor-not-allowed"
            >
              View Versions
            </button>
          }
        >
          <div className="text-xs space-y-1">
            <div className="text-green-600 font-medium flex items-center gap-1.5">
              <span>✓</span> v0.1 - Manual entry
            </div>
          </div>
        </SidebarCard>

        <SidebarCard
          icon={BookOpen}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
          title="Stories Linked To"
          action={
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleGenerateLinksAi}
                disabled={isGeneratingLinks}
                className="p-1 text-purple-500 hover:text-purple-700 rounded-md transition-colors cursor-pointer disabled:opacity-50"
                title="Generate links otomatis dengan AI"
              >
                {isGeneratingLinks ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setIsAddingLink((prev) => !prev)}
                className="p-1 text-gray-400 hover:text-blue-600 rounded-md transition-colors cursor-pointer"
                title="Tambah link manual"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          }
        >
          <div className="space-y-2.5">
            {isAddingLink && (
              <div className="space-y-2 p-2.5 bg-gray-50 border border-gray-100 rounded-lg">
                <select
                  value={linkTargetId}
                  onChange={(e) => setLinkTargetId(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-[11px] text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Pilih story tujuan...</option>
                  {linkableStories.map((s) => (
                    <option key={String(s.id)} value={String(s.id)}>
                      {s.code} — {s.i_want}
                    </option>
                  ))}
                </select>
                <select
                  value={linkType}
                  onChange={(e) => setLinkType(e.target.value as 'relates_to' | 'blocked_by')}
                  className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-[11px] text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="relates_to">Relates to</option>
                  <option value="blocked_by">Blocked by</option>
                </select>
                <div className="flex justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingLink(false);
                      setLinkTargetId('');
                    }}
                    className="px-2.5 py-1 bg-gray-200 text-gray-700 rounded-md text-[10px] font-semibold hover:bg-gray-300 transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleAddLink}
                    disabled={!linkTargetId || isSavingLink}
                    className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 text-white rounded-md text-[10px] font-semibold hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSavingLink ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Simpan'}
                  </button>
                </div>
              </div>
            )}

            {isLoadingLinks ? (
              <div className="flex justify-center py-2">
                <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
              </div>
            ) : linkedTo.length > 0 ? (
              <ul className="space-y-2">
                {linkedTo.map((l) => (
                  <li key={l.linkId} className="flex items-start justify-between gap-2 group">
                    <div className="min-w-0">
                      <p className="text-[11px] text-gray-700 truncate">
                        <span className="font-mono font-semibold text-gray-500">{l.code}</span> {l.iWant}
                      </p>
                      <span className="text-[9px] text-gray-400 uppercase font-semibold">
                        {linkTypeLabel[l.linkType] || l.linkType}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteLink(l.linkId, 'to')}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-red-600 transition-opacity cursor-pointer shrink-0"
                      title="Hapus link"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : !isAddingLink ? (
              <p className="text-[11px] text-gray-400 italic">
                Belum ada story lain yang di-link dari sini.
              </p>
            ) : null}
          </div>
        </SidebarCard>

        <SidebarCard
          icon={FileText}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          title="Stories Linked From"
        >
          {isLoadingLinks ? (
            <div className="flex justify-center py-2">
              <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
            </div>
          ) : linkedFrom.length > 0 ? (
            <ul className="space-y-2">
              {linkedFrom.map((l) => (
                <li key={l.linkId} className="flex items-start justify-between gap-2 group">
                  <div className="min-w-0">
                    <p className="text-[11px] text-gray-700 truncate">
                      <span className="font-mono font-semibold text-gray-500">{l.code}</span> {l.iWant}
                    </p>
                    <span className="text-[9px] text-gray-400 uppercase font-semibold">
                      {linkTypeLabel[l.linkType] || l.linkType}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteLink(l.linkId, 'from')}
                    className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-red-600 transition-opacity cursor-pointer shrink-0"
                    title="Hapus link"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[11px] text-gray-400 italic">
              Belum ada story lain yang nge-link ke sini.
            </p>
          )}
        </SidebarCard>

        <SidebarCard
          icon={Map}
          iconBg="bg-indigo-100"
          iconColor="text-indigo-600"
          title="Journeys Linked From"
        >
          {isLoadingJourneys ? (
            <div className="flex justify-center py-2">
              <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
            </div>
          ) : linkedJourneys.length > 0 ? (
            <ul className="space-y-2">
              {linkedJourneys.map((j) => (
                <li key={j.step_id} className="min-w-0">
                  <p className="text-[11px] font-semibold text-gray-700 truncate">
                    {j.journey_title}
                  </p>
                  <p className="text-[10px] text-gray-400 truncate">
                    Step: {j.step_title}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[11px] text-gray-400 italic">
              Belum ada journey yang terhubung ke story ini.
            </p>
          )}
        </SidebarCard>

        <SidebarCard
          icon={Sparkles}
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
          title="Resources"
        >
          <button
            type="button"
            onClick={handleOpenStoryHelp}
            className="text-xs text-blue-600 hover:underline cursor-pointer text-left"
          >
            Learn about user stories
          </button>
        </SidebarCard>
      </div>

      {lightboxImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="max-w-3xl w-full bg-white rounded-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
              <span className="text-xs font-semibold text-gray-700 truncate">
                {lightboxImage.caption || 'Gambar'}
              </span>
              <button
                onClick={() => setLightboxImage(null)}
                className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <img
              src={resolveImageUrl(lightboxImage.url)}
              alt={lightboxImage.caption || 'Story image'}
              className="w-full max-h-[75vh] object-contain bg-gray-50"
            />
            <div className="flex justify-end px-4 py-2 border-t border-gray-100">
              <button
                onClick={() => handleDeleteImage(lightboxImage)}
                className="flex items-center gap-1 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Hapus Gambar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}