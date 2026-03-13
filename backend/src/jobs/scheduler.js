/**
 * Scheduler
 * Runs as a separate process (or via node-cron within the main app).
 * Checks every minute for publications due and publishes them.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const cron = require('node-cron');
const Publication = require('../models/Publication');
const Job = require('../models/Job');
const { publishStory } = require('../services/instagramService');
const logger = require('../config/logger');

const MAX_RETRIES = 3;

async function processDuePublications() {
  logger.info('[Scheduler] Checking for due publications...');

  const due = await Publication.findDuePending();
  if (due.length === 0) {
    logger.debug('[Scheduler] No publications due.');
    return;
  }

  logger.info(`[Scheduler] Found ${due.length} publication(s) to process.`);

  for (const pub of due) {
    await processPublication(pub);
  }
}

async function processPublication(pub) {
  logger.info(`[Scheduler] Processing publication ${pub.id} for job "${pub.job_title}"`);

  // Mark as publishing to prevent double-processing
  await Publication.updateStatus(pub.id, 'publishing');

  try {
    const result = await publishStory(pub);

    await Publication.updateStatus(pub.id, 'published', {
      instagram_media_id: result.media_id,
      instagram_permalink: result.permalink,
    });

    // Check if all publications for this job are done
    await checkJobCompletion(pub.job_id);

    logger.info(`[Scheduler] Published ${pub.id} → ${result.permalink}`);
  } catch (err) {
    logger.error(`[Scheduler] Failed to publish ${pub.id}: ${err.message}`);

    const retryCount = (pub.retry_count || 0) + 1;

    if (retryCount >= MAX_RETRIES) {
      // Send to manual queue
      await Publication.updateStatus(pub.id, 'manual_required', {
        error_message: err.message,
        retry_count: retryCount,
      });
      logger.warn(`[Scheduler] Publication ${pub.id} sent to manual queue after ${MAX_RETRIES} retries.`);
    } else {
      // Reschedule with exponential backoff (30 min * retry)
      const retryInMs = retryCount * 30 * 60 * 1000;
      const newSchedule = new Date(Date.now() + retryInMs);

      await Publication.updateStatus(pub.id, 'scheduled', {
        error_message: err.message,
        retry_count: retryCount,
        scheduled_for: newSchedule,
      });
      logger.info(`[Scheduler] Rescheduled ${pub.id} for retry ${retryCount} at ${newSchedule}`);
    }
  }
}

async function checkJobCompletion(jobId) {
  const publications = await Publication.findByJobId(jobId);
  const allDone = publications.every(p => p.status === 'published' || p.status === 'cancelled');
  if (allDone && publications.length > 0) {
    await Job.updateStatus(jobId, 'completed');
    logger.info(`[Scheduler] Job ${jobId} marked as completed.`);
  }
}

// ─── Run ───────────────────────────────────────────────────────────────────

// Cron: every minute
cron.schedule('* * * * *', async () => {
  try {
    await processDuePublications();
  } catch (err) {
    logger.error('[Scheduler] Unexpected error:', err);
  }
});

logger.info('[Scheduler] Started. Checking every minute for due publications.');

module.exports = { processDuePublications, processPublication };
