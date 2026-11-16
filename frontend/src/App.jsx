import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { AppLayout, FokusLayout } from './components/Layout.jsx';
import Masuk from './pages/Masuk.jsx';
import Beranda from './pages/Beranda.jsx';
import PilihMode from './pages/PilihMode.jsx';
import Game from './pages/Game.jsx';
import HasilGame from './pages/HasilGame.jsx';
import Kamusku from './pages/Kamusku.jsx';
import DetailKata from './pages/DetailKata.jsx';
import Peringkat from './pages/Peringkat.jsx';
import DetailPemain from './pages/DetailPemain.jsx';
import Riwayat from './pages/Riwayat.jsx';
import DetailGame from './pages/DetailGame.jsx';
import Quest from './pages/Quest.jsx';
import DetailQuest from './pages/DetailQuest.jsx';
import Profil from './pages/Profil.jsx';
import EditProfil from './pages/EditProfil.jsx';
import Tentang from './pages/Tentang.jsx';
import TidakDitemukan from './pages/TidakDitemukan.jsx';

const JUDUL = [
  [/^\/$/, 'Beranda'],
  [/^\/main/, 'Main'],
  [/^\/kamus/, 'Kamusku'],
  [/^\/peringkat|^\/pemain/, 'Peringkat'],
  [/^\/riwayat/, 'Riwayat'],
  [/^\/quest/, 'Daily Quest'],
  [/^\/profil/, 'Profil'],
  [/^\/tentang/, 'Tentang Aplikasi'],
  [/^\/masuk/, 'Masuk'],
];

function JudulTab() {
  const { pathname } = useLocation();
  useEffect(() => {
    const judul = JUDUL.find(([pola]) => pola.test(pathname))?.[1];
    document.title = judul ? `${judul} · SambungKata` : 'SambungKata';
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <>
      <JudulTab />
      <Routes>
        <Route path="/masuk" element={<Masuk />} />
        <Route element={<FokusLayout />}>
          <Route path="/main/:gameId" element={<Game />} />
          <Route path="/main/hasil/:gameId" element={<HasilGame />} />
        </Route>
        <Route element={<AppLayout />}>
          <Route index element={<Beranda />} />
          <Route path="/main" element={<PilihMode />} />
          <Route path="/kamus" element={<Kamusku />} />
          <Route path="/kamus/:kataId" element={<DetailKata />} />
          <Route path="/peringkat" element={<Peringkat />} />
          <Route path="/pemain/:userId" element={<DetailPemain />} />
          <Route path="/riwayat" element={<Riwayat />} />
          <Route path="/riwayat/:gameId" element={<DetailGame />} />
          <Route path="/quest" element={<Quest />} />
          <Route path="/quest/:id" element={<DetailQuest />} />
          <Route path="/profil" element={<Profil />} />
          <Route path="/profil/edit" element={<EditProfil />} />
          <Route path="/tentang" element={<Tentang />} />
          <Route path="*" element={<TidakDitemukan />} />
        </Route>
      </Routes>
    </>
  );
}
