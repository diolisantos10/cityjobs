require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./config/logger');

const app = express();

// ─── Security & middleware ────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100,
  message: { error: { message: 'Too many requests, please try again later.' } },
});
app.use('/api/', limiter);

// Stripe webhook needs raw body — must be registered BEFORE express.json()
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// JSON body parsing for all other routes
app.use(express.json({ limit: '10mb' }));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/packages',     require('./routes/packages'));
app.use('/api/jobs',         require('./routes/jobs'));
app.use('/api/payments',     require('./routes/payments'));
app.use('/api/publications', require('./routes/publications'));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'cityjobs-api' }));

// ─── Error handling ───────────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  logger.info(`CityJobs API running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});

// Start scheduler in same process (or run separately with `npm run scheduler`)
if (process.env.START_SCHEDULER === 'true') {
  require('./jobs/scheduler');
}

module.exports = app;
