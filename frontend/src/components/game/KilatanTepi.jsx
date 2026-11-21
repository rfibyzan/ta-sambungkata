// Tepi layar menyala merah sekali saat nyawa berkurang. Tengah layar tetap bening supaya
// rantai dan kolom jawaban terbaca. Dipasang ulang (key) setiap kali nyawa berkurang.
export default function KilatanTepi() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50 animate-kilat-tepi"
      style={{
        background:
          'radial-gradient(ellipse at center, transparent 55%, color-mix(in srgb, var(--color-accent) 25%, transparent) 100%)',
      }}
    />
  );
}
