/**
 * JobProcessingService
 * Orchestrates the full pipeline after payment approval:
 *  1. Validate required fields
 *  2. Classify niche
 *  3. Analyze risk
 *  4. Generate story copy
 *  5. Build publication schedule
 *
 * CRITICAL: Never proceeds if payment is not 'approved'.
 */

const Job = require('../models/Job');
const Company = require('../models/Company');
const Payment = require('../models/Payment');
const Package = require('../models/Package');
const { classifyNiche } = require('./nicheClassifier');
const { analyzeRisk } = require('./riskAnalysis');
const { generateStoryCopy } = require('./copyGenerator');
const { buildSchedule } = require('./schedulerService');
const logger = require('../config/logger');

/**
 * @param {string} jobId
 * @param {string} paymentId
 */
async function processJobAfterPayment(jobId, paymentId) {
  logger.info(`[JobProcessing] Starting pipeline for job ${jobId}`);

  // ─── 1. Load entities ─────────────────────────────────────────────────────
  const job = await Job.findById(jobId);
  if (!job) throw new Error(`Job not found: ${jobId}`);

  const payments = await Payment.findByJobId(jobId);
  const payment = payments.find(p => p.id === paymentId);
  if (!payment) throw new Error(`Payment not found: ${paymentId}`);

  // GUARD: Never process without approved payment
  if (payment.status !== 'approved') {
    logger.warn(`[JobProcessing] Payment ${paymentId} not approved (${payment.status}). Aborting.`);
    throw new Error('Cannot process job: payment not approved');
  }

  const company = await Company.findById(job.company_id);
  const pkg = await Package.findById(payment.package_id);

  // Update job status to under_review
  await Job.updateStatus(jobId, 'under_review');

  // ─── 2. Classify niche ────────────────────────────────────────────────────
  logger.info(`[JobProcessing] Classifying niche for job ${jobId}`);
  const nicheResult = classifyNiche(job);
  await Job.updateNiche(jobId, {
    niche: nicheResult.niche,
    niche_confidence: nicheResult.confidence,
    niche_tags: nicheResult.tags,
  });
  Object.assign(job, nicheResult); // update in-memory

  // ─── 3. Analyze risk ──────────────────────────────────────────────────────
  logger.info(`[JobProcessing] Analyzing risk for job ${jobId}`);
  const riskResult = analyzeRisk(job, company);
  await Job.updateRisk(jobId, riskResult);

  if (riskResult.blocked) {
    await Job.updateStatus(jobId, 'rejected', {
      rejection_reason: `Risk blocked: ${riskResult.risk_flags.join('; ')}`,
    });
    logger.warn(`[JobProcessing] Job ${jobId} BLOCKED. Flags: ${riskResult.risk_flags.join(', ')}`);
    return { status: 'rejected', reason: riskResult.risk_flags };
  }

  // ─── 4. Generate story copy ───────────────────────────────────────────────
  logger.info(`[JobProcessing] Generating story copy for job ${jobId}`);
  const storyCopy = await generateStoryCopy({ ...job, niche: nicheResult.niche }, company);
  await Job.updateStoryCopy(jobId, { story_copy: storyCopy });
  Object.assign(job, { story_copy: storyCopy, niche: nicheResult.niche });

  // ─── 5. Build publication schedule ───────────────────────────────────────
  logger.info(`[JobProcessing] Building schedule for job ${jobId}, package ${pkg.type}`);
  const publications = await buildSchedule(job, payment, pkg);

  // Mark job as approved (ready for publishing)
  await Job.updateStatus(jobId, 'approved');

  logger.info(`[JobProcessing] Pipeline complete. ${publications.length} publication(s) scheduled.`);

  return {
    status: 'approved',
    niche: nicheResult,
    risk: riskResult,
    story_copy: storyCopy,
    publications,
  };
}

module.exports = { processJobAfterPayment };
