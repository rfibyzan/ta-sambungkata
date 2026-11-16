export default function Skeleton({ className = '' }) {
  return <span aria-hidden="true" className={`block animate-kedip rounded-[6px] bg-skeleton ${className}`} />;
}

// Baris daftar (peringkat, riwayat) saat memuat.
export function SkeletonBaris({ jumlah = 4 }) {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Memuat">
      {Array.from({ length: jumlah }, (_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="size-9 rounded-full" />
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton className={`h-3 ${['w-36', 'w-28', 'w-40', 'w-32'][i % 4]}`} />
            <Skeleton className="h-2.5 w-20" />
          </div>
          <Skeleton className="h-4 w-9" />
        </div>
      ))}
    </div>
  );
}
