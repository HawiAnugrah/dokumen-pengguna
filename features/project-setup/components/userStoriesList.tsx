// features/project-setup/components/UserStoriesList.tsx
'use client';

import { useState, useEffect } from 'react';
import LogoUserdoc from '../../../public/logoUserDoc';
import { useWizardStore, UserStoryItem } from '../store/wizard-store';
import { projectApi } from '@/services/projectsApi';
import { getAuthToken } from '@/lib/auth';
import { 
  ArrowRight,
  ArrowLeft,
  Trash2, 
  ChevronDown, 
  Key,
  ShieldCheck,
  User, 
  Users,
  Globe, 
  Sparkles, 
  Sliders, 
  Clock, 
  Bell, 
  MessageSquare,
  MessageCircle,
  FolderKanban,
  AlertCircle,
  Plus,
  Pencil,
  Loader2,
  ShoppingCart,
  CreditCard,
  Package,
  Truck,
  Search,
  BarChart3,
  FileText,
  Star,
  Heart,
  MapPin,
  Calendar,
  Mail,
  Image as ImageIcon,
  Database,
  LayoutDashboard,
  UserCog,
  Wallet,
  Tag,
  Warehouse,
  Share2,
  Video,
  Phone,
  BookOpen,
  ClipboardList,
  Building2,
  Wifi,
} from 'lucide-react';

