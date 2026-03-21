# 🚀 Railway Email Configuration Guide

## Issue
Emails are not sending in production because Railway doesn't have SMTP environment variables configured.

## ✅ Local Test Results
- SMTP connection: **Working**
- Test email sent: **Success**
- Configuration verified: **All credentials valid**

## 📋 Environment Variables to Add to Railway

You need to add these environment variables to your Railway backend service:

### Required Variables

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=nexarfluxx@gmail.com
SMTP_PASS=ztzf oftd njpi rkka
SMTP_FROM_NAME=Lawravel
SUPPORT_EMAIL=nexarfluxx@gmail.com
```

## 🛠️ How to Add Variables to Railway (STEP-BY-STEP)

### Method 1: Railway Dashboard (Easiest - No CLI needed)

**STEP 1: Login to Railway**
1. Open your browser
2. Go to: https://railway.app
3. Click "Login" button (top right)
4. Login with your account (GitHub/Google/Email)

**STEP 2: Find Your Project**
1. Once logged in, you'll see your dashboard
2. Look for your project - it might be named:
   - `Lawravel` or
   - `legaledge-backend-production` or
   - Your backend project name
3. Click on the project card to open it

**STEP 3: Open Your Backend Service**
1. Inside the project, you'll see services (purple/blue boxes)
2. Look for your backend service (usually shows "Node" or "Backend")
3. Click on the backend service box

**STEP 4: Go to Variables Tab**
1. You'll see tabs at the top: Overview, Variables, Settings, Deployments, Logs
2. Click on **"Variables"** tab
3. You should see a list of your current environment variables (DATABASE_URL, PORT, etc.)

**STEP 5: Add SMTP Variables (Do this 7 times)**

For each variable below, repeat these steps:

**First Variable - SMTP_HOST:**
1. Click the **"+ New Variable"** button (purple button, top right)
2. You'll see two input boxes appear:
   - **Variable Name** (left box)
   - **Value** (right box)
3. In the **Variable Name** box, type exactly: `SMTP_HOST`
4. In the **Value** box, type exactly: `smtp.gmail.com`
5. Press Enter or click outside to save
6. You'll see "Deploying..." at the top - this is normal

**Second Variable - SMTP_PORT:**
1. Click **"+ New Variable"** again
2. Variable Name: `SMTP_PORT`
3. Value: `587`
4. Press Enter

**Third Variable - SMTP_SECURE:**
1. Click **"+ New Variable"**
2. Variable Name: `SMTP_SECURE`
3. Value: `false`
4. Press Enter

**Fourth Variable - SMTP_USER:**
1. Click **"+ New Variable"**
2. Variable Name: `SMTP_USER`
3. Value: `nexarfluxx@gmail.com`
4. Press Enter

**Fifth Variable - SMTP_PASS:**
1. Click **"+ New Variable"**
2. Variable Name: `SMTP_PASS`
3. Value: `ztzf oftd njpi rkka` (YES, include the spaces exactly as shown)
4. Press Enter

**Sixth Variable - SMTP_FROM_NAME:**
1. Click **"+ New Variable"**
2. Variable Name: `SMTP_FROM_NAME`
3. Value: `Lawravel`
4. Press Enter

**Seventh Variable - SUPPORT_EMAIL:**
1. Click **"+ New Variable"**
2. Variable Name: `SUPPORT_EMAIL`
3. Value: `nexarfluxx@gmail.com`
4. Press Enter

**STEP 6: Wait for Deployment**
1. After adding all 7 variables, Railway will automatically redeploy
2. Look at the top of the page - you'll see:
   - "Deploying..." (with a spinning icon)
   - Then "Building..." 
   - Then "Deployed" (with a green checkmark)
3. This takes 2-4 minutes - be patient!

**STEP 7: Verify Variables Were Added**
1. Scroll through the Variables page
2. You should now see all 7 new variables:
   ✅ SMTP_HOST = smtp.gmail.com
   ✅ SMTP_PORT = 587
   ✅ SMTP_SECURE = false
   ✅ SMTP_USER = nexarfluxx@gmail.com
   ✅ SMTP_PASS = •••••••••••• (hidden for security)
   ✅ SMTP_FROM_NAME = Lawravel
   ✅ SUPPORT_EMAIL = nexarfluxx@gmail.com

**DONE!** ✅

---

## Common Issues & Solutions

### ❓ "I can't find my project"
- Make sure you're logged into the correct Railway account
- Check if someone else owns the project (ask them to invite you as a collaborator)
- Try refreshing the page

### ❓ "I don't see a Variables tab"
- Make sure you clicked on the service (not just the project)
- You should see "Overview, Variables, Settings" tabs at the top
- If you only see "Settings", you might be in the project settings - go back and click the service box

### ❓ "The + New Variable button is grayed out"
- You might not have permission to edit
- Make sure you're a member/admin of the project
- Try refreshing the page and logging in again

### ❓ "It says 'Deploying...' forever"
- This is normal for the first few minutes
- Wait up to 5 minutes
- Check the "Deployments" tab to see progress
- If stuck after 10 minutes, check "Logs" tab for errors

### ❓ "I already added some variables, do I add them again?"
- No, just add the ones you're missing
- If you made a mistake, click the variable and edit it (or delete and re-add)

### ❓ "Do I need to restart anything after adding?"
- No, Railway automatically redeploys when you add variables
- Just wait for the deployment to finish (green checkmark)

---

### Method 2: Railway CLI (Advanced - For developers comfortable with terminal)

```bash
# Install Railway CLI (if not installed)
npm install -g @railway/cli
---

