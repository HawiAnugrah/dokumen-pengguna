// app/profile/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LogoUserdoc from '@/public/logoUserDoc';
import { profileApi } from '@/services/profileApi';
import { getAuthToken } from '@/lib/auth';
import { 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft, 
  Pencil, 
  X, 
  ShieldCheck, 
  User, 
  Mail, 
  KeyRound,
  Send
} from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Profile data
  const [fullName, setFullName] = useState('');
  const [originalName, setOriginalName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });

  // Password & OTP data
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });

  // Countdown timer untuk permintaan ulang OTP
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (otpCountdown > 0) {
      timer = setInterval(() => {
        setOtpCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpCountdown]);

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
        // Fallback: Jika full_name belum pernah diisi, gunakan username agar nama tidak kosong
        const initialName = profile.full_name?.trim() || profile.username || '';
        setFullName(initialName);
        setOriginalName(initialName);
        setUsername(profile.username || '');
        setEmail(profile.email || '');
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

    if (!fullName.trim()) {
      setProfileMsg({ type: 'error', text: 'Nama tidak boleh kosong.' });
      return;
    }

    setSavingProfile(true);
    setProfileMsg({ type: '', text: '' });
    try {
      const updated = await profileApi.updateProfile({ full_name: fullName.trim() }, token);
      const newName = updated.full_name?.trim() || updated.username || fullName.trim();
      setFullName(newName);
      setOriginalName(newName);
      setIsEditingProfile(false);
      setProfileMsg({ type: 'success', text: 'Profil berhasil diperbarui!' });
    } catch (err: any) {
      setProfileMsg({ type: 'error', text: err.message || 'Gagal menyimpan profil.' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCancelEdit = () => {
    setFullName(originalName);
    setIsEditingProfile(false);
    setProfileMsg({ type: '', text: '' });
  };

  // Minta Kode OTP ke Email via Brevo
  const handleRequestOtp = async () => {
    if (!currentPassword) {
      setPasswordMsg({ 
        type: 'error', 
        text: 'Masukkan kata sandi saat ini terlebih dahulu sebelum meminta kode OTP.' 
      });
      return;
    }

    const token = getAuthToken();
    if (!token) return;

    setSendingOtp(true);
    setPasswordMsg({ type: '', text: '' });
    try {
      const res = await profileApi.requestPasswordOtp(currentPassword, token);
      setOtpSent(true);
      setOtpCountdown(60); // Cooldown 60 detik
      setPasswordMsg({ 
        type: 'success', 
        text: res.message || `Kode OTP 6-digit berhasil dikirim ke ${email}. Silakan cek inbox atau spam!` 
      });
    } catch (err: any) {
      setPasswordMsg({ type: 'error', text: err.message || 'Gagal mengirim kode OTP.' });
    } finally {
      setSendingOtp(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      setPasswordMsg({ type: 'error', text: 'Kata sandi saat ini wajib diisi.' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'Kata sandi baru minimal 6 karakter.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Konfirmasi kata sandi tidak cocok.' });
      return;
    }
    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      setPasswordMsg({ type: 'error', text: 'Masukkan 6-digit kode verifikasi (OTP) yang dikirimkan ke email Anda.' });
      return;
    }

    const token = getAuthToken();
    if (!token) return;

    setSavingPassword(true);
    setPasswordMsg({ type: '', text: '' });
    try {
      const res = await profileApi.changePassword({ 
        current_password: currentPassword, 
        new_password: newPassword,
        otp_code: otpCode.trim()
      }, token);
      setPasswordMsg({ 
        type: 'success', 
        text: res.message || 'Kata sandi berhasil diubah! Notifikasi keamanan telah dikirim ke email Anda.' 
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setOtpCode('');
      setOtpSent(false);
      setOtpCountdown(0);
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

  const initialLetter = (fullName || username || 'U').charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <header className="h-14 border-b border-gray-200 bg-white flex items-center px-6 sticky top-0 z-10">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali
        </button>
      </header>

      <main className="max-w-xl mx-auto pt-8 px-6">
        <div className="flex justify-center mb-6">
          <LogoUserdoc />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-1">Manage Profile</h1>
        <p className="text-xs text-gray-500 text-center mb-8">Kelola informasi identitas akun dan keamanan kata sandi Anda</p>

        {/* PROFILE INFORMATION SECTION */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs mb-6">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-bold text-lg flex items-center justify-center shadow-sm">
                {initialLetter}
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">{fullName || username}</h2>
                <p className="text-xs text-gray-500">@{username || 'pengguna'}</p>
              </div>
            </div>

            {!isEditingProfile && (
              <button
                type="button"
                onClick={() => { setIsEditingProfile(true); setProfileMsg({ type: '', text: '' }); }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/50 transition-all cursor-pointer shadow-2xs"
              >
                <Pencil className="w-3.5 h-3.5" /> Edit Profil
              </button>
            )}
          </div>

          {profileMsg.text && (
            <div className={`p-3 rounded-xl flex items-center gap-2 text-xs font-medium mb-4 ${
              profileMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              {profileMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              {profileMsg.text}
            </div>
          )}

          {!isEditingProfile ? (
            /* VIEW MODE */
            <div className="space-y-4 pt-1">
              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50/70 border border-gray-100">
                <div className="flex items-center gap-2.5">
                  <User className="w-4 h-4 text-gray-400" />
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider">Nama Lengkap</span>
                    <span className="text-sm font-semibold text-gray-800">{fullName || '-'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50/70 border border-gray-100">
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider">Alamat Email</span>
                    <span className="text-sm font-semibold text-gray-800">{email}</span>
                  </div>
                </div>
                <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Terdaftar
                </span>
              </div>
            </div>
          ) : (
            /* EDIT MODE */
            <form onSubmit={handleSaveProfile} className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Masukkan nama lengkap Anda"
                  className="w-full px-3.5 py-2.5 border border-blue-400 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  disabled
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm text-gray-500 cursor-not-allowed"
                />
                <p className="text-[11px] text-gray-400 mt-1">Username unik akun tidak dapat diubah.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm text-gray-500 cursor-not-allowed"
                />
                <p className="text-[11px] text-gray-400 mt-1">Email akun terikat dan tidak dapat diubah dari sini.</p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
                >
                  {savingProfile ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Menyimpan...
                    </>
                  ) : (
                    'Simpan Profil'
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={savingProfile}
                  className="px-4 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" /> Batal
                </button>
              </div>
            </form>
          )}
        </div>

        {/* CHANGE PASSWORD SECTION WITH EMAIL OTP VERIFICATION */}
        <form onSubmit={handleChangePassword} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            <KeyRound className="w-4 h-4 text-gray-700" />
            <h2 className="text-sm font-bold text-gray-900">Ubah Kata Sandi (Dengan Verifikasi OTP)</h2>
          </div>

          {/* BREVO SECURITY INFO BANNER */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50/70 border border-blue-100 text-xs text-blue-800">
            <ShieldCheck className="w-4 h-4 mt-0.5 text-blue-600 shrink-0" />
            <div>
              <span className="font-semibold">Verifikasi 2-Langkah Email (Brevo OTP)</span>
              <p className="text-[11px] text-blue-600/90 mt-0.5 leading-relaxed">
                Demi memastikan keamanan dan keaslian pemilik akun, sistem akan mengirimkan 6-digit kode OTP ke email Anda (<strong>{email || 'akun'}</strong>) sebelum kata sandi dapat diubah.
              </p>
            </div>
          </div>

          {passwordMsg.text && (
            <div className={`p-3 rounded-xl flex items-center gap-2 text-xs font-medium ${
              passwordMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              {passwordMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              {passwordMsg.text}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Kata Sandi Saat Ini</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-blue-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Kata Sandi Baru</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-blue-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Konfirmasi Kata Sandi Baru</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ulangi kata sandi baru"
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-blue-500 transition-all"
            />
          </div>

          {/* OTP VERIFICATION BOX */}
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <label className="block text-xs font-bold text-gray-800">
                  Kode Verifikasi (OTP) Email
                </label>
                <p className="text-[11px] text-gray-500">
                  Bukti kepemilikan akun via kode 6-digit email
                </p>
              </div>
              <button
                type="button"
                onClick={handleRequestOtp}
                disabled={sendingOtp || otpCountdown > 0 || !currentPassword}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs shrink-0"
              >
                {sendingOtp ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Mengirim...
                  </>
                ) : otpCountdown > 0 ? (
                  `Kirim Ulang (${otpCountdown}s)`
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" /> Kirim Kode OTP
                  </>
                )}
              </button>
            </div>

            <div>
              <input
                type="text"
                maxLength={6}
                required
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="Masukkan 6-digit OTP (cth: 123456)"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-center font-mono tracking-widest text-base font-bold text-gray-900 bg-white focus:outline-none focus:border-blue-500 transition-all"
              />
              {!currentPassword && (
                <p className="text-[11px] text-amber-600 mt-1">
                  * Masukkan kata sandi saat ini terlebih dahulu untuk meminta kode OTP.
                </p>
              )}
              {otpSent && (
                <p className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3 h-3 shrink-0" /> Kode OTP 6-digit telah dikirim ke <strong>{email}</strong> via Brevo (berlaku 10 menit).
                </p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={savingPassword}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white py-2.5 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
          >
            {savingPassword ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Memverifikasi & Mengubah Kata Sandi...
              </>
            ) : (
              'Verifikasi & Ganti Kata Sandi'
            )}
          </button>
        </form>
      </main>
    </div>
  );
}