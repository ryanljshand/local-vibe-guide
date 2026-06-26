import './lib/http'; // must be first: makes fetch proxy-aware
import express from 'express';
import cors from 'cors';
import activitiesRouter from './routes/activities';

const app = express();
const PORT = Number(process.env.PORT ?? 3001);

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/activities', activitiesRouter);

app.listen(PORT, () => {
  console.log(`[server] Local Vibe Guide API on http://localhost:${PORT}`);
});
