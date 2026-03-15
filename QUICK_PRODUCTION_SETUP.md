# Quick Production Setup Checklist

## Before Deployment

### 1. Generate Secure JWT Secret (2 minutes)
```bash
cd backend
node generate-secret.js
# Copy one of the generated secrets
```

Update your production `.env`:
```env
JWT_SECRET=<paste-generated-secret>
```

### 2. Update Environment Variables (5 minutes)
Edit `backend/.env` with production values:
```env
NODE_ENV=production
DATABASE_URL=<your-postgres-connection-string>
FRONTEND_URL=https://yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### 3. Verify Production Readiness (1 minute)
```bash
cd backend
npx tsx src/scripts/check-production-readiness.ts
```
Fix any ❌ failures before proceeding.

### 4. Choose File Storage (15 minutes)

**Quick Option: Keep Local Storage (Not Recommended)**
- Files will be lost on server restart
- Only use for testing

**Recommended: Cloudinary (Easiest)**
1. Sign up at [cloudinary.com](https://cloudinary.com/users/register/free)
2. Get credentials from dashboard
3. Add to `.env`:
```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```
4. Install package: `npm install cloudinary multer-storage-cloudinary`
5. Update document controller (I can help with this)

**Alternative: AWS S3**
- More complex setup
- Better for large scale
- See PRODUCTION_DEPLOYMENT.md

## Deployment Methods

### Option A: Render (Easiest - Free Tier) ⭐ RECOMMENDED

**Backend:**
1. Go to [render.com](https://render.com) → Sign up
2. New → Web Service
3. Connect your GitHub repository
4. Settings:
   - Name: `lawfirm-backend`
   - Environment: `Node`
   - Build Command: `cd backend && npm install && npx prisma generate`
   - Start Command: `cd backend && npm start`
5. Add environment variables (copy from your `.env`)
6. Create

**Database:**
1. New → PostgreSQL
2. Name: `lawfirm-db`
3. Free tier
4. Create
5. Copy "Internal Database URL"
6. Add to backend service environment variables as `DATABASE_URL`

**Frontend:**
1. New → Static Site
2. Settings:
   - Build Command: `cd frontend && npm install && npm run build`
   - Publish Directory: `frontend/dist`
3. Environment Variables:
   - `VITE_API_URL` = `https://lawfirm-backend.onrender.com/api`
4. Create

**After Deployment:**
```bash
# SSH into Render service and run migrations
npx prisma migrate deploy
```

### Option B: Railway (Faster, $5/month)

1. Install CLI: `npm install -g @railway/cli`
2. `railway login`
3. `railway init`
4. `railway add postgresql`
5. `railway up`
6. Add environment variables in dashboard
7. Done!

### Option C: Your Own Server (Advanced)

See full guide in `PRODUCTION_DEPLOYMENT.md`

## After Deployment

### 1. Run Database Migrations
```bash
# Via Render shell or SSH
npx prisma migrate deploy
```

### 2. Create Your Admin Account
1. Go to `https://yourdomain.com/register`
2. Register with your email
3. Approve yourself in database or create script

### 3. Test Everything
- [ ] User registration
- [ ] Login
- [ ] Create case
- [ ] Upload document
- [ ] Email notification
- [ ] SMS notification (if configured)
- [ ] Analytics page
- [ ] Profile page

### 4. Setup Monitoring (Optional but Recommended)
- [UptimeRobot](https://uptimerobot.com/) - Free uptime monitoring
- [Sentry](https://sentry.io/) - Free error tracking

## Common Issues

### "Cannot connect to database"
- Verify DATABASE_URL is correct
- Check if database is running
- Verify SSL mode: add `?sslmode=require` to connection string

### "CORS error"
- Update ALLOWED_ORIGINS in backend `.env`
- Update VITE_API_URL in frontend deployment

### "Email not sending"
- Check SMTP credentials
- Generate Gmail App Password (not regular password)
- Test with: `npx tsx src/scripts/test-email.ts`

### "File upload fails"
- Check disk space
- Switch to cloud storage (Cloudinary/S3)

## Cost Estimate

**Render (Recommended for Start):**
- Free tier: $0/month
  - Backend sleeps after 15min inactivity
  - Database has storage limit
  - Perfect for testing/MVP

- Paid tier: $7/month
  - No sleep
  - Better performance
  - Upgrade when needed

**Railway:**
- $5/month for everything
- No sleep
- Better performance

**Your Own Server:**
- $5-12/month (DigitalOcean, Linode)
- Full control
- More setup required

## Next Steps

1. Run `node generate-secret.js` to get JWT secret
2. Update `.env` with production values
3. Run `npx tsx src/scripts/check-production-readiness.ts`
4. Choose deployment platform (Render recommended)
5. Deploy!
6. Test everything
7. Setup monitoring

## Need Help?

See detailed guides:
- Full deployment: `PRODUCTION_DEPLOYMENT.md`
- Cloudinary setup: Ask me!
- AWS S3 setup: Ask me!
- Custom domain: Ask me!

---

**Time to Deploy:** 30-60 minutes from start to finish
