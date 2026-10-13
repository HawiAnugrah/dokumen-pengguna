// app/knowledge/page.tsx
'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AppSidebar from '@/features/common/components/AppSidebar';
import AccountMenu from '@/features/common/components/accountMenu';
import {
  Search, FileText, Users, Map, Code, Sparkles, ChevronDown,
  BookOpen, MessageSquare, Lightbulb
} from 'lucide-react';

interface Article {
  id: string;
  category: string;
  title: string;
  icon: any;
  content: string[];
}

const ARTICLES: Article[] = [
  {
    id: 'getting-started',
    category: 'Getting Started',
    title: 'Membuat project pertama kamu',
    icon: Sparkles,
    content: [
      'Setiap project berada di dalam sebuah Team. Kalau kamu baru pertama kali pakai Userdoc, kamu akan diminta membuat nama Team dulu sebelum project pertama dibuat.',
      'Di step "Project Type", kamu bisa pilih "Generate new software requirements with AI" — ini alur yang paling cepat: cukup jelaskan project kamu dalam beberapa kalimat, dan AI akan menyusun User Types, Epics, User Stories lengkap dengan Acceptance Criteria, Tech Notes, dan Test Cases, ditambah Non-Functional Requirements dan draf User Journey.',
      'Setelah wizard selesai, kamu akan diarahkan ke halaman Stories — di situ kamu bisa lihat, edit, atau tambah requirement secara manual kapan saja.',
    ],
  },
  {
    id: 'stories-epics',
    category: 'Stories',
    title: 'Memahami Epics dan User Stories',
    icon: FileText,
    content: [
      'Epic adalah modul/fitur besar dalam aplikasi kamu (contoh: "Autentikasi", "Manajemen Pesanan"). Setiap Epic berisi beberapa User Story yang lebih spesifik.',
      'User Story ditulis dalam format "Sebagai [tipe user], saya ingin [aksi], agar [manfaat]". Setiap story punya Acceptance Criteria (syarat diterimanya fitur), Tech Notes (pertimbangan implementasi), dan Test Cases (skenario pengujian QA) — ketiganya bisa di-generate otomatis oleh AI.',
      'Klik salah satu story di sidebar untuk melihat detail lengkapnya, atau klik ikon pensil untuk membuat story baru secara manual.',
    ],
  },
  {
    id: 'user-types',
    category: 'User Types',
    title: 'User Types dan Personas',
    icon: Users,
    content: [
      'User Type adalah kategori pengguna aplikasi kamu (contoh: "Admin", "Pelanggan"). Setiap User Type bisa punya satu atau lebih Persona — profil fiktif yang detail (nama, usia, pekerjaan, goals, frustrations) untuk membantu tim membayangkan pengguna sungguhan.',
      'Saat generate dengan AI, sistem otomatis membuatkan satu persona contoh untuk tiap User Type. Kamu tetap bisa menambah, edit, atau hapus persona kapan saja lewat tombol "Edit".',
    ],
  },
  {
    id: 'journeys',
    category: 'Journeys',
    title: 'User Journeys',
    icon: Map,
    content: [
      'User Journey menggambarkan alur pengalaman pengguna dari awal menemukan produk sampai mendapatkan hasil yang diinginkan, dipecah menjadi beberapa Step berurutan.',
      'Di wizard, klik "AI Suggestion" untuk mendapatkan draf narasi + step otomatis. Setelah project jadi, kamu bisa buka halaman Journeys untuk melihat, mengedit, menambah, atau menghapus step-nya secara manual.',
    ],
  },
  {
    id: 'build',
    category: 'Build',
    title: 'Tech Stack, Coding Guidelines & Dev Plans',
    icon: Code,
    content: [
      'Halaman Build membantu tim development menerjemahkan requirement jadi rencana teknis: Technology Stack (framework tiap layer arsitektur), Coding Guidelines (standar penulisan kode), dan Development Plans (task-task pengembangan dalam papan Kanban To Do/In Progress/Done).',
      'Ketiganya otomatis dibuatkan draf awal oleh AI begitu wizard project selesai, berdasarkan deskripsi project dan Epic yang sudah dibuat. Kamu bebas mengedit semuanya sesuai kebutuhan tim.',
    ],
  },
  {
    id: 'ai-rules',
    category: 'AI Rules',
    title: 'Mengatur gaya AI dengan AI Rules',
    icon: Sparkles,
    content: [
      'AI Rules adalah instruksi kustom yang memengaruhi bagaimana AI menulis konten untuk project kamu — misalnya gaya bahasa formal, standar kepatuhan tertentu, atau format penulisan khusus.',
      'Ada dua tingkatan: AI Rules per-project (di Project Settings, hanya berlaku untuk project itu) dan AI Rules per-team (di Team Settings, berlaku untuk semua project dalam team). Gunakan tombol "Generate" untuk minta AI menyarankan beberapa aturan relevan berdasarkan konteks project kamu.',
    ],
  },
  {
    id: 'team',
    category: 'Team',
    title: 'Mengelola Team dan Anggota',
    icon: Users,
    content: [
      'Satu Team bisa menampung banyak project. Anggota team punya salah satu dari tiga role: Owner (akses penuh, termasuk hapus team), Editor (bisa edit & generate AI), atau Viewer (hanya bisa melihat).',
      'Buka Team Settings dari menu akun (avatar di pojok kanan atas) untuk mengundang anggota baru, mengubah nama team, atau menghapus team sepenuhnya.',
    ],
  },
  {
    id: 'workspace',
    category: 'Workspace',
    title: 'Berpindah antar project',
    icon: BookOpen,
    content: [
      'Halaman Workspace menampilkan semua project dalam team kamu — ini yang muncul begitu kamu login. Dari sini kamu bisa membuka project yang sudah ada, membuat project baru, atau menghapus project.',
      'Kamu juga bisa berpindah project cepat lewat dropdown di sidebar Stories tanpa perlu kembali ke Workspace setiap saat.',
    ],
  },
];

