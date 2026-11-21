import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AtSign, Camera, CircleAlert, CircleCheck, Lock, Mail, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { hapusAvatar, ubahAvatar, ubahProfil } from '../api/users.js';
import { perkecilFoto } from '../lib/gambar.js';
import { cekUsername } from '../api/auth.js';
import { pesanError } from '../api/axios.js';
import { Avatar, HeaderDetail, Tombol } from '../components/ui.jsx';

export default function EditProfil() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState(user.username);
  const [cek, setCek] = useState(null);
  const [error, setError] = useState(null);
  const [menyimpan, setMenyimpan] = useState(null); // null | 'foto' | 'username'
  // foto: null (tidak berubah), { dataUrl } (foto baru), atau { hapus: true }.
  const [foto, setFoto] = useState(null);
  const [errorFoto, setErrorFoto] = useState(null);
  const [memproses, setMemproses] = useState(false);
  const inputFoto = useRef(null);
  const usernameBerubah = username !== user.username;
  const berubah = usernameBerubah || foto !== null;
  const formatValid = /^[a-z0-9._]{3,20}$/.test(username);
  const avatarTampil = foto?.dataUrl ?? (foto?.hapus ? null : user.avatar_url);

  async function pilihFoto(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setErrorFoto(null);
    setMemproses(true);
    try {
      setFoto({ dataUrl: await perkecilFoto(file) });
    } catch (err) {
      setErrorFoto(err.message);
    } finally {
      setMemproses(false);
    }
  }

  useEffect(() => {
    if (!usernameBerubah || !formatValid) {
      setCek(null);
      return undefined;
    }
    const t = setTimeout(() => {
      cekUsername(username)
        .then(setCek)
        .catch(() => setCek(null));
    }, 400);
    return () => clearTimeout(t);
  }, [username, usernameBerubah, formatValid]);

  // Foto dan username disimpan dengan dua request: foto dulu, lalu username.
  async function simpan(e) {
    e.preventDefault();
    if (!berubah) return navigate('/profil');
    if (usernameBerubah && !formatValid) return setError('3 sampai 20 karakter: huruf kecil, angka, titik, atau garis bawah');
    setError(null);
    setErrorFoto(null);
    let fotoTersimpan = false;
    if (foto) {
      setMenyimpan('foto');
      try {
        const baru = foto.hapus ? await hapusAvatar(user.id) : await ubahAvatar(user.id, foto.dataUrl);
        setUser((u) => ({ ...u, ...baru }));
        setFoto(null);
        fotoTersimpan = true;
      } catch (err) {
        setErrorFoto(err?.response?.status === 400 ? pesanError(err) : 'Foto gagal diunggah. Coba lagi atau pilih foto lain.');
        setMenyimpan(null);
        return;
      }
    }
    if (usernameBerubah) {
      setMenyimpan('username');
      try {
        const baru = await ubahProfil(user.id, { username });
        setUser((u) => ({ ...u, ...baru }));
      } catch (err) {
        setError(fotoTersimpan ? `Foto tersimpan, tapi username gagal diubah: ${pesanError(err)}` : pesanError(err));
        setMenyimpan(null);
        return;
      }
    }
    navigate('/profil', { replace: true });
  }

  const pesan = error || (usernameBerubah && !formatValid ? '3 sampai 20 karakter: huruf kecil, angka, titik, atau garis bawah' : cek && !cek.tersedia ? cek.pesan : null);

  return (
    <form onSubmit={simpan} noValidate className="flex max-w-[480px] flex-col gap-6">
      <HeaderDetail judul="Edit Profil" kembaliKe="/profil" />
      <h1 className="sr-only">Edit profil</h1>

      <section aria-label="Foto profil" className="flex flex-col items-center gap-3">
        <Avatar user={{ ...user, username, avatar_url: avatarTampil }} ukuran={96} dekorasi={false} />
        <input ref={inputFoto} type="file" accept="image/jpeg,image/png,image/webp" onChange={pilihFoto} className="hidden" tabIndex={-1} aria-hidden="true" />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => inputFoto.current?.click()}
            disabled={memproses || Boolean(menyimpan)}
            className="inline-flex h-11 items-center gap-1.5 rounded-[10px] border border-line-strong bg-surface px-3.5 text-[13px] font-bold hover:border-ink disabled:opacity-50"
          >
            <Camera size={16} aria-hidden="true" /> {memproses ? 'Memproses...' : 'Ganti foto'}
          </button>
          {avatarTampil && (
            <button
              type="button"
              onClick={() => {
                setFoto(user.avatar_url ? { hapus: true } : null);
                setErrorFoto(null);
              }}
              disabled={Boolean(menyimpan)}
              className="inline-flex h-11 items-center gap-1.5 rounded-[10px] px-3.5 text-[13px] font-bold text-accent hover:bg-accent-soft disabled:opacity-50"
            >
              <Trash2 size={16} aria-hidden="true" /> Hapus foto
            </button>
          )}
        </div>
        {errorFoto ? (
          <p role="alert" className="flex items-center gap-1.5 text-xs font-semibold text-accent">
            <CircleAlert size={14} aria-hidden="true" /> {errorFoto}
          </p>
        ) : (
          <p className="text-xs text-muted">
            {foto?.hapus ? 'Foto akan dihapus saat disimpan. Avatar kembali ke inisial.' : 'JPG, PNG, atau WebP. Foto dipotong persegi.'}
          </p>
        )}
      </section>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="username" className="text-[13px] font-bold">
          Username
        </label>
        <div
          className={`flex h-13 items-center gap-2.5 rounded-[14px] bg-surface px-4 focus-within:outline-3 focus-within:outline-ink ${
            pesan ? 'border-2 border-accent' : 'border border-line-strong'
          }`}
        >
          <AtSign size={18} className="text-muted" aria-hidden="true" />
          <input
            id="username"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value.toLowerCase());
              setError(null);
            }}
            autoCapitalize="none"
            autoComplete="username"
            aria-invalid={Boolean(pesan)}
            aria-describedby="info-username"
            className="min-w-0 flex-1 bg-transparent text-[15px] outline-none"
          />
        </div>
        <p id="info-username" className={`flex items-center gap-1.5 text-xs ${pesan ? 'font-semibold text-accent' : cek?.tersedia ? 'font-semibold text-teal' : 'text-muted'}`}>
          {pesan ? <CircleAlert size={14} aria-hidden="true" /> : cek?.tersedia ? <CircleCheck size={14} aria-hidden="true" /> : null}
          {pesan || (cek?.tersedia ? cek.pesan : '3 sampai 20 karakter: huruf kecil, angka, titik, atau garis bawah.')}
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-[13px] font-bold">
          Email
        </label>
        <div className="flex h-13 items-center gap-2.5 rounded-[14px] border border-line bg-bg px-4">
          <Mail size={18} className="text-muted" aria-hidden="true" />
          <input id="email" value={user.email ?? ''} readOnly aria-describedby="info-email" className="min-w-0 flex-1 bg-transparent text-[15px] text-muted outline-none" />
          <Lock size={16} className="text-muted" aria-hidden="true" />
        </div>
        <p id="info-email" className="text-xs text-muted">
          Email tidak bisa diubah.
        </p>
      </div>

      <div className="flex gap-2.5">
        <Tombol varian="garis" onClick={() => navigate('/profil')} className="flex-1">
          Batal
        </Tombol>
        <Tombol type="submit" disabled={Boolean(menyimpan) || memproses || Boolean(pesan)} className="flex-1">
          {menyimpan === 'foto' ? 'Mengunggah...' : menyimpan ? 'Menyimpan...' : 'Simpan'}
        </Tombol>
      </div>
    </form>
  );
}
