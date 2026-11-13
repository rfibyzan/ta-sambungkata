import * as kataModel from '../models/kataModel.js';
import { BOT } from '../config/gameRules.js';

// Bibit kosakata bot diambil dari id game, jadi kosakata bot konsisten selama satu game
// tetapi berbeda antar game.
function bibitDariGame(gameId) {
  return Number.parseInt(gameId.replace(/-/g, '').slice(0, 7), 16) % 100_000;
}

// Bot memilih kata dengan awalan tertentu. Mengembalikan null jika bot tidak menemukan kata.
export async function pilihKata(game, awalan, kecuali) {
  return kataModel.pilihanBot({
    awalan,
    kecuali,
    tingkat: game.tingkat,
    persen: BOT.KOSAKATA_PERSEN[game.tingkat] ?? 50,
    seed: bibitDariGame(game.id),
  });
}
