import { useState } from 'react';
import { klaimQuest } from '../api/quests.js';
import { pesanError } from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';

// Klaim quest lalu perbarui daftar quest dan data user (XP, level, streak).
export function useKlaim(setData) {
  const { setUser } = useAuth();
  const [mengklaim, setMengklaim] = useState(null);
  const [pesan, setPesan] = useState(null);

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
    } catch (err) {
      setPesan({ jenis: 'error', teks: pesanError(err) });
    } finally {
      setMengklaim(null);
    }
  }

  return { klaim, mengklaim, pesan };
}
