/**
 * Test script to verify SMTP email configuration
 * Run with: node test-email.js
 */

const nodemailer = require('nodemailer');
require('dotenv').config();

async function testEmail() {
  console.log('🔍 Testing SMTP Configuration...\n');
  
  // Check environment variables
  console.log('Environment Variables:');
  console.log('SMTP_HOST:', process.env.SMTP_HOST || '❌ Not set');
  console.log('SMTP_PORT:', process.env.SMTP_PORT || '❌ Not set');
  console.log('SMTP_SECURE:', process.env.SMTP_SECURE || '❌ Not set');
  console.log('SMTP_USER:', process.env.SMTP_USER || '❌ Not set');
  console.log('SMTP_PASS:', process.env.SMTP_PASS ? '✅ Set (hidden)' : '❌ Not set');
  console.log('SMTP_FROM_NAME:', process.env.SMTP_FROM_NAME || '❌ Not set');
  console.log('SUPPORT_EMAIL:', process.env.SUPPORT_EMAIL || '❌ Not set');
  console.log();

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error('❌ ERROR: SMTP_USER or SMTP_PASS not configured');
    process.exit(1);
  }

  try {
    const port = parseInt(process.env.SMTP_PORT || '587');
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;

    console.log(`📧 Creating transporter with:`);
    console.log(`   Host: ${process.env.SMTP_HOST || 'smtp.gmail.com'}`);
    console.log(`   Port: ${port}`);
    console.log(`   Secure: ${secure}`);
    console.log();

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: port,
      secure: secure,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Verify connection
    console.log('🔗 Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully!\n');

    // Send test email
    const testEmail = process.env.SMTP_USER; // Send to self
    console.log(`📨 Sending test email to ${testEmail}...`);
    
    const info = await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'LegalEdge'}" <${process.env.SMTP_USER}>`,
      to: testEmail,
      subject: '✅ Test Email - LegalEdge SMTP Configuration',
      text: 'This is a test email from LegalEdge platform. If you received this, your SMTP configuration is working correctly!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .success { background: #10b981; color: white; padding: 15px; border-radius: 6px; text-align: center; margin: 20px 0; }
            .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ SMTP Test Successful</h1>
            </div>
            <div class="content">
              <div class="success">
                <strong>Congratulations!</strong> Your email configuration is working correctly.
              </div>
              <p>This is a test email from the LegalEdge platform.</p>
              <p><strong>Configuration Details:</strong></p>
              <ul>
                <li>SMTP Host: ${process.env.SMTP_HOST}</li>
                <li>SMTP Port: ${port}</li>
                <li>From: ${process.env.SMTP_FROM_NAME || 'LegalEdge'}</li>
              </ul>
              <p>All email notifications from the platform will now be sent successfully:</p>
              <ul>
                <li>✅ Support ticket notifications</li>
                <li>✅ Deadline reminders</li>
                <li>✅ Court date reminders</li>
                <li>✅ Welcome emails</li>
              </ul>
              <div class="footer">
                <p>LegalEdge Platform - Legal Practice Management</p>
                <p>Test sent at: ${new Date().toLocaleString()}</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    });

    console.log('✅ Test email sent successfully!');
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   Response: ${info.response}`);
    console.log();
    console.log('🎉 All tests passed! Email configuration is working correctly.');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    
    if (error.code === 'EAUTH') {
      console.error('\n💡 Authentication failed. Please check:');
      console.error('   1. SMTP_USER is correct (nexarfluxx@gmail.com)');
      console.error('   2. SMTP_PASS is a valid App Password (not regular password)');
      console.error('   3. App Password has no spaces or is properly formatted');
      console.error('\n📝 To generate Gmail App Password:');
      console.error('   1. Go to https://myaccount.google.com/security');
      console.error('   2. Enable 2-Step Verification');
      console.error('   3. Go to App Passwords');
      console.error('   4. Generate new password for "Mail" / "Other"');
      console.error('   5. Copy the 16-character password (remove spaces)');
    } else if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
      console.error('\n💡 Connection failed. Please check:');
      console.error('   1. Internet connection is working');
      console.error('   2. Firewall allows SMTP connections');
      console.error('   3. SMTP_HOST and SMTP_PORT are correct');
    }
    
    process.exit(1);
  }
}

testEmail();
