const express = require('express');
const router = express.Router();
const Publication = require('../models/Publication');
const adminAuth = require('../middleware/adminAuth');

// GET /api/publications/schedule — today's schedule (admin)
router.get('/schedule', adminAuth, async (req, res, next) => {
  try {
    const date = req.query.date ? new Date(req.query.date) : new Date();
    const schedule = await Publication.getScheduleForDay(date);
    res.json({ schedule, date });
  } catch (err) {
    next(err);
  }
});

// GET /api/publications/pending-manual — manual queue (admin)
router.get('/pending-manual', adminAuth, async (req, res, next) => {
  try {
    const { query } = require('../config/database');
    const { rows } = await query(
      `SELECT pub.*, j.title AS job_title, j.story_copy, j.art_url,
              c.name AS company_name
       FROM publications pub
       JOIN jobs j ON j.id = pub.job_id
       JOIN companies c ON c.id = j.company_id
       WHERE pub.status = 'manual_required'
       ORDER BY pub.scheduled_for ASC`
    );
    res.json({ publications: rows });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/publications/:id/mark-published — admin manually marks as published
router.patch('/:id/mark-published', adminAuth, async (req, res, next) => {
  try {
    const { instagram_media_id, instagram_permalink, approved_by, manual_notes } = req.body;
    const pub = await Publication.updateStatus(req.params.id, 'published', {
      instagram_media_id,
      instagram_permalink,
      approved_by,
      manual_notes,
    });
    res.json({ publication: pub });
  } catch (err) {
    next(err);
  }
});

// GET /api/publications/job/:jobId
router.get('/job/:jobId', async (req, res, next) => {
  try {
    const publications = await Publication.findByJobId(req.params.jobId);
    res.json({ publications });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
