@echo off
REM Quick script to add all SMTP environment variables to Railway
REM Make sure you have Railway CLI installed and logged in first

echo Adding SMTP environment variables to Railway...
echo.

railway variables set SMTP_HOST=smtp.gmail.com
railway variables set SMTP_PORT=587
railway variables set SMTP_SECURE=false
railway variables set SMTP_USER=nexarfluxx@gmail.com
railway variables set "SMTP_PASS=ztzf oftd njpi rkka"
railway variables set SMTP_FROM_NAME=Lawravel
railway variables set SUPPORT_EMAIL=nexarfluxx@gmail.com

echo.
echo ✅ All SMTP variables added!
echo Railway will automatically redeploy.
echo Wait 2-3 minutes, then test by creating a support ticket.
echo.
pause
