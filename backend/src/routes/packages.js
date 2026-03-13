const express = require('express');
const router = express.Router();
const Package = require('../models/Package');

// GET /api/packages — list all active packages
router.get('/', async (req, res, next) => {
  try {
    const packages = await Package.findAll();
    res.json({ packages });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
