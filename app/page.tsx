// app/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { resolvePostLoginRoute } from '@/lib/post-login-redirect';
import { getAuthToken } from '@/lib/auth';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const handleEntrypoint = async () => {
      const token = getAuthToken() || localStorage.getItem('token');

      if (!token) {
        console.log('Entrypoint: Token tidak ditemukan, lempar ke login.');
        router.push('/login');
        return;
      }

      // Semua logika 3 kondisi entrypoint (belum punya team / punya team tapi
      // belum ada project / sudah punya project) dipusatkan di satu tempat
      // (lib/post-login-redirect.ts) supaya tidak ada dua implementasi yang
      // bisa saling beda hasil.
      const destination = await resolvePostLoginRoute(token);
      console.log(`Entrypoint: Meluncur ke ${destination}`);
      router.push(destination);
    };

    handleEntrypoint();
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center font-sans">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-sm text-gray-500 font-medium animate-pulse">
          Menyiapkan workspace Anda...
        </p>
      </div>
    </div>
  );
}