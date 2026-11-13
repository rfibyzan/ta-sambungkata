import { Router } from 'express';
import * as auth from '../controllers/authController.js';
import { wajibLogin } from '../middleware/auth.js';

const router = Router();

router.post('/register', auth.register);
router.post('/login', auth.login);
router.post('/refresh', auth.refresh);
router.get('/me', wajibLogin, auth.me);
router.get('/cek-username', auth.cekUsername);

export default router;
