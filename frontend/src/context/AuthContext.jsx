import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { sesi } from '../api/axios.js';
import * as authApi from '../api/auth.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [memuat, setMemuat] = useState(() => Boolean(sesi.ambil()));

  const muatUlang = useCallback(async () => {
    if (!sesi.ambil()) {
      setUser(null);
      return null;
    }
    try {
      const data = await authApi.me();
      setUser(data);
      return data;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    if (sesi.ambil()) muatUlang().finally(() => setMemuat(false));
    const keluar = () => setUser(null);
    window.addEventListener('sambungkata:keluar', keluar);
    return () => window.removeEventListener('sambungkata:keluar', keluar);
  }, [muatUlang]);

  const masuk = useCallback(async (email, password) => {
    const data = await authApi.login({ email, password });
    sesi.simpan(data);
    setUser(data.user);
    return data.user;
  }, []);

  const daftar = useCallback(async (body) => {
    const data = await authApi.register(body);
    sesi.simpan(data);
    setUser(data.user);
    return data.user;
  }, []);

  const keluar = useCallback(() => {
    sesi.hapus();
    setUser(null);
  }, []);

  const nilai = useMemo(
    () => ({ user, memuat, masuk, daftar, keluar, muatUlang, setUser }),
    [user, memuat, masuk, daftar, keluar, muatUlang],
  );

  return <AuthContext.Provider value={nilai}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}
