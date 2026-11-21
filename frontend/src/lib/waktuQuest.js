// Sisa waktu sampai quest berganti pukul 00.00 WIB (UTC+7), menit dibulatkan ke atas.
const OFFSET_WIB = 7 * 60 * 60 * 1000;
const SEHARI = 24 * 60 * 60 * 1000;

export function sisaHariWib(sekarangMs) {
  const wib = sekarangMs + OFFSET_WIB;
  const sisaMs = SEHARI - (wib % SEHARI);
  const sisaMenit = Math.ceil(sisaMs / 60000);
  return { jam: Math.floor(sisaMenit / 60), menit: sisaMenit % 60 };
}
