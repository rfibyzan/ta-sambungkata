import { Router } from 'express';
import * as leaderboard from '../controllers/leaderboardController.js';
import { opsionalLogin } from '../middleware/auth.js';

const router = Router();

// Publik. Jika ada token, respons menyertakan posisi_saya.
router.get('/', opsionalLogin, leaderboard.daftar);

export default router;
