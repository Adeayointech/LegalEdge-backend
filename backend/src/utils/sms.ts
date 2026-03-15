import axios from 'axios';

export interface SMSOptions {
  to: string;
  message: string;
}

const TERMII_API_KEY = process.env.TERMII_API_KEY;
const TERMII_SENDER_ID = process.env.TERMII_SENDER_ID || 'LawFirm';
const TERMII_API_URL = 'https://api.ng.termii.com/api/sms/send';

/**
 * Send SMS via Termii
 * Phone numbers should be in format: 2348012345678 (country code + number without +)
 */
export const sendSMS = async (options: SMSOptions): Promise<boolean> => {
  try {
    // Skip if SMS credentials not configured
    if (!TERMII_API_KEY) {
      console.log('SMS not sent: Termii API key not configured');
      return false;
    }

    // Format phone number (remove +, spaces, dashes)
    let phoneNumber = options.to.replace(/[\s\-+]/g, '');
    
    // If number starts with 0, replace with 234 (Nigeria)
    if (phoneNumber.startsWith('0')) {
      phoneNumber = '234' + phoneNumber.substring(1);
    }
    
    // If number doesn't have country code, assume Nigeria
    if (!phoneNumber.startsWith('234')) {
      phoneNumber = '234' + phoneNumber;
    }

    // Build payload - only include 'from' if sender ID is provided
    const payload: any = {
      to: phoneNumber,
      sms: options.message,
      type: 'plain',
      channel: 'dnd',
      api_key: TERMII_API_KEY,
    };

    // Only add 'from' field if sender ID is configured
    if (TERMII_SENDER_ID && TERMII_SENDER_ID.trim()) {
      payload.from = TERMII_SENDER_ID;
    }

    const response = await axios.post(TERMII_API_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000, // 10 second timeout
    });

    if (response.data.message_id) {
      console.log(`SMS sent successfully to ${phoneNumber}. Message ID: ${response.data.message_id}`);
      return true;
    } else {
      console.error('SMS sending failed:', response.data);
      return false;
    }
  } catch (error: any) {
    if (error.response) {
      console.error('Termii API error:', error.response.data);
    } else {
      console.error('Failed to send SMS:', error.message);
    }
    return false;
  }
};

/**
 * Send SMS notification for case assignment
 */
export const sendCaseAssignmentSMS = async (
  phoneNumber: string,
  lawyerName: string,
  caseTitle: string,
  suitNumber: string
): Promise<boolean> => {
  const message = `Hi ${lawyerName}, you've been assigned to case "${caseTitle}" (${suitNumber}). Please check the portal for details.`;
  
  return sendSMS({ to: phoneNumber, message });
};

/**
 * Send SMS for urgent deadline reminder (24 hours before)
 */
export const sendDeadlineReminderSMS = async (
  phoneNumber: string,
  lawyerName: string,
  deadlineTitle: string,
  caseTitle: string,
  hoursUntilDue: number
): Promise<boolean> => {
  let urgencyText = '';
  if (hoursUntilDue <= 24) {
    urgencyText = '🚨 URGENT: ';
  }
  
  const message = `${urgencyText}Hi ${lawyerName}, deadline reminder: "${deadlineTitle}" for case "${caseTitle}" is due in ${hoursUntilDue} hours. Take action now!`;
  
  return sendSMS({ to: phoneNumber, message });
};

/**
 * Send SMS for overdue deadline
 */
export const sendOverdueDeadlineSMS = async (
  phoneNumber: string,
  lawyerName: string,
  deadlineTitle: string,
  caseTitle: string
): Promise<boolean> => {
  const message = `🚨 OVERDUE: ${lawyerName}, the deadline "${deadlineTitle}" for case "${caseTitle}" is now overdue. Please take immediate action!`;
  
  return sendSMS({ to: phoneNumber, message });
};

/**
 * Send SMS for user approval notification
 */
export const sendUserApprovalSMS = async (
  phoneNumber: string,
  userName: string,
  firmName: string
): Promise<boolean> => {
  const message = `Hi ${userName}, your account for ${firmName} has been approved! You can now log in to the case management portal.`;
  
  return sendSMS({ to: phoneNumber, message });
};

/**
 * Send SMS reminder for upcoming hearing
 */
export const sendHearingReminderSMS = async (
  phoneNumber: string,
  lawyerName: string,
  hearingTitle: string,
  caseTitle: string,
  hoursUntilHearing: number
): Promise<boolean> => {
  let urgencyText = '';
  if (hoursUntilHearing <= 24) {
    urgencyText = '🚨 URGENT: ';
  }
  
  const message = `${urgencyText}Hi ${lawyerName}, hearing reminder: "${hearingTitle}" for case "${caseTitle}" is in ${hoursUntilHearing} hours. Be prepared!`;
  
  return sendSMS({ to: phoneNumber, message });
};
