require('dotenv').config();
const express = require('express');
const cors = require('cors');

const { connectDb } = require('./config/db');
const seedDefaults = require('./utils/seedDefaults');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const companyRoutes = require('./routes/companyRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const { leavePolicyRouter, leaveRequestRouter, leaveUsageRouter } = require('./routes/leaveRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const praiseRoutes = require('./routes/praiseRoutes');
const holidayRoutes = require('./routes/holidayRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const { cycleRouter, goalRouter, reviewRouter } = require('./routes/performanceRoutes');
const checklistRoutes = require('./routes/checklistRoutes');
const assetRoutes = require('./routes/assetRoutes');
const resignationRoutes = require('./routes/resignationRoutes');
const documentRoutes = require('./routes/documentRoutes');

const app = express();

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser requests (no Origin header, e.g. curl/health checks).
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        return callback(null, true);
      }
      const err = new Error(`Origin ${origin} is not allowed by CORS.`);
      err.statusCode = 403;
      callback(err);
    },
  })
);
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/leave-policy', leavePolicyRouter);
app.use('/api/leave-requests', leaveRequestRouter);
app.use('/api/leave-usage', leaveUsageRouter);
app.use('/api/notifications', notificationRoutes);
app.use('/api/praise', praiseRoutes);
app.use('/api/holidays', holidayRoutes);
app.use('/api/expense-claims', expenseRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/review-cycles', cycleRouter);
app.use('/api/goals', goalRouter);
app.use('/api/reviews', reviewRouter);
app.use('/api/checklist-tasks', checklistRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/resignations', resignationRoutes);
app.use('/api/documents', documentRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 4000;

async function start() {
  await connectDb();
  await seedDefaults();
  app.listen(PORT, () => {
    console.log(`peoplegrid-backend listening on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});
