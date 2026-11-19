import cron from 'node-cron';
import * as clockService from './clock.service';

export function start() {
  // Runs hourly rather than once at midnight — the job itself only ever
  // touches shifts from a past Nepal day, so running it more often just
  // means a forgotten clock-out gets capped sooner, with no risk of ever
  // closing a shift that's still legitimately open today.
  cron.schedule('0 * * * *', () => {
    clockService
      .closeStaleOpenShifts()
      .then((count) => {
        if (count > 0) console.log(`[shift-auto-close] Closed ${count} shift(s) left open from a previous day`);
      })
      .catch((err: any) => console.error('[shift-auto-close] Job failed:', err.message));
  });
  console.log('✔ Stale shift auto-close scheduled  →  hourly');
}
