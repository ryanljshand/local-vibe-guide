// Live CLI demo — see what the engine actually returns for a city, no browser.
//
//   npm run demo -- "Los Angeles, CA"
//   npm run demo -- "Brooklyn, NY" "Gen Z"
//
// On a machine with open network this pulls REAL events from the niche sources
// (RA / KCRW & co. / Eventbrite) — no API key needed. Add TICKETMASTER_API_KEY
// and ANTHROPIC_API_KEY to .env to enrich. With no network it falls back to
// sample data so it always prints something.

import '../server/lib/http'; // proxy-aware fetch
import { resolveContext } from '../server/lib/geocode';
import { buildPlan, recommendForMood } from '../server/lib/recommend';
import { activeLlmProvider } from '../server/lib/llm';

const C = {
  dim: (s: string) => `\x1b[2m${s}\x1b[0m`,
  bold: (s: string) => `\x1b[1m${s}\x1b[0m`,
  cyan: (s: string) => `\x1b[36m${s}\x1b[0m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  magenta: (s: string) => `\x1b[35m${s}\x1b[0m`,
};

async function main() {
  const location = process.argv[2] || 'Los Angeles, CA';
  const generation = process.argv[3] || 'Millennial';

  console.log(C.dim('Resolving context…'));
  const ctx = await resolveContext({ location });

  console.log('');
  console.log(C.bold(C.cyan(`📍 ${ctx.location}`)) + C.dim(`  ${ctx.dayOfWeek} ${ctx.timeOfDay} · ${ctx.condition} · ${ctx.temperature}°F`));
  console.log(C.dim(`   voice: ${generation} · writer: ${activeLlmProvider()}${ctx.degraded ? ' · (degraded: live geo/weather unavailable)' : ''}`));

  const plan = await buildPlan(ctx);
  console.log('');
  console.log(
    plan.mockOnly
      ? C.yellow('⚠ Sample mode — no live source reachable (blocked network / no events). Showing mock data.')
      : C.green(`✓ Live sources: ${plan.sourcesUsed.join(', ')}`),
  );
  console.log(C.dim(`  Moods tonight: ${plan.moods.map((m) => `${m.label} (${plan.allocation.get(m.id)?.length ?? 0})`).join(' · ')}`));

  for (const mood of plan.moods) {
    const rec = await recommendForMood(ctx, mood.id, generation);
    if (!rec.activities.length) continue;
    console.log('');
    console.log(C.bold(C.magenta(`\n══ ${mood.label.toUpperCase()} ═══════════════════════════════`)));
    for (const a of rec.activities) {
      const via = a.sourceLabel && a.sourceLabel !== 'Sample' ? C.dim(`  · via ${a.sourceLabel}`) : '';
      console.log('');
      console.log(`  ${a.emoji} ${C.bold(a.title)}${via}`);
      console.log(C.dim(`     ${a.description}`));
      const loc = [a.venueName, a.neighborhood].filter(Boolean).join(' · ');
      console.log(C.dim(`     📍 ${loc}   ⏱ ${a.duration}   ⚡ ${a.energyLevel}`));
      for (const tip of a.tips) console.log(C.dim(`     › ${tip}`));
      if (a.specialNote) console.log(C.yellow(`     ★ ${a.specialNote}`));
      if (a.playlists?.length) console.log(C.green(`     🎧 ${a.playlists.map((p) => p.query).join(' · ')}`));
    }
  }
  console.log('');
}

main().catch((err) => {
  console.error('demo failed:', err);
  process.exit(1);
});
