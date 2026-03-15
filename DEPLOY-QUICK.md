# 🚀 Quick Deployment Steps

## Option 1: Railway (Backend) + Vercel (Frontend) - RECOMMENDED ✅

### 🔥 Fastest Way (5 minutes):

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Deploy LegalEdge"
   git remote add origin https://github.com/YOUR_USERNAME/legaledge.git
   git push -u origin main
   ```

2. **Deploy Backend to Railway:**
   - Go to https://railway.app
   - Click "New Project" → "Deploy from GitHub"
   - Select your repo
   - Add PostgreSQL database (click "+ New" → "Database" → "PostgreSQL")
   - Add environment variables (see DEPLOYMENT.md)
   - Get your backend URL

3. **Deploy Frontend to Vercel:**
   ```bash
   cd frontend
   npx vercel
   ```
   - Or go to https://vercel.com → "New Project" → Import from GitHub
   - Add environment variable: `VITE_API_URL=https://your-backend.railway.app`

4. **Done!** 🎉

---

## Option 2: Render (All-in-One) - FREE but slower

1. **Push to GitHub** (same as above)

2. **Go to https://render.com:**
   - Create PostgreSQL database (free)
   - Create Web Service (backend) - select your repo, folder: `backend`
   - Create Static Site (frontend) - select your repo, folder: `frontend`

3. **Configure environment variables** in each service

---

## 🔑 Essential Environment Variables

### Backend (Railway/Render):
```
DATABASE_URL=<auto-filled>
NODE_ENV=production
JWT_SECRET=<generate-random-32-chars>
SMTP_USER=nexarfluxx@gmail.com
SMTP_PASS=ztzf oftd njpi rkka
FRONTEND_URL=<your-vercel-url>
```

### Frontend (Vercel/Render):
```
VITE_API_URL=<your-backend-url>
```

---

## 📝 Full Detailed Guide
See **DEPLOYMENT.md** for complete step-by-step instructions!

---

## ⚡ After Deployment:

1. Visit your frontend URL
2. Register a new firm
3. Login
4. Test creating cases, deadlines, etc.
5. Check notifications work!

---

## 🆘 Need Help?

Common issues:
- **Backend won't start?** Check Railway logs for missing env vars
- **Frontend can't connect?** Verify VITE_API_URL has no trailing slash
- **Database error?** Run: `npx prisma migrate deploy` in Railway terminal
- **CORS error?** Update ALLOWED_ORIGINS in backend env

Good luck! 🚀
