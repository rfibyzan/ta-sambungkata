// Setelah halaman game dimuat ulang di tengah jeda bot, kata bot yang waktunya belum tiba
// ditahan dulu. Hanya kata bot (dan kata acak setelah kunci mati buatan bot) yang waktunya
// diatur server; kata lain memakai jam database yang bisa sedikit berbeda, jadi tidak ditahan.
// Aturan yang sama dengan akhirJedaBot di backend/src/config/gameRules.js.
export function pisahTertunda(rantai, sekarang) {
  const dariBot = (w, i) => w.pemain === 'bot' || (w.pemain === 'sistem' && rantai[i - 1]?.pemain === 'bot');
  const tertunda = rantai.filter((w, i) => dariBot(w, i) && Date.parse(w.created_at) > sekarang);
  return { tampil: rantai.filter((w) => !tertunda.includes(w)), tertunda };
}
