import { useState } from 'react';
import { klaimQuest } from '../api/quests.js';
import { pesanError } from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';

// Klaim quest lalu perbarui daftar quest dan data user (XP, level, streak).
// onHadiah: opsional, untuk induk yang menampilkan bar XP di luar komponen pemanggil.
export function useKlaim(setData, onHadiah) {
  const { setUser } = useAuth();
  const [mengklaim, setMengklaim] = useState(null);
  const [pesan, setPesan] = useState(null);
  // hadiah memicu lencana +XP; kunci baru memutar ulang animasinya.
  const [hadiah, setHadiah] = useState(null);

  async function klaim(quest) {
    setMengklaim(quest.id);
    setPesan(null);
    try {
      const hasil = await klaimQuest(quest.id);
      setData((d) => ({
        ...d,
        xp: hasil.xp,
        level: hasil.level,
        streak: hasil.streak,
        quests: d.quests.map((q) => (q.id === quest.id ? { ...q, diklaim: true } : q)),
      }));
      setUser((u) => (u ? { ...u, xp: hasil.xp, level: hasil.level, streak: hasil.streak } : u));
      let teks = `+${hasil.xp_didapat} XP didapat.`;
      if (hasil.naik_level) teks += ` Naik ke level ${hasil.level}!`;
      if (hasil.streak_bertambah) teks += ` Streak ${hasil.streak} hari.`;
      setPesan({ jenis: 'sukses', teks });
      const h = { xp: hasil.xp_didapat, kunci: Date.now() };
      setHadiah(h);
      onHadiah?.(h);
    } catch (err) {
      setPesan({ jenis: 'error', teks: pesanError(err) });
    } finally {
      setMengklaim(null);
    }
  }

  return { klaim, mengklaim, pesan, hadiah };
}
