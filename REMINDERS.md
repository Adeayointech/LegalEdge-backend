# Email Reminder System

## Overview
The Law Firm Platform includes an automated email reminder system for deadline notifications. Reminders are sent to all lawyers assigned to a case based on configurable settings.

## Features
- ✅ Automated daily email reminders (runs at 8:00 AM)
- ✅ Configurable reminder days (e.g., 1 day, 3 days, 7 days before deadline)
- ✅ Overdue deadline alerts (runs at 9:00 AM)
- ✅ Professional HTML email templates with urgency indicators
- ✅ Per-deadline reminder settings (enable/disable, custom days)
- ✅ Test reminder functionality
- ✅ Reminders sent to all assigned lawyers on a case

## Email Configuration

### Setup SMTP Credentials

1. **Using Gmail (Recommended for Development)**
   - Enable 2-Factor Authentication on your Gmail account
   - Generate an App Password: https://myaccount.google.com/apppasswords
   - Use the app password (not your regular Gmail password)

2. **Update .env file:**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-digit-app-password
   SMTP_FROM_NAME=Your Law Firm Name
   FRONTEND_URL=http://localhost:3000
   ```

3. **For Production:**
   - Consider using dedicated email services:
     - SendGrid (https://sendgrid.com)
     - Amazon SES (https://aws.amazon.com/ses/)
     - Mailgun (https://www.mailgun.com)
   - Update SMTP settings accordingly

## Reminder Schedule

### Daily Reminders (8:00 AM)
- Checks for deadlines in the next 3 days
- Sends reminders based on configured days
- Default: 1 day, 3 days, 7 days before deadline
- Always sends reminder on due date

### Overdue Alerts (9:00 AM)
- Checks for deadlines that have passed
- Sends urgent overdue notifications
- Continues until deadline is marked completed

## Configuring Reminders

### Via UI (Per Deadline)
1. Navigate to Case Details → Deadlines tab
2. Click the bell icon (🔔) on any deadline
3. Toggle "Email Reminders" on/off
4. Select reminder days:
   - On Due Date
   - 1 Day Before
   - 2 Days Before
   - 3 Days Before
   - 1 Week Before
   - 2 Weeks Before
   - 1 Month Before
5. Click "Send Test Reminder" to test email delivery
6. Save settings

### Default Settings
New deadlines have reminders enabled by default with:
- 1 day before
- 3 days before
- 7 days before

## Email Templates

### Reminder Email Features
- **Urgency Indicators:**
  - 🚨 URGENT: 0-1 days until due (red)
  - ⚠️ HIGH: 2-3 days until due (orange)
  - 📅 NORMAL: 4+ days until due (blue)
- **Content:**
  - Deadline title and description
  - Case information (title, suit number)
  - Due date and time remaining
  - Direct link to case details
  - Professional HTML formatting

## Testing

### Test Reminder Delivery
1. Configure SMTP settings in .env
2. Restart backend server
3. Open any deadline's reminder settings
4. Click "Send Test Reminder"
5. Check your email (and assigned lawyers' emails)

### Manual Testing via API
```bash
POST /api/reminders/:deadlineId/test
Headers: Authorization: Bearer <token>
```

## Troubleshooting

### Emails Not Sending

**Check SMTP Configuration:**
```bash
# View server logs for email errors
# Backend console will show:
# ✅ "Email sent successfully to user@example.com"
# ❌ "Failed to send email: [error details]"
```

**Common Issues:**
1. **Invalid credentials:** Verify SMTP_USER and SMTP_PASS
2. **Gmail blocking:** Use App Password, not regular password
3. **Port blocked:** Try port 465 with secure: true
4. **Firewall:** Ensure outbound SMTP ports are open

**Skip Email in Development:**
- If SMTP credentials are not configured, emails will be logged but not sent
- Server continues to function normally

### Cron Jobs Not Running

**Verify Server Logs:**
```
🚀 Server running on port 5000
📝 Environment: development
Deadline reminder scheduler initialized (runs daily at 8:00 AM)
Overdue deadline scheduler initialized (runs daily at 9:00 AM)
```

**Force Run (Development):**
Modify scheduler.ts temporarily:
```typescript
// Test every minute instead of daily
cron.schedule('* * * * *', async () => {
  // ... reminder logic
});
```

## SMS Integration (Future Enhancement)

To add SMS reminders:

1. **Install Twilio:**
   ```bash
   npm install twilio
   ```

2. **Add to .env:**
   ```env
   TWILIO_ACCOUNT_SID=your-account-sid
   TWILIO_AUTH_TOKEN=your-auth-token
   TWILIO_PHONE_NUMBER=+1234567890
   ```

3. **Create SMS utility:**
   ```typescript
   // backend/src/utils/sms.ts
   import twilio from 'twilio';
   
   const client = twilio(
     process.env.TWILIO_ACCOUNT_SID,
     process.env.TWILIO_AUTH_TOKEN
   );
   
   export const sendSMS = async (to: string, message: string) => {
     return client.messages.create({
       body: message,
       from: process.env.TWILIO_PHONE_NUMBER,
       to: to,
     });
   };
   ```

4. **Integrate into scheduler:**
   - Add phone number to User model
   - Call sendSMS() alongside sendEmail()
   - Add SMS toggle in reminder settings

## API Endpoints

### Update Reminder Settings
```
PUT /api/reminders/:deadlineId/settings
Body: {
  reminderEnabled: boolean,
  reminderDays: number[]
}
```

### Send Test Reminder
```
POST /api/reminders/:deadlineId/test
```

## Database Fields

### Deadline Model
```prisma
model Deadline {
  reminderEnabled Boolean   @default(true)
  reminderDays    Int[]     @default([1, 3, 7])
  // ... other fields
}
```

## Best Practices

1. **Production Email Service:** Use dedicated service (SendGrid, SES) not Gmail
2. **Email Limits:** Be aware of SMTP provider's daily sending limits
3. **Unsubscribe:** Add unsubscribe link for compliance (future enhancement)
4. **Monitoring:** Log all email sends and track delivery rates
5. **User Preferences:** Allow users to set global email preferences
6. **Time Zones:** Consider user time zones for reminder scheduling

## Security

- SMTP credentials stored in .env (never commit to git)
- Email addresses validated before sending
- Rate limiting on test reminder endpoint
- Only assigned lawyers receive reminders (firm isolation)

## Future Enhancements

- [ ] SMS reminders via Twilio
- [ ] Push notifications
- [ ] In-app notification center
- [ ] User-level email preferences
- [ ] Email digest (daily summary)
- [ ] Custom reminder templates
- [ ] Slack/Teams integration
- [ ] Reminder history/audit log
- [ ] Delivery status tracking
- [ ] A/B testing for reminder timing
