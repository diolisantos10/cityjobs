const { query } = require('../config/database');

class Package {
  static async findAll() {
    const { rows } = await query(
      'SELECT * FROM packages WHERE is_active = TRUE ORDER BY price_cents ASC'
    );
    return rows;
  }

  static async findById(id) {
    const { rows } = await query('SELECT * FROM packages WHERE id = $1', [id]);
    return rows[0] || null;
  }

  static async findByType(type) {
    const { rows } = await query('SELECT * FROM packages WHERE type = $1', [type]);
    return rows[0] || null;
  }
}

module.exports = Package;
