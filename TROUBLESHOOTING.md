# Railway Deployment Troubleshooting

## Your deployment is building successfully but crashing at runtime. Here's how to fix it:

---

## 🔥 MOST COMMON ISSUES

### 1. **Root Directory Not Set** ⚠️ CRITICAL
Railway needs to know your backend is in a subdirectory.

**Fix:**
1. Go to Railway Dashboard → Your Service → **Settings**
2. Scroll to **Service Settings**
3. Set **Root Directory** to: `backend`
4. Click **Save**
5. Railway will auto-redeploy

---

### 2. **Missing Database Connection** ⚠️ CRITICAL
Your backend needs a PostgreSQL database.

**Fix:**
1. In Railway Dashboard, click **+ New**
2. Select **Database** → **PostgreSQL**
3. Railway will automatically:
   - Create the database
   - Set `DATABASE_URL` environment variable
   - Connect it to your service
4. After database is created, you MUST run migrations:
   ```bash
   # In Railway service → Settings → Deploy → Custom Start Command (temporarily):
   npx prisma migrate deploy && npm start
   ```
   OR use Railway CLI:
   ```bash
   railway run npx prisma migrate deploy
   ```

---

### 3. **Missing Environment Variables** ⚠️ CRITICAL

**Required Variables** (go to Settings → Variables):
```
NODE_ENV=production
JWT_SECRET=your-super-secret-key-here-change-this
FRONTEND_URL=https://your-vercel-app.vercel.app
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
SMTP_FROM_NAME=LegalEdge
SUPPORT_EMAIL=your-email@gmail.com
```

**Note:** 
- `DATABASE_URL` is auto-filled by Railway when you add PostgreSQL
- `PORT` is auto-filled by Railway
- Don't use localhost URLs in production!

---

## 🔍 HOW TO VIEW LOGS (Despite being large)

### Option 1: Filter Logs in Railway
1. Go to **Deployments** tab
2. Click on the latest deployment
3. Click **View Logs**
4. Look for these keywords:
   - `ERROR` or `❌`
   - `ECONNREFUSED` (database connection failed)
   - `Missing required` (missing env vars)
   - `Cannot find module` (build issue)
   - `EADDRINUSE` (port conflict)

### Option 2: Download Logs
1. In Railway Dashboard → **Deployments**
2. Click the three dots `...` next to your deployment
3. Click **Download Logs**
4. Open in text editor and search for "ERROR"

### Option 3: Use Railway CLI
```bash
railway login
railway link
railway logs --tail 100
```

---

## 📋 STEP-BY-STEP CHECKLIST

Run through these in order:

### ✅ Step 1: Set Root Directory
- [ ] Railway Settings → Service Settings → Root Directory = `backend`

### ✅ Step 2: Add PostgreSQL Database
- [ ] Railway Dashboard → + New → Database → PostgreSQL
- [ ] Wait for provisioning (takes 1-2 minutes)
- [ ] Verify `DATABASE_URL` appears in Variables tab

### ✅ Step 3: Run Database Migrations
Option A - Temporary start command:
- [ ] Settings → Deploy → Custom Start Command:
      `npx prisma migrate deploy && npm start`
- [ ] Save and wait for deployment
- [ ] Once successful, remove custom start command (revert to default)

Option B - Railway CLI:
```bash
railway login
railway link
railway run npx prisma migrate deploy
```

### ✅ Step 4: Set Environment Variables
Copy these to **Settings → Variables** (update values):
```
NODE_ENV=production
JWT_SECRET=generate-a-long-random-string-here
FRONTEND_URL=https://your-frontend-url.vercel.app
ALLOWED_ORIGINS=https://your-frontend-url.vercel.app
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_NAME=LegalEdge
SUPPORT_EMAIL=your-email@gmail.com
```

### ✅ Step 5: Verify Build Output
In deployment logs, you should see:
```
✔ Generated Prisma Client
npm run build
tsc --project tsconfig.build.json
(no errors)
```

### ✅ Step 6: Check Runtime Startup
In runtime logs, you should see:
```
🚀 Server running on port 5000
📝 Environment: production
✅ Database connected successfully
⏰ Schedulers initialized
```

---

## 🚨 SPECIFIC ERROR MESSAGES

### "Cannot connect to database"
- **Cause:** No DATABASE_URL or database not provisioned
- **Fix:** Add PostgreSQL database in Railway

### "Prisma Client not initialized"
- **Cause:** Migrations not run
- **Fix:** Run `npx prisma migrate deploy`

### "Port already in use"
- **Cause:** Multiple instances starting
- **Fix:** Check you don't have duplicate services

### "MODULE_NOT_FOUND"
- **Cause:** Build failed or incomplete
- **Fix:** 
  1. Check `dist/` folder was created during build
  2. Verify `tsc --project tsconfig.build.json` succeeded
  3. Make sure `package-lock.json` is committed

### "CORS error" or "Not allowed by CORS"
- **Cause:** Frontend URL not in ALLOWED_ORIGINS
- **Fix:** Set FRONTEND_URL and ALLOWED_ORIGINS to your Vercel URL

---

## 🧪 TEST YOUR DEPLOYMENT

### 1. Run Diagnostics (Before Starting)
In Railway Service → Settings → Deploy → Custom Start Command:
```
npm run diagnostics
```

This will check:
- ✓ All environment variables present
- ✓ Database connection working
- ✓ Database has tables (migrations ran)

### 2. Health Check (After Deployment)
Once deployed, visit:
```
https://your-railway-app.railway.app/health
```

Should return:
```json
{"status":"ok","timestamp":"2026-03-16T..."}
```

---

## 📞 NEED MORE HELP?

### Share These Details:
1. **First few lines of error** from logs (even if truncated)
2. **Environment variables** you have set (don't share actual secrets!)
3. **Root directory** setting
4. **PostgreSQL database** - is it added?
5. **Build logs** - did build succeed?

### Quick Check Command:
If you have Railway CLI:
```bash
railway status
railway variables
railway logs --tail 50
```

---

## 🎯 MOST LIKELY FIX

Based on common issues, try this first:

1. **Set Root Directory to `backend`**
2. **Add PostgreSQL database**
3. **Run: `railway run npx prisma migrate deploy`**
4. **Add all environment variables from the checklist above**
5. **Redeploy**

This fixes 90% of crashing issues!
