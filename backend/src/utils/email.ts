import { Deadline } from '@prisma/client';
import nodemailer, { Transporter } from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

const createTransporter = (): Transporter | null => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null;
  }
  
  try {
    const port = parseInt(process.env.SMTP_PORT || '587');
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;
    
    // Remove spaces from password (Gmail App Passwords often have spaces but shouldn't in config)
    const password = process.env.SMTP_PASS.replace(/\s/g, '');
    
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: port,
      secure: secure, // true for 465, false for 587
      auth: {
        user: process.env.SMTP_USER,
        pass: password,
      },
      tls: {
        rejectUnauthorized: false // Allow self-signed certificates
      },
      connectionTimeout: 10000, // 10 second timeout
      greetingTimeout: 10000,
    });
  } catch (error) {
    console.error('Failed to create email transporter:', error);
    return null;
  }
};

export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    console.log('[EMAIL] Attempting to send email to:', options.to);
    console.log('[EMAIL] SMTP User configured:', process.env.SMTP_USER ? 'YES' : 'NO');
    console.log('[EMAIL] SMTP Pass configured:', process.env.SMTP_PASS ? 'YES' : 'NO');
    
    // Skip if email credentials not configured
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('[EMAIL] ❌ Email not sent: SMTP credentials not configured');
      return false;
    }

    const transporter = createTransporter();
    if (!transporter) {
      console.log('[EMAIL] ❌ Email not sent: Failed to create transporter');
      return false;
    }

    console.log('[EMAIL] Sending email via SMTP...');
    
    // Set a timeout to prevent hanging (15 second timeout)
      const sendPromise = transporter.sendMail({
        from: `"${process.env.SMTP_FROM_NAME || 'Lawravel'}" <${process.env.SMTP_USER}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });
    
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Email send timeout after 15 seconds')), 15000)
    );
    
    const info: any = await Promise.race([sendPromise, timeoutPromise]);

    console.log(`[EMAIL] ✅ Email sent successfully to ${options.to}`);
    console.log(`[EMAIL] Message ID: ${info.messageId}`);
    return true;
  } catch (error: any) {
    console.error('[EMAIL] ❌ Failed to send email:', error.message || error);
    console.error('[EMAIL] Error code:', error.code);
    console.error('[EMAIL] Error details:', JSON.stringify(error, null, 2));
    return false;
  }
};

export const sendDeadlineReminder = async (
  deadline: Deadline & { case: { title: string; suitNumber: string }; user?: { email: string; firstName: string } },
  recipientEmail: string,
  recipientName: string,
  daysUntilDue: number
): Promise<boolean> => {
  const urgency = daysUntilDue <= 1 ? 'URGENT' : daysUntilDue <= 3 ? 'HIGH' : 'NORMAL';
  const urgencyColor = urgency === 'URGENT' ? '#EF4444' : urgency === 'HIGH' ? '#F59E0B' : '#3B82F6';

  const subject = `${urgency === 'URGENT' ? '🚨 URGENT: ' : urgency === 'HIGH' ? '⚠️ ' : '📅 '}Deadline Reminder - ${deadline.title}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: ${urgencyColor}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
        .deadline-box { background-color: white; padding: 15px; margin: 15px 0; border-radius: 6px; border-left: 4px solid ${urgencyColor}; }
        .info-row { margin: 10px 0; }
        .label { font-weight: bold; color: #6b7280; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
        .button { display: inline-block; padding: 12px 24px; background-color: ${urgencyColor}; color: white; text-decoration: none; border-radius: 6px; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">${urgency} Deadline Reminder</h1>
          <p style="margin: 5px 0 0 0; opacity: 0.9;">You have an upcoming deadline</p>
        </div>
        <div class="content">
          <p>Hello ${recipientName},</p>
          <p>This is a reminder about an upcoming deadline that requires your attention.</p>
          
          <div class="deadline-box">
            <h2 style="margin-top: 0; color: ${urgencyColor};">${deadline.title}</h2>
            
            <div class="info-row">
              <span class="label">Case:</span> ${deadline.case.title} (${deadline.case.suitNumber})
            </div>
            
            <div class="info-row">
              <span class="label">Due Date:</span> ${new Date(deadline.dueDate).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
            
            <div class="info-row">
              <span class="label">Time Until Due:</span> ${daysUntilDue === 0 ? 'Today!' : daysUntilDue === 1 ? 'Tomorrow' : `${daysUntilDue} days`}
            </div>
            
            ${deadline.description ? `
            <div class="info-row">
              <span class="label">Description:</span><br/>
              ${deadline.description}
            </div>
            ` : ''}
          </div>
          
          <p>Please ensure this deadline is met on time to avoid any complications.</p>
          
          <p style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/cases/${deadline.caseId}" class="button">
              View Case Details
            </a>
          </p>
        </div>
        <div class="footer">
          <p>This is an automated reminder from your Lawravel.</p>
          <p>© ${new Date().getFullYear()} Lawravel. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
${urgency} Deadline Reminder

Hello ${recipientName},

You have an upcoming deadline:

Title: ${deadline.title}
Case: ${deadline.case.title} (${deadline.case.suitNumber})
Due Date: ${new Date(deadline.dueDate).toLocaleDateString()}
Time Until Due: ${daysUntilDue === 0 ? 'Today!' : daysUntilDue === 1 ? 'Tomorrow' : `${daysUntilDue} days`}

${deadline.description ? `Description: ${deadline.description}` : ''}

Please ensure this deadline is met on time.

View case: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/cases/${deadline.caseId}
  `.trim();

  return sendEmail({ to: recipientEmail, subject, html, text });
};

export const sendWelcomeEmail = async (
  email: string,
  name: string,
  firmName: string
): Promise<boolean> => {
  const subject = `Welcome to ${firmName}!`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #3B82F6; color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
        .content { background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
        .button { display: inline-block; padding: 12px 24px; background-color: #3B82F6; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">Welcome to ${firmName}!</h1>
        </div>
        <div class="content">
          <p>Hello ${name},</p>
          <p>Welcome to your firm's case management platform! We're excited to have you on board.</p>
          
          <p>With this platform, you can:</p>
          <ul>
            <li>Manage cases and track their progress</li>
            <li>Upload and organize documents with version control</li>
            <li>Set deadlines and receive automated reminders</li>
            <li>Schedule and track hearings</li>
            <li>Collaborate with team members across branches</li>
            <li>View analytics and performance insights</li>
          </ul>
          
          <p style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" class="button">
              Get Started
            </a>
          </p>
          
          <p>If you have any questions or need assistance, don't hesitate to reach out to your system administrator.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Lawravel. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `Welcome to ${firmName}!\n\nHello ${name},\n\nWelcome to your firm's case management platform!\n\nGet started: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`;

  return sendEmail({ to: email, subject, html, text });
};

export const sendCaseAssignmentEmail = async (
  lawyerEmail: string,
  lawyerName: string,
  caseTitle: string,
  suitNumber: string,
  caseId: string,
  assignedByName: string,
  role?: string
): Promise<boolean> => {
  const subject = `🔔 You've been assigned to a new case - ${caseTitle}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #10B981; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
        .case-box { background-color: white; padding: 15px; margin: 15px 0; border-radius: 6px; border-left: 4px solid #10B981; }
        .info-row { margin: 10px 0; }
        .label { font-weight: bold; color: #6b7280; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #10B981; color: white; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        .badge { display: inline-block; padding: 4px 12px; background-color: #DBEAFE; color: #1E40AF; border-radius: 12px; font-size: 12px; font-weight: 600; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">New Case Assignment</h1>
          <p style="margin: 5px 0 0 0; opacity: 0.9;">You have been assigned to a case</p>
        </div>
        <div class="content">
          <p>Hello ${lawyerName},</p>
          <p>You have been assigned to work on a new case. Please review the case details and take necessary actions.</p>
          
          <div class="case-box">
            <h2 style="margin-top: 0; color: #10B981;">${caseTitle}</h2>
            
            <div class="info-row">
              <span class="label">Suit Number:</span> ${suitNumber}
            </div>
            
            ${role ? `
            <div class="info-row">
              <span class="label">Your Role:</span> <span class="badge">${role}</span>
            </div>
            ` : ''}
            
            <div class="info-row">
              <span class="label">Assigned By:</span> ${assignedByName}
            </div>
            
            <div class="info-row">
              <span class="label">Date Assigned:</span> ${new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>
          
          <p>Click the button below to view the full case details, documents, deadlines, and hearings.</p>
          
          <p style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/cases/${caseId}" class="button">
              View Case Details
            </a>
          </p>
        </div>
          <div class="footer">
          <p>This is an automated notification from your Lawravel.</p>
          <p>© ${new Date().getFullYear()} Lawravel. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
New Case Assignment

Hello ${lawyerName},

You have been assigned to work on a new case:

Case: ${caseTitle}
Suit Number: ${suitNumber}
${role ? `Your Role: ${role}` : ''}
Assigned By: ${assignedByName}
Date: ${new Date().toLocaleDateString()}

View case details: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/cases/${caseId}
  `.trim();

  return sendEmail({ to: lawyerEmail, subject, html, text });
};

/**
 * Send hearing reminder email
 */
export const sendHearingReminder = async (
  hearing: any,
  recipientEmail: string,
  recipientName: string,
  daysUntilHearing: number
): Promise<boolean> => {
  const urgencyLevel = daysUntilHearing === 0 ? '🚨 TODAY' : daysUntilHearing === 1 ? '⚠️ TOMORROW' : '📅 UPCOMING';
  const subject = `${urgencyLevel} - Hearing Reminder: ${hearing.case.title}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: ${daysUntilHearing === 0 ? '#DC2626' : daysUntilHearing === 1 ? '#F59E0B' : '#3B82F6'}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
        .hearing-box { background-color: white; padding: 15px; margin: 15px 0; border-radius: 6px; border-left: 4px solid ${daysUntilHearing === 0 ? '#DC2626' : daysUntilHearing === 1 ? '#F59E0B' : '#3B82F6'}; }
        .info-row { margin: 10px 0; }
        .label { font-weight: bold; color: #6b7280; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #3B82F6; color: white; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        .urgent { font-size: 20px; font-weight: bold; color: #DC2626; text-align: center; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">${urgencyLevel} Hearing Reminder</h1>
          <p style="margin: 5px 0 0 0; opacity: 0.9;">${daysUntilHearing === 0 ? 'Today!' : daysUntilHearing === 1 ? 'Tomorrow' : `In ${daysUntilHearing} days`}</p>
        </div>
        <div class="content">
          <p>Hello ${recipientName},</p>
          
          ${daysUntilHearing === 0 ? '<p class="urgent">⚠️ HEARING TODAY ⚠️</p>' : ''}
          
          <p>This is a reminder that you have an upcoming hearing scheduled.</p>
          
          <div class="hearing-box">
            <h2 style="margin-top: 0; color: ${daysUntilHearing === 0 ? '#DC2626' : '#3B82F6'};">${hearing.title}</h2>
            
            <div class="info-row">
              <span class="label">Case:</span> ${hearing.case.title} ${hearing.case.suitNumber ? `(${hearing.case.suitNumber})` : ''}
            </div>
            
            <div class="info-row">
              <span class="label">Date & Time:</span> ${new Date(hearing.hearingDate).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
            
            ${hearing.courtRoom ? `
            <div class="info-row">
              <span class="label">Court Room:</span> ${hearing.courtRoom}
            </div>
            ` : ''}
            
            ${hearing.judgeName ? `
            <div class="info-row">
              <span class="label">Judge:</span> ${hearing.judgeName}
            </div>
            ` : ''}
            
            ${hearing.notes ? `
            <div class="info-row">
              <span class="label">Notes:</span> ${hearing.notes}
            </div>
            ` : ''}
          </div>
          
          <p>Please ensure you are fully prepared with all necessary documents and materials.</p>
          
          <p style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/cases/${hearing.caseId}" class="button">
              View Case Details
            </a>
          </p>
        </div>
        <div class="footer">
            <p>This is an automated reminder from your Lawravel.</p>
          <p>© ${new Date().getFullYear()} Lawravel. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
${urgencyLevel} - HEARING REMINDER

Hello ${recipientName},

${daysUntilHearing === 0 ? '⚠️ THIS HEARING IS TODAY! ⚠️' : ''}

Hearing: ${hearing.title}
Case: ${hearing.case.title} (${hearing.case.suitNumber})
Date: ${new Date(hearing.hearingDate).toLocaleDateString()} at ${new Date(hearing.hearingDate).toLocaleTimeString()}
${hearing.courtRoom ? `Court Room: ${hearing.courtRoom}` : ''}
${hearing.judgeName ? `Judge: ${hearing.judgeName}` : ''}
Time Until Hearing: ${daysUntilHearing === 0 ? 'Today!' : daysUntilHearing === 1 ? 'Tomorrow' : `${daysUntilHearing} days`}

${hearing.notes ? `Notes: ${hearing.notes}` : ''}

Please ensure you are fully prepared.

View case: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/cases/${hearing.caseId}
  `.trim();

  return sendEmail({ to: recipientEmail, subject, html, text });
};
