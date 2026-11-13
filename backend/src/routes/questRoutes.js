import { Router } from 'express';
import * as quest from '../controllers/questController.js';
import { wajibLogin } from '../middleware/auth.js';

const router = Router();

router.use(wajibLogin);

router.get('/today', quest.hariIni);
router.get('/:id', quest.detail);
router.post('/:id/claim', quest.klaim);

export default router;