const getEpicIcon = (title: string) => {
  const t = title.toLowerCase();
  const iconClass = "w-4 h-4 text-blue-300";

  // Autentikasi & keamanan akun
  if (t.includes('login') || t.includes('registrasi') || t.includes('registration') || t.includes('auth') || t.includes('sign up') || t.includes('sign in') || t.includes('masuk') || t.includes('daftar'))
    return <Key className={iconClass} />;
  if (t.includes('security') || t.includes('keamanan') || t.includes('permission') || t.includes('otorisasi') || t.includes('role'))
    return <ShieldCheck className={iconClass} />;

  // Profil & manajemen akun
  if (t.includes('profile') || t.includes('profil') || t.includes('akun') || t.includes('account'))
    return <User className={iconClass} />;
  if (t.includes('admin') || t.includes('manajemen pengguna') || t.includes('user management'))
    return <UserCog className={iconClass} />;
  if (t.includes('team') || t.includes('anggota') || t.includes('member') || t.includes('kolaborasi') || t.includes('collaboration'))
    return <Users className={iconClass} />;

  // Guest & akses publik
  if (t.includes('guest') || t.includes('browsing') || t.includes('publik') || t.includes('public access'))
    return <Globe className={iconClass} />;

  // Personalisasi & preferensi
  if (t.includes('content') || t.includes('personalized') || t.includes('personalisasi') || t.includes('rekomendasi') || t.includes('recommendation'))
    return <Sparkles className={iconClass} />;
  if (t.includes('preference') || t.includes('preferensi') || t.includes('setting') || t.includes('pengaturan'))
    return <Sliders className={iconClass} />;

  // Sesi & waktu
  if (t.includes('session') || t.includes('sesi') || t.includes('history') || t.includes('riwayat'))
    return <Clock className={iconClass} />;
  if (t.includes('jadwal') || t.includes('schedule') || t.includes('booking') || t.includes('reservasi') || t.includes('calendar'))
    return <Calendar className={iconClass} />;

  // Notifikasi & komunikasi
  if (t.includes('notification') || t.includes('notifikasi'))
    return <Bell className={iconClass} />;
  if (t.includes('feedback') || t.includes('support') || t.includes('bantuan') || t.includes('keluhan') || t.includes('ticket'))
    return <MessageSquare className={iconClass} />;
  if (t.includes('chat') || t.includes('pesan') || t.includes('messaging'))
    return <MessageCircle className={iconClass} />;
  if (t.includes('email') || t.includes('surel'))
    return <Mail className={iconClass} />;
  if (t.includes('panggilan') || t.includes('call') || t.includes('video call'))
    return <Phone className={iconClass} />;
  if (t.includes('video') || t.includes('streaming'))
    return <Video className={iconClass} />;

  // E-commerce & transaksi
  if (t.includes('cart') || t.includes('keranjang'))
    return <ShoppingCart className={iconClass} />;
  if (t.includes('payment') || t.includes('pembayaran') || t.includes('checkout') || t.includes('billing') || t.includes('tagihan'))
    return <CreditCard className={iconClass} />;
  if (t.includes('wallet') || t.includes('saldo') || t.includes('dompet') || t.includes('top up') || t.includes('topup'))
    return <Wallet className={iconClass} />;
  if (t.includes('order') || t.includes('pesanan') || t.includes('transaksi') || t.includes('transaction'))
    return <ClipboardList className={iconClass} />;
  if (t.includes('produk') || t.includes('product') || t.includes('katalog') || t.includes('catalog'))
    return <Package className={iconClass} />;
  if (t.includes('inventory') || t.includes('stok') || t.includes('stock') || t.includes('gudang') || t.includes('warehouse'))
    return <Warehouse className={iconClass} />;
  if (t.includes('shipping') || t.includes('pengiriman') || t.includes('kurir') || t.includes('delivery') || t.includes('logistik'))
    return <Truck className={iconClass} />;
  if (t.includes('promo') || t.includes('diskon') || t.includes('voucher') || t.includes('coupon') || t.includes('kupon'))
    return <Tag className={iconClass} />;

  // Pencarian & data
  if (t.includes('search') || t.includes('pencarian') || t.includes('filter'))
    return <Search className={iconClass} />;
  if (t.includes('report') || t.includes('laporan') || t.includes('analytics') || t.includes('analitik') || t.includes('statistik') || t.includes('statistics'))
    return <BarChart3 className={iconClass} />;
  if (t.includes('dashboard') || t.includes('beranda') || t.includes('overview'))
    return <LayoutDashboard className={iconClass} />;
  if (t.includes('database') || t.includes('data management') || t.includes('manajemen data'))
    return <Database className={iconClass} />;
  if (t.includes('dokumen') || t.includes('document') || t.includes('file') || t.includes('berkas'))
    return <FileText className={iconClass} />;

  // Ulasan & interaksi
  if (t.includes('review') || t.includes('ulasan') || t.includes('rating') || t.includes('penilaian'))
    return <Star className={iconClass} />;
  if (t.includes('wishlist') || t.includes('favorit') || t.includes('favorite') || t.includes('like'))
    return <Heart className={iconClass} />;
  if (t.includes('share') || t.includes('bagikan') || t.includes('social'))
    return <Share2 className={iconClass} />;

  // Lokasi & institusi
  if (t.includes('lokasi') || t.includes('location') || t.includes('alamat') || t.includes('address') || t.includes('maps'))
    return <MapPin className={iconClass} />;
  if (t.includes('cabang') || t.includes('branch') || t.includes('kantor') || t.includes('perusahaan') || t.includes('company'))
    return <Building2 className={iconClass} />;

  // Media & konten
  if (t.includes('gambar') || t.includes('image') || t.includes('foto') || t.includes('photo') || t.includes('galeri') || t.includes('gallery'))
    return <ImageIcon className={iconClass} />;
  if (t.includes('artikel') || t.includes('article') || t.includes('blog') || t.includes('konten') || t.includes('learning') || t.includes('kursus') || t.includes('course'))
    return <BookOpen className={iconClass} />;

  // Integrasi & konektivitas
  if (t.includes('integrasi') || t.includes('integration') || t.includes('api') || t.includes('third party') || t.includes('webhook'))
    return <Wifi className={iconClass} />;

  return <FolderKanban className={iconClass} />;
};

