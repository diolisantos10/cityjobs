const { query } = require('../config/database');

class Payment {
  static async create({ job_id, package_id, amount_cents, stripe_payment_intent_id, stripe_session_id }) {
    const { rows } = await query(
      `INSERT INTO payments (job_id, package_id, amount_cents, stripe_payment_intent_id, stripe_session_id)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [job_id, package_id, amount_cents, stripe_payment_intent_id, stripe_session_id]
    );
    return rows[0];
  }

  static async findByStripeSession(stripe_session_id) {
    const { rows } = await query(
      'SELECT * FROM payments WHERE stripe_session_id = $1',
      [stripe_session_id]
    );
    return rows[0] || null;
  }

  static async findByStripePaymentIntent(stripe_payment_intent_id) {
    const { rows } = await query(
      'SELECT * FROM payments WHERE stripe_payment_intent_id = $1',
      [stripe_payment_intent_id]
    );
    return rows[0] || null;
  }

  static async findByJobId(job_id) {
    const { rows } = await query(
      `SELECT p.*, pk.name AS package_name, pk.type AS package_type
       FROM payments p JOIN packages pk ON pk.id = p.package_id
       WHERE p.job_id = $1 ORDER BY p.created_at DESC`,
      [job_id]
    );
    return rows;
  }

  static async approve(id) {
    const { rows } = await query(
      `UPDATE payments SET status='approved', paid_at=NOW(), updated_at=NOW()
       WHERE id=$1 RETURNING *`,
      [id]
    );
    return rows[0];
  }

  static async fail(id) {
    const { rows } = await query(
      `UPDATE payments SET status='failed', failed_at=NOW(), updated_at=NOW()
       WHERE id=$1 RETURNING *`,
      [id]
    );
    return rows[0];
  }
}

module.exports = Payment;
