/**
 * SchedulerService
 * Builds the publication schedule for a job based on the purchased package.
 * Rules:
 *  - Never schedule before payment is confirmed
 *  - Stories go out during peak hours: 8h, 12h, 18h (BRT)
 *  - multi_story_same_day → 3 posts spread across peak hours on same day
 *  - multi_day_story      → 1 post per day for X days at best peak hour
 *  - highlight_7d         → 1 post + highlight flag for 7 days
 *  - single_story         → 1 post at next available peak hour
 */

const Publication = require('../models/Publication');

// Peak hours in BRT (UTC-3). Stored as UTC in DB.
const PEAK_HOURS_BRT = [8, 12, 18];
const BRT_OFFSET_HOURS = 3; // BRT = UTC-3

function brtHourToUtc(brtHour) {
  return (brtHour + BRT_OFFSET_HOURS) % 24;
}

function nextAvailableSlot(fromDate = new Date()) {
  const now = new Date(fromDate);
  // Add 30 min buffer to ensure "next" slot is in the future
  now.setMinutes(now.getMinutes() + 30);

  const brtHourNow = (now.getUTCHours() - BRT_OFFSET_HOURS + 24) % 24;

  for (const peakBrt of PEAK_HOURS_BRT) {
    if (peakBrt > brtHourNow) {
      const slot = new Date(now);
      slot.setUTCHours(brtHourToUtc(peakBrt), 0, 0, 0);
      return slot;
    }
  }

  // All peak hours today passed → use first peak hour tomorrow
  const tomorrow = new Date(now);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(brtHourToUtc(PEAK_HOURS_BRT[0]), 0, 0, 0);
  return tomorrow;
}

function peakSlotsForDay(date) {
  return PEAK_HOURS_BRT.map(brtH => {
    const slot = new Date(date);
    slot.setUTCHours(brtHourToUtc(brtH), 0, 0, 0);
    return slot;
  });
}

function addDays(date, days) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

/**
 * Builds and persists the publication schedule.
 *
 * @param {Object} job
 * @param {Object} payment
 * @param {Object} pkg  - package row from DB
 * @returns {Promise<Publication[]>}
 */
async function buildSchedule(job, payment, pkg) {
  const slots = [];

  switch (pkg.type) {
    case 'single_story': {
      slots.push({ date: nextAvailableSlot(), order: 1 });
      break;
    }

    case 'multi_story_same_day': {
      const daySlots = peakSlotsForDay(nextAvailableSlot());
      daySlots.forEach((d, i) => slots.push({ date: d, order: i + 1 }));
      break;
    }

    case 'multi_day_story': {
      const startSlot = nextAvailableSlot();
      const bestPeak = PEAK_HOURS_BRT[2]; // 18h = highest engagement
      for (let i = 0; i < (pkg.days_span || 7); i++) {
        const d = addDays(startSlot, i);
        d.setUTCHours(brtHourToUtc(bestPeak), 0, 0, 0);
        slots.push({ date: d, order: i + 1 });
      }
      break;
    }

    case 'highlight_7d': {
      // 1 story post + highlight tracked for 7 days
      slots.push({ date: nextAvailableSlot(), order: 1 });
      break;
    }

    default:
      throw new Error(`Unknown package type: ${pkg.type}`);
  }

  const publications = await Publication.bulkCreate(
    slots.map(({ date, order }) => ({
      job_id: job.id,
      payment_id: payment.id,
      scheduled_for: date,
      sequence_order: order,
      story_copy: job.story_copy,
      art_url: job.art_url,
    }))
  );

  return publications;
}

module.exports = { buildSchedule, nextAvailableSlot };
