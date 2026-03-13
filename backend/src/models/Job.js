const { query } = require('../config/database');

class Job {
  static async create({ company_id, title, description, requirements, benefits,
    salary_min, salary_max, salary_display, contract_type, work_model, location, neighborhood }) {
    const { rows } = await query(
      `INSERT INTO jobs
         (company_id, title, description, requirements, benefits,
          salary_min, salary_max, salary_display, contract_type, work_model, location, neighborhood)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [company_id, title, description, requirements, benefits,
       salary_min, salary_max, salary_display, contract_type, work_model, location, neighborhood]
    );
    return rows[0];
  }

  static async findById(id) {
    const { rows } = await query(
      `SELECT j.*, c.name AS company_name, c.email AS company_email,
              c.instagram_handle AS company_instagram
       FROM jobs j
       JOIN companies c ON c.id = j.company_id
       WHERE j.id = $1`,
      [id]
    );
    return rows[0] || null;
  }

  static async updateStatus(id, status, extra = {}) {
    const fields = ['status = $2', 'updated_at = NOW()'];
    const values = [id, status];
    let idx = 3;

    for (const [key, val] of Object.entries(extra)) {
      fields.push(`${key} = $${idx++}`);
      values.push(val);
    }

    const { rows } = await query(
      `UPDATE jobs SET ${fields.join(', ')} WHERE id = $1 RETURNING *`,
      values
    );
    return rows[0];
  }

  static async updateNiche(id, { niche, niche_confidence, niche_tags }) {
    const { rows } = await query(
      `UPDATE jobs SET niche=$2, niche_confidence=$3, niche_tags=$4, updated_at=NOW()
       WHERE id=$1 RETURNING *`,
      [id, niche, niche_confidence, niche_tags]
    );
    return rows[0];
  }

  static async updateRisk(id, { risk_level, risk_score, risk_flags }) {
    const { rows } = await query(
      `UPDATE jobs SET risk_level=$2, risk_score=$3, risk_flags=$4, updated_at=NOW()
       WHERE id=$1 RETURNING *`,
      [id, risk_level, risk_score, JSON.stringify(risk_flags)]
    );
    return rows[0];
  }

  static async updateStoryCopy(id, { story_copy }) {
    const { rows } = await query(
      `UPDATE jobs SET story_copy=$2, story_copy_generated_at=NOW(), updated_at=NOW()
       WHERE id=$1 RETURNING *`,
      [id, story_copy]
    );
    return rows[0];
  }

  static async updateArt(id, { art_url }) {
    const { rows } = await query(
      `UPDATE jobs SET art_url=$2, art_generated_at=NOW(), updated_at=NOW()
       WHERE id=$1 RETURNING *`,
      [id, art_url]
    );
    return rows[0];
  }

  static async listByStatus(status, limit = 50) {
    const { rows } = await query(
      `SELECT j.*, c.name AS company_name
       FROM jobs j JOIN companies c ON c.id = j.company_id
       WHERE j.status = $1
       ORDER BY j.created_at DESC LIMIT $2`,
      [status, limit]
    );
    return rows;
  }

  static async listAll({ page = 1, limit = 20, status, niche, risk_level } = {}) {
    const conditions = [];
    const values = [];
    let idx = 1;

    if (status)     { conditions.push(`j.status = $${idx++}`);     values.push(status); }
    if (niche)      { conditions.push(`j.niche = $${idx++}`);      values.push(niche); }
    if (risk_level) { conditions.push(`j.risk_level = $${idx++}`); values.push(risk_level); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * limit;

    const { rows } = await query(
      `SELECT j.*, c.name AS company_name
       FROM jobs j JOIN companies c ON c.id = j.company_id
       ${where}
       ORDER BY j.created_at DESC
       LIMIT $${idx++} OFFSET $${idx}`,
      [...values, limit, offset]
    );
    return rows;
  }
}

module.exports = Job;
