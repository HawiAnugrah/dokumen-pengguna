// app/profile/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LogoUserdoc from '@/public/logoUserDoc';
import { profileApi } from '@/services/profileApi';
import { getAuthToken } from '@/lib/auth';
import { Loader2, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    const load = async () => {
      const token = getAuthToken();
      if (!token) {
        setLoadError('Sesi habis, silakan login kembali.');
        setIsLoading(false);
        return;
      }
      try {
        const profile = await profileApi.getProfile(token);
        setFullName(profile.full_name || '');
        setEmail(profile.email);
      } catch (err: any) {
        setLoadError(err.message || 'Gagal memuat profil.');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAuthToken();
    if (!token) return;

    setSavingProfile(true);
    setProfileMsg({ type: '', text: '' });
    try {
      await profileApi.updateProfile({ full_name: fullName }, token);
      setProfileMsg({ type: 'success', text: 'Profil berhasil disimpan!' });
    } catch (err: any) {
      setProfileMsg({ type: 'error', text: err.message || 'Gagal menyimpan profil.' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Konfirmasi kata sandi tidak cocok.' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'Kata sandi baru minimal 6 karakter.' });
      return;
    }

    const token = getAuthToken();
    if (!token) return;

    setSavingPassword(true);
    setPasswordMsg({ type: '', text: '' });
    try {
      await profileApi.changePassword({ current_password: currentPassword, new_password: newPassword }, token);
      setPasswordMsg({ type: 'success', text: 'Kata sandi berhasil diubah!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordMsg({ type: 'error', text: err.message || 'Gagal mengubah kata sandi.' });
    } finally {
      setSavingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-600 text-sm">{loadError}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="h-14 border-b border-gray-200 bg-white flex items-center px-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </header>

      <main className="max-w-lg mx-auto pt-12 px-6">
        <div className="flex justify-center mb-6">
          <LogoUserdoc />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-8">Manage Profile</h1>

        <form onSubmit={handleSaveProfile} className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5 mb-6">
          {profileMsg.text && (
            <div className={`p-3 rounded-xl flex items-center gap-2 text-xs font-medium ${
              profileMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              {profileMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              {profileMsg.text}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-blue-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm text-gray-500 cursor-not-allowed"
            />
            <p className="text-[11px] text-gray-400 mt-1">Email tidak dapat diubah dari sini.</p>
          </div>

          <button
            type="submit"
            disabled={savingProfile}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer"
          >
            {savingProfile ? 'Menyimpan...' : 'Save Profile'}
          </button>
        </form>

        <form onSubmit={handleChangePassword} className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5">
          <h2 className="text-sm font-bold text-gray-900">Change Password</h2>

          {passwordMsg.text && (
            <div className={`p-3 rounded-xl flex items-center gap-2 text-xs font-medium ${
              passwordMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              {passwordMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              {passwordMsg.text}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Current Password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-blue-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">New Password</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-blue-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Confirm New Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-blue-500 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={savingPassword}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer"
          >
            {savingPassword ? 'Menyimpan...' : 'Change Password'}
          </button>
        </form>
      </main>
    </div>
  );
}