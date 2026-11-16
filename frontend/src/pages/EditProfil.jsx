import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AtSign, CircleAlert, CircleCheck, Lock, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { ubahProfil } from '../api/users.js';
import { cekUsername } from '../api/auth.js';
import { pesanError } from '../api/axios.js';
import { Avatar, HeaderDetail, Tombol } from '../components/ui.jsx';

export default function EditProfil() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState(user.username);
  const [cek, setCek] = useState(null);
  const [error, setError] = useState(null);
  const [menyimpan, setMenyimpan] = useState(false);
  const berubah = username !== user.username;
  const formatValid = /^[a-z0-9._]{3,20}$/.test(username);

  useEffect(() => {
    if (!berubah || !formatValid) {
      setCek(null);
      return undefined;
    }
    const t = setTimeout(() => {
      cekUsername(username)
        .then(setCek)
        .catch(() => setCek(null));
    }, 400);
    return () => clearTimeout(t);
  }, [username, berubah, formatValid]);

  async function simpan(e) {
    e.preventDefault();
    if (!berubah) return navigate('/profil');
    if (!formatValid) return setError('3 sampai 20 karakter: huruf kecil, angka, titik, atau garis bawah');
    setMenyimpan(true);
    setError(null);
    try {
      const baru = await ubahProfil(user.id, { username });
      setUser((u) => ({ ...u, ...baru }));
      navigate('/profil', { replace: true });
    } catch (err) {
      setError(pesanError(err));
      setMenyimpan(false);
    }
  }

  const pesan = error || (berubah && !formatValid ? '3 sampai 20 karakter: huruf kecil, angka, titik, atau garis bawah' : cek && !cek.tersedia ? cek.pesan : null);

  return (
    <form onSubmit={simpan} noValidate className="mx-auto flex max-w-[480px] flex-col gap-6">
      <HeaderDetail judul="Edit Profil" kembaliKe="/profil" />
      <h1 className="sr-only">Edit profil</h1>

      <div className="flex flex-col items-center gap-2">
        <Avatar user={{ ...user, username }} ukuran={96} />
        <p className="text-xs text-muted">Avatar memakai inisial username.</p>
      </div>

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
        <Tombol type="submit" disabled={menyimpan || Boolean(pesan)} className="flex-1">
          {menyimpan ? 'Menyimpan...' : 'Simpan'}
        </Tombol>
      </div>
    </form>
  );
}
