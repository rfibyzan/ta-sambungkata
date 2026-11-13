import { Router } from 'express';
import * as kata from '../controllers/kataController.js';

const router = Router();

router.get('/', kata.daftar);
router.get('/random', kata.acak);
router.get('/:id', kata.detail);

export default router;
