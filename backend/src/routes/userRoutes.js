import { Router } from 'express';
import * as user from '../controllers/userController.js';
import * as kamus from '../controllers/kamusController.js';
import { wajibLogin } from '../middleware/auth.js';
import { uuidParam } from '../middleware/validasiId.js';

const router = Router();

router.param('id', uuidParam('id', 'Pemain tidak ditemukan'));

router.get('/:id', user.profil);
router.put('/:id', wajibLogin, user.ubah);
router.get('/:id/kamus', wajibLogin, kamus.daftar);
router.get('/:id/kamus/:kataId', wajibLogin, kamus.detail);

export default router;
