# Production Deployment Guide

This guide covers deploying your Law Firm Platform to production.

## Pre-Deployment Checklist

### 1. Environment Variables ✅

**CRITICAL: Update these before deployment:**

```bash
# Generate secure JWT secret (32+ characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Update .env with production values:
NODE_ENV=production
DATABASE_URL=your-production-database-url
JWT_SECRET=your-generated-secret
FRONTEND_URL=https://yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

**Never commit `.env` file to git!** Verify `.gitignore` includes:
```
.env
.env.local
.env.production
```

### 2. Database Setup ✅

**Option A: Managed PostgreSQL (Recommended)**
- [Render PostgreSQL](https://render.com/docs/databases) - Free tier available
- [Railway PostgreSQL](https://railway.app/) - $5/month
- [Supabase](https://supabase.com/) - Free tier with generous limits
- [Neon](https://neon.tech/) - Serverless Postgres

**Connection String Format:**
```
postgresql://username:password@host:5432/database?sslmode=require&connection_limit=10
```

**After deployment, run migrations:**
```bash
npx prisma migrate deploy
```

### 3. File Storage ⚠️

**Current State:** Files stored locally in `./uploads`
**Production Issue:** Files lost on server restart

**Recommended Solutions:**

#### Option A: AWS S3 (Most Popular)
```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner multer-s3
```

Environment variables needed:
```env
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
```

#### Option B: Cloudinary (Easier Setup)
```bash
npm install cloudinary multer-storage-cloudinary
```

Environment variables:
```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

#### Option C: Azure Blob Storage
```bash
npm install @azure/storage-blob multer-blob-storage
```

**Action Required:** Choose one and update document upload controller.

### 4. SSL/HTTPS ✅

**Option A: Deploy to Platform with Auto-SSL**
- Render - Automatic SSL
- Railway - Automatic SSL
- Vercel/Netlify (frontend) - Automatic SSL
- Heroku - Automatic SSL

**Option B: Manual Setup (VPS/DigitalOcean)**
```bash
# Using Let's Encrypt & Certbot
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

**Option C: Cloudflare (Recommended)**
- Add domain to Cloudflare
- Enable "Full (Strict)" SSL mode
- Automatic HTTPS rewrites
- Free DDoS protection

### 5. CORS Configuration ✅

Already implemented! Just update `.env`:
```env
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### 6. Email/SMS Verification ✅

**Email (Gmail):**
1. Enable 2FA on your Gmail account
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Update `.env`:
```env
SMTP_USER=youremail@gmail.com
SMTP_PASS=your-16-char-app-password
```

**Alternative Email Providers:**
- SendGrid - 100 emails/day free
- Mailgun - 5,000 emails/month free
- AWS SES - Very cheap, pay per use

**SMS (Termii):**
1. Verify your Termii API key has sufficient credits
2. Test SMS sending in production
3. Monitor usage to avoid surprises

## Deployment Options

### Option 1: Render (Recommended - Free Tier)