export default function UserStoriesList() {
  const { projectName, userStories, epics, userTypes, addUserStory, removeUserStory, updateStory, nextStep, prevStep } = useWizardStore() as any;
  
  const [addingEpicTitle, setAddingEpicTitle] = useState<string | null>(null);
  const [storyName, setStoryName] = useState('');
  const [selectedUserType, setSelectedUserType] = useState(userTypes[0]?.name || 'Registered User');
  const [description, setDescription] = useState('');

  // State untuk AI Suggestion saat form "Add Row" dibuka
  const [isAiSuggesting, setIsAiSuggesting] = useState(false);

  // State untuk mode edit baris (Inline Edit dengan gaya persis seperti Add Row)
  const [editingStoryId, setEditingStoryId] = useState<string | null>(null);
  const [editStoryName, setEditStoryName] = useState('');
  const [editUserType, setEditUserType] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const [error, setError] = useState(false);
  const [mounted, setMounted] = useState(false);

  // State baru: menyimpan id epic yang sedang di-collapse (default semua terbuka)
  const [collapsedEpicIds, setCollapsedEpicIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 30);
    return () => clearTimeout(t);
  }, []);

  const titleName = projectName?.trim() ? projectName : 'your project';

  const groupedStories = epics.map((epic: any) => ({
    ...epic,
    stories: userStories.filter((s: UserStoryItem) => s.epicTitle.toLowerCase() === epic.title.toLowerCase())
  }));

  const toggleEpicCollapsed = (epicId: string) => {
    setCollapsedEpicIds((prev) => {
      const next = new Set(prev);
      if (next.has(epicId)) {
        next.delete(epicId);
      } else {
        next.add(epicId);
      }
      return next;
    });
  };

  const handleAdd = (epicTitle: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!storyName.trim()) return;

    const newItem: UserStoryItem = {
      id: `story-${Date.now()}`,
      epicId: 'custom',
      epicTitle: epicTitle,
      storyName: storyName.trim(),
      userType: selectedUserType,
      description: description.trim() || 'No description provided.',
    };

    addUserStory(newItem);
    setStoryName('');
    setDescription('');
    setAddingEpicTitle(null);
    if (error) setError(false);
  };

  const startEditing = (story: UserStoryItem) => {
    setEditingStoryId(story.id);
    setEditStoryName(story.storyName);
    setEditUserType(story.userType || userTypes[0]?.name || 'General User');
    setEditDescription(story.description);
  };

  const saveEdit = (storyId: string) => {
    if (typeof updateStory === 'function') {
      updateStory(storyId, {
        storyName: editStoryName.trim() || 'Untitled Story',
        userType: editUserType,
        description: editDescription.trim(),
      });
    }
    setEditingStoryId(null);
  };

  // Fitur AI Generate yang terhubung langsung ke Backend API AI
  const handleAiGenerateStoryForm = async (epicTitle: string) => {
    setIsAiSuggesting(true);
    try {
      const token = getAuthToken() || localStorage.getItem('token') || '';
      const response = await projectApi.suggestDescription({
        project_name: projectName || 'Proyek Baru',
        platform_type: epicTitle,
      }, token);

      if (response && response.description) {
        setStoryName(`Fitur utama untuk mengelola ${epicTitle}`);
        setDescription(response.description);
      } else {
        setStoryName(`Kelola modul ${epicTitle}`);
        setDescription(`Memungkinkan pengguna berinteraksi secara optimal dengan fitur ${epicTitle}.`);
      }
    } catch (err) {
      console.error('AI Suggestion Error:', err);
      setStoryName(`Implementasi ${epicTitle}`);
      setDescription(`Sistem mendukung alur kerja efisien pada modul ${epicTitle}.`);
    } finally {
      setIsAiSuggesting(false);
    }
  };

  const handleNext = () => {
    if (!userStories || userStories.length === 0) {
      setError(true);
      return;
    }
    setError(false);
    nextStep();
  };

  return (
    <div className="flex flex-col items-center w-full max-w-5xl mx-auto pt-10 px-4 pb-12">
      <div className="w-full flex flex-col items-center mb-8 header-fade">
        <LogoUserdoc />
      </div>

      <div className="header-fade w-full" style={{ animationDelay: '80ms' }}>
        <div className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-full px-3 py-1 mb-3 text-xs text-blue-200 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
          {userStories.length} user stories terstruktur untuk proyek ini
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          User stories for {titleName}
        </h1>
        
        <p className="text-blue-200 text-sm mb-6 leading-relaxed max-w-3xl">
          User stories di bawah dikelompokkan berdasarkan epic-nya masing-masing. Kamu bisa menambah baris baru, mengedit detail, atau menghapusnya dengan fleksibel.
        </p>
      </div>

      <div className="w-full flex flex-col gap-6 mb-6 text-left">
        {groupedStories.map((epic: any, epicIndex: number) => {
          const isCollapsed = collapsedEpicIds.has(epic.id);

          return (
            <div 
              key={epic.id} 
              className={`bg-white/10 border border-white/20 rounded-2xl p-4 sm:p-5 backdrop-blur-md shadow-xl overflow-hidden transition-all ${
                mounted ? 'card-enter' : 'opacity-0'
              }`}
              style={{ animationDelay: mounted ? `${Math.min(epicIndex, 8) * 60}ms` : undefined }}
            >
              <button
                type="button"
                onClick={() => toggleEpicCollapsed(epic.id)}
                className={`w-full flex items-center justify-between pb-3 border-b border-white/10 cursor-pointer group/header ${
                  isCollapsed ? 'mb-0' : 'mb-3'
                }`}
                aria-expanded={!isCollapsed}
              >
                <h3 className="text-white font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                  {getEpicIcon(epic.title)} {epic.title}
                  <span className="text-blue-300/60 font-normal normal-case text-[11px] ml-1">
                    ({epic.stories.length} {epic.stories.length === 1 ? 'story' : 'stories'})
                  </span>
                </h3>
                <ChevronDown
                  className={`w-4 h-4 text-blue-300 group-hover/header:text-white transition-transform duration-200 ${
                    isCollapsed ? '-rotate-90' : 'rotate-0'
                  }`}
                />
              </button>

              {!isCollapsed && (
                <>
                  <div className="grid grid-cols-12 text-[11px] font-semibold text-blue-300 uppercase tracking-wider pb-2 border-b border-white/5 px-2">
                    <div className="col-span-4">Story Name</div>
                    <div className="col-span-3">User Types</div>
                    <div className="col-span-4">Description</div>
                    <div className="col-span-1 text-right">Actions</div>
                  </div>

                  <div className="divide-y divide-white/5">
                    {epic.stories.length === 0 && addingEpicTitle !== epic.title ? (
                      <div className="py-6 px-2 text-xs text-blue-200/70 text-center">
                        Belum ada story di bawah epic ini. Klik &quot;+ Add row&quot; di kanan bawah untuk mulai.
                      </div>
                    ) : (
                      epic.stories.map((story: UserStoryItem, index: number) => (
                        <div key={story.id} className="py-3 px-2 text-xs transition-colors rounded-lg group hover:bg-white/5">
                          {editingStoryId === story.id ? (
                            /* Mode Edit Inline: Dibuat persis setara dengan gaya dan warna form Add Row */
                            <div className="card-enter my-1 p-3 bg-white/5 border border-blue-300/40 rounded-xl flex flex-col gap-2.5">
                              <input
                                type="text"
                                value={editStoryName}
                                onChange={(e) => setEditStoryName(e.target.value)}
                                placeholder="Story name..."
                                autoFocus
                                className="w-full bg-white/10 border border-blue-300/40 rounded-lg px-3 py-2 text-white text-sm font-semibold placeholder-blue-300/60 focus:outline-none focus:ring-2 focus:ring-white/50"
                              />

                              {/* Dropdown dengan warna biru transparan selaras (tidak hitam mati) */}
                              <select
                                value={editUserType}
                                onChange={(e) => setEditUserType(e.target.value)}
                                className="w-full bg-blue-900/70 backdrop-blur-md border border-blue-300/40 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-white/50 cursor-pointer"
                              >
                                {userTypes.length > 0 ? (
                                  userTypes.map((ut: any) => (
                                    <option key={ut.id || ut.name} value={ut.name} className="bg-blue-900 text-white py-1">
                                      {ut.name}
                                    </option>
                                  ))
                                ) : (
                                  <option value="General User" className="bg-blue-900 text-white">General User</option>
                                )}
                              </select>

                              <textarea
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                placeholder="Deskripsi singkat story ini..."
                                rows={2}
                                className="w-full bg-white/10 border border-blue-300/40 rounded-lg px-3 py-2 text-blue-100 text-xs placeholder-blue-300/60 resize-none focus:outline-none focus:ring-2 focus:ring-white/50"
                              />

                              <div className="flex items-center gap-2 justify-end mt-1">
                                <button
                                  type="button"
                                  onClick={() => setEditingStoryId(null)}
                                  className="text-blue-200 hover:text-white text-xs px-3 py-1.5 cursor-pointer"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => saveEdit(story.id)}
                                  className="bg-white text-blue-700 text-xs px-4 py-1.5 rounded-lg font-medium hover:bg-blue-50 cursor-pointer"
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* Tampilan Normal Baris */
                            <div className="grid grid-cols-12 items-center">
                              <div className="col-span-4 text-white font-medium truncate pr-2 flex items-center gap-1.5">
                                <span className="text-blue-300 font-mono text-[10px]">{index + 1}.</span> 
                                <span className="truncate">{story.storyName}</span>
                              </div>
                              <div className="col-span-3 text-blue-200 truncate pr-2">
                                <span className="bg-blue-500/20 text-blue-200 border border-blue-400/30 px-2 py-0.5 rounded-full text-[10px]">
                                  {story.userType}
                                </span>
                              </div>
                              <div className="col-span-4 text-blue-200/80 truncate pr-2">
                                {story.description}
                              </div>
                              <div className="col-span-1 flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => startEditing(story)}
                                  title="Edit story"
                                  className="text-blue-200 hover:text-white p-1 cursor-pointer transition-colors"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeUserStory(story.id)}
                                  title="Delete story"
                                  className="text-blue-200 hover:text-red-300 p-1 cursor-pointer transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {/* Form Inline Add Row dengan tombol AI Draft yang terhubung ke backend AI */}
                  {addingEpicTitle === epic.title && (
                    <form onSubmit={(e) => handleAdd(epic.title, e)} className="card-enter mt-4 pt-4 border-t border-blue-300/30 flex flex-col gap-2.5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-semibold text-blue-200 uppercase tracking-wider">New Story Form</span>
                        <button
                          type="button"
                          onClick={() => handleAiGenerateStoryForm(epic.title)}
                          disabled={isAiSuggesting}
                          className="text-yellow-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all px-2.5 py-1 rounded-lg bg-white/10 hover:bg-blue-600/40 border border-white/15 cursor-pointer disabled:opacity-50"
                        >
                          {isAiSuggesting ? (
                            <Loader2 className="w-3 h-3 text-white animate-spin" />
                          ) : (
                            <Sparkles className="w-3 h-3 text-yellow-300 animate-pulse" />
                          )}
                          <span>AI Draft</span>
                        </button>
                      </div>

                      <input
                        type="text"
                        value={storyName}
                        onChange={(e) => setStoryName(e.target.value)}
                        placeholder="Story name..."
                        autoFocus
                        className="w-full bg-white/10 border border-blue-300/40 rounded-lg px-3 py-2 text-white text-sm font-semibold placeholder-blue-300/60 focus:outline-none focus:ring-2 focus:ring-white/50"
                      />

                      {/* Dropdown dengan warna biru transparan selaras (tidak hitam mati) */}
                      <select
                        value={selectedUserType}
                        onChange={(e) => setSelectedUserType(e.target.value)}
                        className="w-full bg-blue-900/70 backdrop-blur-md border border-blue-300/40 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-white/50 cursor-pointer"
                      >
                        {userTypes.length > 0 ? (
                          userTypes.map((ut: any) => (
                            <option key={ut.id || ut.name} value={ut.name} className="bg-blue-900 text-white py-1">
                              {ut.name}
                            </option>
                          ))
                        ) : (
                          <option value="General User" className="bg-blue-900 text-white">General User</option>
                        )}
                      </select>

                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Deskripsi singkat story ini..."
                        rows={2}
                        className="w-full bg-white/10 border border-blue-300/40 rounded-lg px-3 py-2 text-blue-100 text-xs placeholder-blue-300/60 resize-none focus:outline-none focus:ring-2 focus:ring-white/50"
                      />

                      <div className="flex items-center gap-2 justify-end mt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setAddingEpicTitle(null);
                            setStoryName('');
                            setDescription('');
                          }}
                          className="text-blue-200 hover:text-white text-xs px-3 py-1.5 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={!storyName.trim()}
                          className="bg-white text-blue-700 text-xs px-4 py-1.5 rounded-lg font-medium hover:bg-blue-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Add
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Tombol Add Row di pojok kanan bawah container */}
                  {addingEpicTitle !== epic.title && (
                    <div className="mt-3 pt-2 border-t border-white/5 flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setAddingEpicTitle(epic.title);
                          setStoryName('');
                          setDescription('');
                        }}
                        className="text-blue-300 hover:text-white text-xs font-medium flex items-center gap-1 transition-colors px-2 py-1 rounded hover:bg-white/10 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add row
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <div className="w-full text-left mb-6 bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-start gap-3 animate-fadeIn">
          <AlertCircle className="w-5 h-5 text-red-300 shrink-0 mt-0.5" />
          <p className="text-red-300 text-xs sm:text-sm">
            <strong>Rules:</strong> Harap tambahkan minimal 1 user story sebelum melanjutkan ke tahap berikutnya.
          </p>
        </div>
      )}

      {/* Navigasi Bawah */}
      <div className="w-full flex items-center justify-between pt-4 border-t border-white/10">
        <button
          type="button"
          onClick={prevStep}
          className="bg-transparent hover:bg-white/10 text-white border border-white/20 px-4 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 cursor-pointer text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <button
          type="button"
          onClick={handleNext}
          className="bg-white hover:bg-blue-50 text-blue-700 px-6 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 shadow-lg cursor-pointer text-sm"
        >
          Next <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}