const CATEGORIES = Array.from(new Set(ARTICLES.map((a) => a.category)));

function KnowledgeBaseContent() {
  const searchParams = useSearchParams();
  const projectIdParam = searchParams.get('project_id');
  const articleParam = searchParams.get('article');
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>('getting-started');
  const articleRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (articleParam && ARTICLES.some((a) => a.id === articleParam)) {
      setExpandedId(articleParam);
      requestAnimationFrame(() => {
        articleRefs.current[articleParam]?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      });
    }
  }, [articleParam]);

  const filteredArticles = ARTICLES.filter(
    (a) =>
      a.title.toLowerCase().includes(query.toLowerCase()) ||
      a.category.toLowerCase().includes(query.toLowerCase()) ||
      a.content.some((c) => c.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50 font-sans">
      <AppSidebar activeMenu="knowledge" projectId={projectIdParam} />

      <main className="flex-1 flex flex-col h-full bg-white overflow-hidden">
        <div className="h-14 border-b border-gray-200 px-6 flex items-center justify-between bg-white shrink-0">
          <span className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-600" /> Knowledge Base
          </span>
          <div className="flex items-center gap-3">
            <button className="text-xs text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm font-medium cursor-pointer">
              <MessageSquare className="w-3.5 h-3.5 text-blue-600" /> Chat to Userdoc Assistant
            </button>
            <AccountMenu />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-8 py-10">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">How can we help?</h1>
            <p className="text-sm text-gray-500 mb-6">Panduan penggunaan seluruh fitur Userdoc.</p>

            <div className="relative mb-8">
              <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari topik bantuan..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {query.trim() === '' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                {CATEGORIES.map((cat) => {
                  const article = ARTICLES.find((a) => a.category === cat)!;
                  const Icon = article.icon;
                  return (
                    <button
                      key={cat}
                      onClick={() => setQuery(cat)}
                      className="flex flex-col items-center gap-2 p-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50/30 transition-colors cursor-pointer"
                    >
                      <Icon className="w-5 h-5 text-blue-600" />
                      <span className="text-xs font-medium text-gray-700 text-center">{cat}</span>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="space-y-3">
              {filteredArticles.length === 0 ? (
                <div className="text-center py-12">
                  <Lightbulb className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Tidak ada artikel yang cocok dengan pencarian "{query}".</p>
                </div>
              ) : (
                filteredArticles.map((article) => {
                  const Icon = article.icon;
                  const isExpanded = expandedId === article.id;
                  return (
                    <div
                      key={article.id}
                      ref={(el) => { articleRefs.current[article.id] = el; }}
                      className="border border-gray-200 rounded-xl overflow-hidden"
                    >
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : article.id)}
                        className="w-full flex items-center justify-between gap-3 px-5 py-4 hover:bg-gray-50/50 transition-colors cursor-pointer text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                            <Icon className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider block">{article.category}</span>
                            <h3 className="text-sm font-semibold text-gray-900">{article.title}</h3>
                          </div>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                      {isExpanded && (
                        <div className="px-5 pb-5 pl-16 space-y-3">
                          {article.content.map((para, i) => (
                            <p key={i} className="text-xs text-gray-600 leading-relaxed">{para}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function KnowledgeBasePage() {
  return (
    <Suspense fallback={<div className="flex h-screen w-screen items-center justify-center bg-gray-50" />}>
      <KnowledgeBaseContent />
    </Suspense>
  );
}