**Backend:**
1. Create account at [render.com](https://render.com)
2. New Web Service → Connect Git Repository
3. Settings:
   - Environment: Node
   - Build Command: `cd backend && npm install && npx prisma generate && npm run build`
   - Start Command: `cd backend && npm start`
   - Add environment variables from `.env.example`
4. Create PostgreSQL database (free tier)
5. Connect database URL to web service

**Frontend:**
1. New Static Site
2. Settings:
   - Build Command: `cd frontend && npm install && npm run build`
   - Publish Directory: `frontend/dist`
   - Environment Variable: `VITE_API_URL=https://your-backend.onrender.com/api`

### Option 2: Railway (Easy, $5/month)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy backend
cd backend
railway init
railway up

# Add PostgreSQL
railway add postgresql

# Deploy frontend
cd ../frontend
railway init
railway up
```

### Option 3: DigitalOcean App Platform

1. Create account at DigitalOcean
2. Create App → GitHub repository
3. Configure components:
   - Backend: Node.js service
   - Frontend: Static site
   - Database: PostgreSQL cluster
4. Set environment variables
5. Deploy

### Option 4: Traditional VPS (DigitalOcean Droplet, Linode, AWS EC2)

**Setup Script:**
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Clone repository
git clone your-repo-url
cd Law-firm-platform

# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Build
npm run build

# Setup PM2 (process manager)
sudo npm install -g pm2
pm2 start backend/dist/index.js --name lawfirm-api
pm2 startup
pm2 save

# Setup Nginx reverse proxy
sudo apt install nginx
# Configure nginx (see nginx.conf example below)
```

## Post-Deployment Steps

### 1. Database Migrations
```bash
cd backend
npx prisma migrate deploy
```

### 2. Create Super Admin
```bash
# Register first user via frontend
# Then run script to make them admin:
npx tsx src/scripts/make-super-admin.ts user@email.com
```

### 3. Test Critical Flows
- [ ] User registration & approval
- [ ] Case creation
- [ ] Document upload
- [ ] Email notifications
- [ ] SMS notifications
- [ ] Branch assignment
- [ ] Analytics

### 4. Setup Monitoring

**Error Tracking:**
```bash
# Install Sentry
npm install @sentry/node @sentry/tracing
```

Add to `backend/src/index.ts`:
```typescript
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

**Uptime Monitoring:**
- [UptimeRobot](https://uptimerobot.com/) - Free
- [Better Uptime](https://betteruptime.com/) - Free tier
- [Pingdom](https://www.pingdom.com/)

### 5. Backup Strategy

**Database Backups:**
- Render: Automatic daily backups
- Railway: Automatic backups
- Manual: Set up cron job

```bash
# Daily backup script
0 2 * * * pg_dump $DATABASE_URL > /backups/db_$(date +\%Y\%m\%d).sql
```

**Document Backups:**
If using cloud storage, enable versioning:
- S3: Enable versioning in bucket settings
- Cloudinary: Automatic versioning
- Azure: Soft delete enabled

## Security Hardening

### 1. Rate Limiting (Already Implemented ✅)
Current: 100 requests per 15 minutes

### 2. Helmet (Already Implemented ✅)
Security headers configured

### 3. Input Validation
Add Zod validation (recommended):
```bash
npm install zod
```

### 4. Secrets Management
Use environment variables for ALL secrets:
- Database credentials
- API keys
- JWT secret
- Email passwords

### 5. HTTPS Only
```typescript
// Force HTTPS in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}
```

## Performance Optimization

### 1. Database Indexes (Already Added ✅)
Prisma schema has indexes on frequently queried fields

### 2. Caching
Consider adding Redis:
```bash
npm install redis
```

### 3. Compression
Already enabled via helmet

### 4. CDN for Static Assets
Use Cloudflare for frontend assets

## Troubleshooting

### Database Connection Issues
```typescript
// Test connection
npx tsx -e "import prisma from './src/lib/prisma'; prisma.user.count().then(console.log)"
```

### Email Not Sending
1. Check Gmail App Password is correct
2. Verify SMTP settings
3. Check firewall allows port 587
4. Test with: `npx tsx src/scripts/test-email.ts`

### SMS Not Sending
1. Verify Termii API key
2. Check account balance
3. Verify sender ID is approved
4. Check phone number format

### File Upload Failing
1. Check upload directory permissions
2. Verify MAX_FILE_SIZE setting
3. Check disk space
4. Consider switching to cloud storage

## Estimated Costs (Monthly)

### Minimal Setup (Free Tier)
- Render Web Service: Free (with sleep after inactivity)
- Render PostgreSQL: Free (limited storage)
- Render Static Site: Free
- **Total: $0/month**

### Production Setup (Recommended)
- Railway Backend: $5
- Railway PostgreSQL: Included
- Cloudflare: Free
- Cloudinary (1GB storage): Free
- **Total: ~$5/month**

### Enterprise Setup
- DigitalOcean Droplet (2GB): $12
- Managed PostgreSQL: $15
- AWS S3 Storage: ~$3
- Domain + SSL: $12/year
- **Total: ~$30/month + $12/year**

## Next Steps

1. Choose deployment platform
2. Update environment variables
3. Choose file storage solution
4. Deploy backend
5. Deploy frontend
6. Run database migrations
7. Create super admin
8. Test all features
9. Setup monitoring
10. Configure backups

## Support Resources

- [Render Documentation](https://render.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [Prisma Deployment](https://www.prisma.io/docs/guides/deployment)
- [Node.js Production Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)

---

**Need Help?** Common deployment issues and solutions in the troubleshooting section above.