## ✅ How to Test After Setup

### Test 1: Check Railway Logs (Verify Variables Are Working)
SMTP_FROM_NAME=Lawravel
railway variables set SUPPORT_EMAIL=nexarfluxx@gmail.com

# Deploy (automatic after variables are set)
```

## ⚠️ Important Notes

### Gmail App Password
- The password `ztzf oftd njpi rkka` is a Gmail **App Password**
- It includes spaces - this is normal and correct
- Do NOT use your regular Gmail password
- If you need to regenerate:
  1. Go to: https://myaccount.google.com/apppasswords
  2. Generate new password for "Mail"
  3. Update `SMTP_PASS` with the new password (include spaces)

### Security
- Never commit `.env` file to Git (already in .gitignore)
- App Passwords are less privileged than main password
- You can revoke App Passwords anytime from Google Account settings

## ✅ Verification After Setup

### 1. Check Railway Logs
```bash
# View logs to see email attempts
railway logs --service backend

# Look for:
# ✅ "Email sent successfully to..."
# ❌ "Email not sent: SMTP credentials not configured" (means vars not set)
# ❌ "Failed to send email: ..." (means SMTP issue)
```

### 2. Test in Production
1. Go to: https://legal-edge-backend-frontend.vercel.app
2. Login with your account
3. Go to Profile → Contact Support
4. Create a test ticket with your email
5. Check your inbox (nexarfluxx@gmail.com) for:
   - New ticket notification email
   - You should receive it within 1-2 minutes

### 3. Test Other Email Features
- *Open: https://legal-edge-backend-frontend.vercel.app
2. Login with your account
3. Click on your profile (top right)
4. Scroll down to **"Contact Support"** section
5. Fill in the form:
   - Subject: `Test - Email Configuration`
   - Message: `Testing if emails work after Railway setup`
   - Priority: Medium
6. Click **"Submit Ticket"**
7. If it submits instantly (no hang/freeze), the fix is working! ✅

### Test 3: Check Email Received
1. Open Gmail: https://mail.google.com
2. Login to: nexarfluxx@gmail.com (with your password)
3. Check inbox for new email with subject: **"Test - Email Configuration"**
4. If you received it within 1-2 minutes = emails working! 🎉
5. If not received after 5 minutes, check Railway logs (see Test 1)

**Common Issues:**

1. **"SMTP credentials not configured"**
   - Variables not set correctly on Railway
   - Check spelling of variable names (case-sensitive)
   - Redeploy: `railway up`

2. **"Authentication failed" (EAUTH)**
   - Wrong App Password
   - Generate new App Password from Google
   - Update SMTP_PASS on Railway

3. **"Connection timeout" (ETIMEDOUT)**
   - Railway firewall blocking SMTP
   - Try port 465 with SMTP_SECURE=true
   - Contact Railway support

4. **Emails sending but not received**
   - Check spam/junk folder
   - Verify recipient email is correct
   - Check Gmail "Sent" folder for nexarfluxx@gmail.com

### Alternative Email Providers

If Gmail continues to have issues, consider:

**SendGrid (Recommended for production):**
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key
```

**Mailgun:**
```bash
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_mailgun_smtp_login
SMTP_PASS=your_mailgun_smtp_password
```

## 📊 Current Status

- ✅ Local email: **Working**
- ✅ SMTP credentials: **Valid**
- ✅ Test email sent: **Success**
- ❌ Railway production: **Variables missing**
- 🔧 Next step: **Add variables to Railway**

## 🎯 Success Criteria

After adding variables, you should see:
- ✅ Railway deployment successful
- ✅ Railway logs show "Email sent successfully"
- ✅ Test ticket email received in inbox
- ✅ No page hangs (emails non-blocking)
- ✅ Deadline reminder emails sent
- ✅ Welcome emails for new users

## 📞 Need Help?

If you encounter issues:
1. Check Railway logs first
2. Verify all 7 variables are set correctly
3. Test with the local test script: `node backend/test-email.js`
4. Ensure App Password is valid (try regenerating)
5. Check Gmail "Less secure app access" settings (should be OFF, use App Password instead)

---

**Estimated Time:** 5-10 minutes to add variables via Railway dashboard
**Difficulty:** Easy (copy-paste values)
**Priority:** 🔴 Critical - Required for platform notifications
