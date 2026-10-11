const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const env = require('./config/env');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
if (env.nodeEnv !== 'test') app.use(morgan('dev'));

app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false }));
app.use('/api/auth', rateLimit({
  windowMs: 15 * 60 * 1000, max: 30,
  message: { success: false, message: 'Too many attempts, try again later', errors: [] },
}));

// Uploaded files are NOT served statically; they are streamed through authorized endpoints.
app.get('/api/health', (req, res) =>
  res.json({ success: true, message: 'SmartBirth API running', data: { demo: true } }));

// Routes are mounted here as phases are built:
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/hospital', require('./routes/hospital.routes'));
app.use('/api/municipal', require('./routes/municipal.routes'));
app.use('/api/applications', require('./routes/application.routes'));
app.use('/api/certificates', require('./routes/certificate.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));
app.use('/api/public', require('./routes/public.routes'));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
