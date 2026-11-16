import { useEffect, useId, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, AtSign, CircleAlert, CircleCheck, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { cekUsername } from '../api/auth.js';
import { pesanError } from '../api/axios.js';
import { Tombol } from '../components/ui.jsx';

function Kolom({ label, ikon: Ikon, error, bantuan, sukses, kanan, ...input }) {
  const id = useId();
  const idInfo = `${id}-info`;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-bold">
        {label}
      </label>
      <div
        className={`flex h-13 items-center gap-2.5 rounded-[14px] bg-surface px-4 focus-within:outline-3 focus-within:outline-ink ${
          error ? 'border-2 border-accent' : 'border border-line-strong'
        }`}
      >
        <Ikon size={18} className="shrink-0 text-muted" aria-hidden="true" />
        <input
          id={id}
          aria-invalid={Boolean(error)}
          aria-describedby={error || bantuan || sukses ? idInfo : undefined}
          className="min-w-0 flex-1 bg-transparent text-[15px] outline-none"
          {...input}
        />
        {kanan}
      </div>
      {(error || bantuan || sukses) && (
        <p id={idInfo} className={`flex items-center gap-1.5 text-xs ${error ? 'font-semibold text-accent' : sukses ? 'font-semibold text-teal' : 'text-muted'}`}>
          {error && <CircleAlert size={14} aria-hidden="true" />}
          {sukses && !error && <CircleCheck size={14} aria-hidden="true" />}
          {error || sukses || bantuan}
        </p>
      )}
    </div>
  );
}

function TombolLihat({ lihat, setLihat }) {
  return (
    <button
      type="button"
      onClick={() => setLihat((v) => !v)}
      aria-label={lihat ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
      className="-mr-2 flex size-11 items-center justify-center rounded-full text-muted hover:text-ink"
    >
      {lihat ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
    </button>
  );
}

export default function Masuk() {
  const { user, masuk, daftar } = useAuth();
  const navigate = useNavigate();
  const lokasi = useLocation();
  const [mode, setMode] = useState('masuk');
  const [form, setForm] = useState({ username: '', email: '', password: '', ulangi: '' });
  const [lihat, setLihat] = useState(false);
  const [error, setError] = useState({});
  const [cekNama, setCekNama] = useState(null);
  const [kirim, setKirim] = useState(false);

  const isi = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setError((er) => ({ ...er, [k]: undefined, umum: undefined }));
  };

  useEffect(() => {
    if (mode !== 'daftar' || form.username.length < 3) {
      setCekNama(null);
      return undefined;
    }
    const t = setTimeout(() => {
      cekUsername(form.username.toLowerCase())
        .then(setCekNama)
        .catch(() => setCekNama(null));
    }, 400);
    return () => clearTimeout(t);
  }, [form.username, mode]);

  if (user) return <Navigate to={lokasi.state?.dari ?? '/'} replace />;

  async function onSubmit(e) {
    e.preventDefault();
    const er = {};
    if (mode === 'daftar') {
      if (!/^[a-z0-9._]{3,20}$/.test(form.username)) er.username = '3 sampai 20 karakter: huruf kecil, angka, titik, atau garis bawah';
      else if (cekNama && !cekNama.tersedia) er.username = cekNama.pesan;
      if (form.password.length < 8) er.password = 'Kata sandi minimal 8 karakter';
      if (form.ulangi !== form.password) er.ulangi = 'Kata sandi tidak sama. Ketik ulang.';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) er.email = 'Format email tidak valid';
    if (!form.password) er.password = 'Kata sandi wajib diisi';
    setError(er);
    if (Object.keys(er).length) return;

    setKirim(true);
    try {
      if (mode === 'masuk') await masuk(form.email.trim(), form.password);
      else await daftar({ username: form.username, email: form.email.trim(), password: form.password });
      navigate(lokasi.state?.dari ?? '/', { replace: true });
    } catch (err) {
      setError({ umum: pesanError(err) });
    } finally {
      setKirim(false);
    }
  }

  const daftarMode = mode === 'daftar';

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col gap-7 px-5 pt-12 pb-10">
      <header className="flex flex-col gap-1.5">
        <h1 className="font-head text-[34px] font-extrabold">SambungKata</h1>
        <p className="text-[15px] leading-relaxed text-muted">
          {daftarMode
            ? 'Buat akun supaya kata yang kamu temukan tersimpan di Kamusku.'
            : 'Sambung kata, kumpulkan kosakata, dan naik peringkat.'}
        </p>
      </header>

      <div role="tablist" aria-label="Pilih masuk atau daftar" className="flex rounded-[14px] bg-line p-1">
        {[
          ['masuk', 'Masuk'],
          ['daftar', 'Daftar'],
        ].map(([k, label]) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={mode === k}
            onClick={() => {
              setMode(k);
              setError({});
            }}
            className={`h-11 flex-1 rounded-[10px] text-sm font-bold transition-colors ${mode === k ? 'bg-surface text-ink' : 'text-muted hover:text-ink'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        {daftarMode && (
          <Kolom
            label="Username"
            ikon={AtSign}
            autoComplete="username"
            autoCapitalize="none"
            placeholder="mis. sintaayu"
            value={form.username}
            onChange={(e) => isi('username')({ target: { value: e.target.value.toLowerCase() } })}
            error={error.username || (cekNama && !cekNama.tersedia ? cekNama.pesan : undefined)}
            sukses={cekNama?.tersedia ? cekNama.pesan : undefined}
            bantuan="3 sampai 20 karakter: huruf kecil, angka, titik, atau garis bawah"
          />
        )}
        <Kolom
          label="Email"
          ikon={Mail}
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="email@contoh.com"
          value={form.email}
          onChange={isi('email')}
          error={error.email}
        />
        <Kolom
          label="Kata sandi"
          ikon={Lock}
          type={lihat ? 'text' : 'password'}
          autoComplete={daftarMode ? 'new-password' : 'current-password'}
          placeholder={daftarMode ? 'Minimal 8 karakter' : 'Kata sandimu'}
          value={form.password}
          onChange={isi('password')}
          error={error.password}
          kanan={<TombolLihat lihat={lihat} setLihat={setLihat} />}
        />
        {daftarMode && (
          <Kolom
            label="Ulangi kata sandi"
            ikon={Lock}
            type={lihat ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Ketik ulang kata sandi"
            value={form.ulangi}
            onChange={isi('ulangi')}
            error={error.ulangi}
          />
        )}

        {error.umum && (
          <p role="alert" className="flex items-center gap-2 rounded-[10px] bg-accent-soft px-3 py-2.5 text-[13px] font-semibold text-accent">
            <CircleAlert size={16} aria-hidden="true" className="shrink-0" />
            {error.umum}
          </p>
        )}

        <Tombol type="submit" disabled={kirim} className="mt-2 w-full">
          {kirim ? 'Memproses...' : daftarMode ? 'Buat akun' : 'Masuk'}
          {!kirim && <ArrowRight size={18} aria-hidden="true" />}
        </Tombol>
      </form>

      <p className="flex items-center justify-center gap-1 text-[13px] text-muted">
        {daftarMode ? 'Sudah punya akun?' : 'Belum punya akun?'}
        <button
          type="button"
          onClick={() => {
            setMode(daftarMode ? 'masuk' : 'daftar');
            setError({});
          }}
          className="flex h-11 items-center px-1 font-bold text-accent hover:underline"
        >
          {daftarMode ? 'Masuk' : 'Daftar gratis'}
        </button>
      </p>
    </main>
  );
}
