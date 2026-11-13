import { Router } from 'express';
import * as game from '../controllers/gameController.js';
import { wajibLogin } from '../middleware/auth.js';
import { uuidParam } from '../middleware/validasiId.js';

const router = Router();

router.use(wajibLogin);
router.param('id', uuidParam('id', 'Game tidak ditemukan'));

router.post('/', game.mulai);
router.get('/', game.riwayat);
router.get('/:id', game.detail);
router.post('/:id/moves', game.kirimKata);
router.put('/:id', game.selesaikan);
router.delete('/:id', game.hapus);

export default router;
