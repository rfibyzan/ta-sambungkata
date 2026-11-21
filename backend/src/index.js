import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import kataRoutes from './routes/kataRoutes.js';
import userRoutes from './routes/userRoutes.js';
import gameRoutes from './routes/gameRoutes.js';
import leaderboardRoutes from './routes/leaderboardRoutes.js';
import questRoutes from './routes/questRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim()) : '*' }));
// Foto profil dikirim sebagai base64 (maks 200 KB setelah decode), jadi route ini butuh
// batas lebih besar. Dipasang lebih dulu: parser global melewati body yang sudah dibaca.
app.use('/api/users/:id/avatar', express.json({ limit: '300kb' }));
app.use(express.json({ limit: '50kb' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', waktu: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/kata', kataRoutes);
app.use('/api/users', userRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/quests', questRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

if (!process.env.VERCEL) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`API berjalan di http://localhost:${port}`));
}

export default app;
