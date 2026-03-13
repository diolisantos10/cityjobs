const { query } = require('../config/database');

class Publication {
  static async create({ job_id, payment_id, scheduled_for, sequence_order, story_copy, art_url }) {
    const { rows } = await query(
      `INSERT INTO publications (job_id, payment_id, scheduled_for, sequence_order, story_copy, art_url)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [job_id, payment_id, scheduled_for, sequence_order, story_copy, art_url]
    );
    return rows[0];
  }

  static async bulkCreate(publications) {
    const results = [];
    for (const pub of publications) {
      results.push(await this.create(pub));
    }
    return results;
  }

  static async findById(id) {
    const { rows } = await query(
      `SELECT pub.*, j.title AS job_title, j.story_copy, j.art_url,
              c.name AS company_name
       FROM publications pub
       JOIN jobs j ON j.id = pub.job_id
       JOIN companies c ON c.id = j.company_id
       WHERE pub.id = $1`,
      [id]
    );
    return rows[0] || null;
  }

  static async findDuePending(now = new Date()) {
    const { rows } = await query(
      `SELECT pub.*, j.title AS job_title, j.story_copy, j.art_url,
              c.name AS company_name
       FROM publications pub
       JOIN jobs j ON j.id = pub.job_id
       JOIN companies c ON c.id = j.company_id
       WHERE pub.status = 'scheduled'
         AND pub.scheduled_for <= $1
       ORDER BY pub.scheduled_for ASC`,
      [now]
    );
    return rows;
  }

  static async updateStatus(id, status, extra = {}) {
    const fields = ['status = $2', 'updated_at = NOW()'];
    const values = [id, status];
    let idx = 3;

    if (status === 'published') {
      fields.push(`published_at = $${idx++}`);
      values.push(new Date());
    }

    for (const [key, val] of Object.entries(extra)) {
      fields.push(`${key} = $${idx++}`);
      values.push(val);
    }

    const { rows } = await query(
      `UPDATE publications SET ${fields.join(', ')} WHERE id = $1 RETURNING *`,
      values
    );
    return rows[0];
  }

  static async findByJobId(job_id) {
    const { rows } = await query(
      `SELECT * FROM publications WHERE job_id = $1 ORDER BY sequence_order ASC`,
      [job_id]
    );
    return rows;
  }

  static async getScheduleForDay(date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const { rows } = await query(
      `SELECT pub.*, j.title AS job_title, c.name AS company_name
       FROM publications pub
       JOIN jobs j ON j.id = pub.job_id
       JOIN companies c ON c.id = j.company_id
       WHERE pub.scheduled_for BETWEEN $1 AND $2
       ORDER BY pub.scheduled_for ASC`,
      [start, end]
    );
    return rows;
  }
}

module.exports = Publication;
