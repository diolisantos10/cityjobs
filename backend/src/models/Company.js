const { query } = require('../config/database');

class Company {
  static async create({ name, cnpj, email, phone, website, instagram_handle, address, neighborhood }) {
    const { rows } = await query(
      `INSERT INTO companies (name, cnpj, email, phone, website, instagram_handle, address, neighborhood)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (email) DO UPDATE SET
         name = EXCLUDED.name,
         phone = EXCLUDED.phone,
         updated_at = NOW()
       RETURNING *`,
      [name, cnpj, email, phone, website, instagram_handle, address, neighborhood]
    );
    return rows[0];
  }

  static async findById(id) {
    const { rows } = await query('SELECT * FROM companies WHERE id = $1', [id]);
    return rows[0] || null;
  }

  static async findByEmail(email) {
    const { rows } = await query('SELECT * FROM companies WHERE email = $1', [email]);
    return rows[0] || null;
  }
}

module.exports = Company;
