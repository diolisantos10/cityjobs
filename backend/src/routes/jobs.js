const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Company = require('../models/Company');
const Job = require('../models/Job');
const adminAuth = require('../middleware/adminAuth');

// ─── Validation rules ────────────────────────────────────────────────────────
const jobValidation = [
  // Company
  body('company.name').trim().notEmpty().withMessage('Nome da empresa é obrigatório'),
  body('company.email').isEmail().withMessage('E-mail inválido'),
  body('company.phone').trim().notEmpty().withMessage('Telefone é obrigatório'),

  // Job
  body('job.title').trim().notEmpty().withMessage('Título da vaga é obrigatório'),
  body('job.description').trim().isLength({ min: 50 }).withMessage('Descrição muito curta (mín. 50 chars)'),
  body('job.salary_min').optional().isFloat({ min: 0 }).withMessage('Salário mínimo inválido'),
  body('job.salary_max').optional().isFloat({ min: 0 }).withMessage('Salário máximo inválido'),
  body('job.contract_type').isIn(['CLT', 'PJ', 'Estágio', 'Freelance', 'Temporário'])
    .withMessage('Tipo de contrato inválido'),
];

// POST /api/jobs — submit a new job
router.post('/', jobValidation, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { company: companyData, job: jobData } = req.body;

    // Upsert company
    const company = await Company.create(companyData);

    // Create job in pending_payment status
    const job = await Job.create({
      company_id: company.id,
      ...jobData,
    });

    res.status(201).json({ job, company });
  } catch (err) {
    next(err);
  }
});

// GET /api/jobs/:id — get job details (public)
router.get('/:id', async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: { message: 'Vaga não encontrada' } });
    res.json({ job });
  } catch (err) {
    next(err);
  }
});

// ─── Admin routes ────────────────────────────────────────────────────────────

// GET /api/jobs — list all (admin)
router.get('/', adminAuth, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, niche, risk_level } = req.query;
    const jobs = await Job.listAll({ page: Number(page), limit: Number(limit), status, niche, risk_level });
    res.json({ jobs });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/jobs/:id/approve — admin manual approval
router.patch('/:id/approve', adminAuth, async (req, res, next) => {
  try {
    const { reviewed_by } = req.body;
    const job = await Job.updateStatus(req.params.id, 'approved', {
      reviewed_by,
      reviewed_at: new Date(),
    });
    res.json({ job });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/jobs/:id/reject — admin reject
router.patch('/:id/reject', adminAuth, async (req, res, next) => {
  try {
    const { reviewed_by, rejection_reason } = req.body;
    const job = await Job.updateStatus(req.params.id, 'rejected', {
      reviewed_by,
      reviewed_at: new Date(),
      rejection_reason,
    });
    res.json({ job });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
