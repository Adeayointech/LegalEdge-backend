import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Trust proxy for Railway (behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : [process.env.FRONTEND_URL || 'http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '15') * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100')
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
import authRoutes from './routes/auth.routes';
import caseRoutes from './routes/case.routes';
import clientRoutes from './routes/client.routes';
import firmRoutes from './routes/firm.routes';
import documentRoutes from './routes/document.routes';
import deadlineRoutes from './routes/deadline.routes';
import hearingRoutes from './routes/hearing.routes';
import auditLogRoutes from './routes/auditLog.routes';
import branchRoutes from './routes/branch.routes';
import userRoutes from './routes/user.routes';
import searchRoutes from './routes/search.routes';
import analyticsRoutes from './routes/analytics.routes';
import reminderRoutes from './routes/reminder.routes';
import hearingReminderRoutes from './routes/hearing-reminder.routes';
import profileRoutes from './routes/profile.routes';
import supportRoutes from './routes/support.routes';
import platformAdminRoutes from './routes/platform-admin.routes';
import notificationRoutes from './routes/notification.routes';
import { initializeSchedulers } from './utils/scheduler';

app.use('/api/auth', authRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/firm', firmRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/deadlines', deadlineRoutes);
app.use('/api/hearings', hearingRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/users', userRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/hearing-reminders', hearingReminderRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/platform-admin', platformAdminRoutes);
app.use('/api/notifications', notificationRoutes);
// app.use('/api/deadlines', deadlineRoutes);
// app.use('/api/analytics', analyticsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
const PORT = parseInt(process.env.PORT || '5000', 10);

async function startServer() {
  try {
    // Check database connection
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    console.log('🔍 Checking database connection...');
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Run migrations in production on first startup
    if (process.env.NODE_ENV === 'production' && process.env.RUN_MIGRATIONS !== 'false') {
      console.log('🔄 Running database migrations...');
      const { execSync } = await import('child_process');
      try {
        execSync('npx prisma migrate deploy', { stdio: 'inherit' });
        console.log('✅ Database migrations completed');
      } catch (migrationError) {
        console.error('⚠️  Migration failed (might already be applied):', migrationError);
      }
    }
    
    await prisma.$disconnect();
    
    // Start Express server - bind to 0.0.0.0 for Railway
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 CORS allowed origins: ${allowedOrigins.join(', ')}`);
      
      // Initialize cron jobs for deadline reminders
      try {
        initializeSchedulers();
        console.log('⏰ Schedulers initialized');
      } catch (schedulerError) {
        console.error('⚠️  Failed to initialize schedulers:', schedulerError);
        // Don't crash the server if schedulers fail
      }
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    console.error('Stack:', error instanceof Error ? error.stack : error);
    process.exit(1);
  }
}

startServer();

export default app;
