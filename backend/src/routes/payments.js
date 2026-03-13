const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Payment = require('../models/Payment');
const Package = require('../models/Package');
const Job = require('../models/Job');
const { processJobAfterPayment } = require('../services/jobProcessingService');
const logger = require('../config/logger');

// POST /api/payments/checkout — create Stripe Checkout Session
router.post('/checkout', async (req, res, next) => {
  try {
    const { job_id, package_id } = req.body;

    const job = await Job.findById(job_id);
    if (!job) return res.status(404).json({ error: { message: 'Vaga não encontrada' } });

    if (job.status !== 'pending_payment') {
      return res.status(400).json({ error: { message: 'Pagamento já processado para esta vaga' } });
    }

    const pkg = await Package.findById(package_id);
    if (!pkg) return res.status(404).json({ error: { message: 'Pacote não encontrado' } });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: `CityJobs — ${pkg.name}`,
              description: `Vaga: ${job.title} | Empresa: ${job.company_name}`,
            },
            unit_amount: pkg.price_cents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/checkout?job_id=${job_id}&cancelled=1`,
      metadata: { job_id, package_id },
      customer_email: job.company_email,
    });

    // Create pending payment record
    await Payment.create({
      job_id,
      package_id,
      amount_cents: pkg.price_cents,
      stripe_session_id: session.id,
    });

    res.json({ checkout_url: session.url, session_id: session.id });
  } catch (err) {
    next(err);
  }
});

// POST /api/payments/webhook — Stripe webhook
// Must use raw body for signature verification
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    logger.error(`[Webhook] Signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      await handlePaymentSuccess(session);
    } else if (event.type === 'checkout.session.expired' || event.type === 'payment_intent.payment_failed') {
      const obj = event.data.object;
      await handlePaymentFailure(obj);
    }

    res.json({ received: true });
  } catch (err) {
    logger.error(`[Webhook] Handler error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

async function handlePaymentSuccess(session) {
  const { job_id, package_id } = session.metadata;
  logger.info(`[Payment] Session completed for job ${job_id}`);

  const payment = await Payment.findByStripeSession(session.id);
  if (!payment) {
    logger.error(`[Payment] No payment record for session ${session.id}`);
    return;
  }

  await Payment.approve(payment.id);
  await Job.updateStatus(job_id, 'payment_approved');

  // Trigger async processing pipeline
  processJobAfterPayment(job_id, payment.id).catch(err => {
    logger.error(`[Payment] Pipeline error for job ${job_id}: ${err.message}`);
  });
}

async function handlePaymentFailure(obj) {
  const sessionId = obj.id;
  const payment = await Payment.findByStripeSession(sessionId);
  if (payment) {
    await Payment.fail(payment.id);
    logger.warn(`[Payment] Payment failed for session ${sessionId}`);
  }
}

// GET /api/payments/status/:sessionId — check payment status (polling fallback)
router.get('/status/:sessionId', async (req, res, next) => {
  try {
    const payment = await Payment.findByStripeSession(req.params.sessionId);
    if (!payment) return res.status(404).json({ error: { message: 'Pagamento não encontrado' } });

    const job = await Job.findById(payment.job_id);
    res.json({ payment, job });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
