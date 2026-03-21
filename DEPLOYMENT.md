# 🚀 Lawravel Deployment Guide

## Quick Deployment: Railway + Vercel

### Prerequisites
- GitHub account
- Railway account (https://railway.app)
- Vercel account (https://vercel.com)

---

## 📦 Step 1: Push Code to GitHub

If you haven't already, push your code to GitHub:

```bash
# Initialize git (if not done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Lawravel platform"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/legaledge.git
git branch -M main
git push -u origin main
```

---

## 🚂 Step 2: Deploy Backend to Railway

### 2.1 Create Railway Project

1. Go to https://railway.app
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Connect your GitHub account
5. Select your **legaledge** repository
6. Railway will auto-detect your backend

### 2.2 Add PostgreSQL Database

1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"Add PostgreSQL"**
3. Railway automatically creates the database
4. Note: Railway will auto-fill `DATABASE_URL` for you!

### 2.3 Configure Environment Variables

In Railway, go to your backend service → **Variables** tab and add:

```env
NODE_ENV=production
PORT=5000

# JWT (generate new secure secret)
JWT_SECRET=your-super-secure-jwt-secret-here-min-32-chars
JWT_EXPIRES_IN=7d

# Email (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=nexarfluxx@gmail.com
SMTP_PASS=ztzf oftd njpi rkka
SMTP_FROM_NAME=Lawravel
SUPPORT_EMAIL=nexarfluxx@gmail.com

# Frontend URL (will update after Vercel deployment)
FRONTEND_URL=https://your-app.vercel.app
ALLOWED_ORIGINS=https://your-app.vercel.app

# SMS (Termii)
TERMII_API_KEY=TLpeQvGOdxLdukGZmCEZvAKbvdEkalGRVsFIVAUZbmWkMDlGVSrAmfqzdknCeg
TERMII_SENDER_ID=LawFirm

# File Upload
MAX_FILE_SIZE=50MB
UPLOAD_DIR=./uploads

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100
```

**Important:** `DATABASE_URL` is automatically set by Railway - don't add it manually!

### 2.4 Run Database Migration

After deployment, go to your backend service:

1. Click the service
2. Go to **"Settings"** tab
3. Scroll to **"Deploy Triggers"**
4. Or run manually in the Railway terminal:

```bash
npx prisma migrate deploy
```

### 2.5 Get Your Backend URL

1. In Railway, click your backend service
2. Go to **"Settings"** → **"Networking"**
3. Click **"Generate Domain"**
4. Copy your URL (e.g., `https://your-app.up.railway.app`)

---

## ▲ Step 3: Deploy Frontend to Vercel

### 3.1 Update Frontend Environment

Before deploying, update the API URL in your frontend:

**Option A: Create `.env` file**
Create `frontend/.env`:
```env
VITE_API_URL=https://your-backend.up.railway.app
```

**Option B: Update via Vercel Dashboard** (recommended)

### 3.2 Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to frontend
cd frontend

# Deploy
vercel
```

Follow the prompts:
- Setup and deploy? **Y**
- Which scope? Select your account
- Link to existing project? **N**
   - Project name? **legaledge** (or your choice)
- Directory? **./** (just press Enter)
- Override settings? **N**

### 3.3 Add Environment Variables in Vercel

1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add:
   - Key: `VITE_API_URL`
   - Value: `https://your-backend.up.railway.app`
5. Click **"Save"**
6. Go to **Deployments** → Click on latest → **"Redeploy"**

### 3.4 Update Backend CORS

Go back to Railway and update these variables:
```env
FRONTEND_URL=https://your-app.vercel.app
ALLOWED_ORIGINS=https://your-app.vercel.app
```

Then redeploy the backend.

---

## 🎯 Step 4: Final Setup

### 4.1 Create Platform Admin

In Railway dashboard:
1. Click your backend service
2. Open the **Terminal** 
3. Run:
```bash
npx tsx src/scripts/reset-platform-admin-password.ts
```

Or create a new script in Railway terminal:
```bash
node dist/scripts/create-platform-admin.js
```

### 4.2 Test Your Deployment

1. Visit your Vercel URL: `https://your-app.vercel.app`
2. Try to register a new user
3. Login with platform admin
4. Test creating a case
5. Check if notifications work

---

## 🔒 Security Checklist

After deployment:

✅ Change JWT_SECRET to a new random string (32+ characters)
✅ Verify CORS settings allow only your Vercel domain
✅ Test all API endpoints work
✅ Check database connection
✅ Verify email notifications send
✅ Test file uploads work
✅ Check cron jobs are running (deadline reminders)

---

## 📊 Monitoring

### Railway Backend:
- **Logs**: Railway dashboard → Service → Logs
- **Metrics**: Railway dashboard → Service → Metrics
- **Database**: Can connect via Prisma Studio or any PostgreSQL client

### Vercel Frontend:
- **Analytics**: Vercel dashboard → Analytics
- **Logs**: Vercel dashboard → Deployments → View logs

---

## 💰 Cost Estimate

**FREE TIER:**
- **Railway**: $5 free credit/month (backend + PostgreSQL)
- **Vercel**: Unlimited deployments (frontend only)
- **Total**: FREE for testing/small usage

**If you exceed free tier:**
- Railway: ~$7-15/month (pay-as-you-go)
- Vercel: Stays free (frontend)

---

## 🆘 Troubleshooting

### Backend won't start?
- Check Railway logs for errors
- Verify `DATABASE_URL` is set automatically
- Ensure all environment variables are set
- Check if migration ran successfully

### Frontend can't connect to backend?
- Verify `VITE_API_URL` is correct (no trailing slash)
- Check CORS settings in backend
- Test backend URL directly in browser

### Database errors?
- Run migrations: `npx prisma migrate deploy`
- Check Railway database is running
- Verify connection string

### Emails not sending?
- For Gmail: Enable 2-Step Verification
- Use App Password (not regular password)
- Try port 587 with SMTP_SECURE=false

---

## 🎉 Success!

Your Lawravel platform should now be live at:
- **Frontend**: https://your-app.vercel.app
- **Backend**: https://your-backend.up.railway.app

Happy deploying! 🚀
