import StateView from '../components/StateView.jsx';

export default function TidakDitemukan() {
  return (
    <StateView
      keping="404"
      hot={0}
      judul="Halaman tidak ditemukan"
      pesan="Tautan ini mungkin salah atau halamannya sudah dipindah."
      aksi={{ label: 'Ke beranda', ke: '/', gelap: true }}
    />
  );
}
