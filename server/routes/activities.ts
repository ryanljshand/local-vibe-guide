import { Router, type Request, type Response } from 'express';
import { resolveContext } from '../lib/geocode';
import { buildPlan, recommendForMood } from '../lib/recommend';
import { activeLlmProvider } from '../lib/llm';
import type { GeoContext } from '../lib/types';

const router = Router();

// GET /api/activities/context?lat=&lng=  OR  ?location=
router.get('/context', async (req: Request, res: Response) => {
  try {
    const { lat, lng, location } = req.query as Record<string, string>;
    const ctx = await resolveContext({
      lat: lat != null ? parseFloat(lat) : undefined,
      lng: lng != null ? parseFloat(lng) : undefined,
      location: location || undefined,
    });
    res.json(ctx);
  } catch (err) {
    res.status(400).json({ error: (err as Error)?.message ?? 'Failed to resolve context' });
  }
});

// POST /api/activities/situations  body: GeoContext
// Returns the moods derived from what's actually happening tonight.
router.post('/situations', async (req: Request, res: Response) => {
  try {
    const ctx = req.body as GeoContext;
    const plan = await buildPlan(ctx);
    res.json({
      greeting: ctx.greeting,
      moods: plan.moods.map((m) => ({
        ...m,
        eventCount: plan.allocation.get(m.id)?.length ?? 0,
      })),
      sourcesUsed: plan.sourcesUsed,
      mockOnly: plan.mockOnly,
      llmProvider: activeLlmProvider(),
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error)?.message ?? 'Failed to build situations' });
  }
});

// POST /api/activities/recommend  body: { ...GeoContext, moodId, userAge }
router.post('/recommend', async (req: Request, res: Response) => {
  try {
    const { moodId, userAge, ...ctx } = req.body as GeoContext & { moodId: string; userAge?: string };
    const result = await recommendForMood(ctx, moodId, userAge ?? 'Millennial');
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: (err as Error)?.message ?? 'Failed to recommend' });
  }
});

export default router;
