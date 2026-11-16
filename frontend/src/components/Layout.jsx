import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import BottomNav from './BottomNav.jsx';
import Skeleton from './Skeleton.jsx';

// Halaman utama: wajib login, ada navigasi, konten tidak tertutup bottom nav.
export function AppLayout() {
  return (
    <WajibLogin>
      <BottomNav />
      <div className="sm:pl-24 lg:pl-58">
        <main className="mx-auto w-full max-w-[1100px] px-4 pt-4 pb-[calc(96px+env(safe-area-inset-bottom))] sm:px-8 sm:pt-8 sm:pb-10 lg:px-12">
          <Outlet />
        </main>
      </div>
    </WajibLogin>
  );
}

// Halaman fokus (layar game, hasil): tanpa navigasi.
export function FokusLayout() {
  return (
    <WajibLogin>
      <main className="mx-auto w-full max-w-[560px] px-4 pt-4 pb-8">
        <Outlet />
      </main>
    </WajibLogin>
  );
}

function WajibLogin({ children }) {
  const { user, memuat } = useAuth();
  const lokasi = useLocation();
  if (memuat) {
    return (
      <div className="mx-auto flex max-w-[560px] flex-col gap-4 px-4 pt-8" aria-busy="true" aria-label="Memuat">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-40 w-full rounded-[20px]" />
        <Skeleton className="h-20 w-full rounded-[14px]" />
      </div>
    );
  }
  if (!user) return <Navigate to="/masuk" replace state={{ dari: lokasi.pathname }} />;
  return children;
}
