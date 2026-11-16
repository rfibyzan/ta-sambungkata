import { NavLink } from 'react-router-dom';
import { BookOpen, Gamepad2, House, Trophy, UserRound } from 'lucide-react';

export const MENU = [
  { ke: '/', label: 'Beranda', ikon: House, akhir: true },
  { ke: '/main', label: 'Main', ikon: Gamepad2 },
  { ke: '/kamus', label: 'Kamusku', ikon: BookOpen },
  { ke: '/peringkat', label: 'Peringkat', ikon: Trophy },
  { ke: '/profil', label: 'Profil', ikon: UserRound },
];

// Bawah 640px: bottom nav. 640 sampai 1023px: nav rail. 1024px ke atas: sidebar.
export default function BottomNav() {
  return (
    <>
      <nav
        aria-label="Navigasi utama"
        className="fixed inset-x-4 bottom-[max(12px,env(safe-area-inset-bottom))] z-30 sm:hidden"
      >
        <ul className="flex h-[60px] items-stretch rounded-[30px] border border-line bg-surface/95 p-1.5 shadow-[0_6px_20px_rgb(30_27_22/0.1)] backdrop-blur">
          {MENU.map(({ ke, label, ikon: Ikon, akhir }) => (
            <li key={ke} className="flex-1">
              <NavLink
                to={ke}
                end={akhir}
                className={({ isActive }) =>
                  `flex h-full flex-col items-center justify-center gap-0.5 rounded-3xl text-[10px] transition-colors ${
                    isActive ? 'bg-accent-soft font-bold text-accent' : 'font-semibold text-muted hover:text-ink'
                  }`
                }
              >
                <Ikon size={20} aria-hidden="true" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <nav
        aria-label="Navigasi utama"
        className="fixed inset-y-0 left-0 z-30 hidden w-24 flex-col border-r border-line bg-surface px-2.5 py-7 sm:flex lg:w-58 lg:px-4"
      >
        <p className="mb-6 hidden px-3 font-head text-[22px] font-extrabold lg:block">SambungKata</p>
        <ul className="flex flex-col gap-2 lg:gap-1.5">
          {MENU.map(({ ke, label, ikon: Ikon, akhir }) => (
            <li key={ke}>
              <NavLink
                to={ke}
                end={akhir}
                className={({ isActive }) =>
                  `flex h-16 flex-col items-center justify-center gap-1 rounded-[14px] text-[11px] transition-colors lg:h-12 lg:flex-row lg:justify-start lg:gap-3 lg:px-3 lg:text-sm ${
                    isActive ? 'bg-accent-soft font-bold text-accent' : 'font-semibold text-muted hover:bg-bg hover:text-ink'
                  }`
                }
              >
                <Ikon size={22} aria-hidden="true" className="lg:size-5" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
