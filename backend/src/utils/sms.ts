import crypto from 'crypto';

// In-memory store for SMS codes (in production, use Redis)
const smsCodeStore: Map<string, { code: string; expiresAt: number; attempts: number }> = new Map();

export const generateSMSCode = (): string => {
  return Math.random().toString().slice(2, 8);
};

export const storeSMSCode = (phone: string, code: string): void => {
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
  smsCodeStore.set(phone, { code, expiresAt, attempts: 0 });
};

export const verifySMSCode = (phone: string, code: string): boolean => {
  const stored = smsCodeStore.get(phone);
  
  if (!stored) {
    return false;
  }

  // Check if code has expired
  if (Date.now() > stored.expiresAt) {
    smsCodeStore.delete(phone);
    return false;
  }

  // Check attempts limit
  if (stored.attempts >= 3) {
    smsCodeStore.delete(phone);
    return false;
  }

  // Increment attempts
  stored.attempts++;

  // Verify code
  if (stored.code === code) {
    smsCodeStore.delete(phone); // Remove after successful verification
    return true;
  }

  return false;
};

export const sendSMS = async (phone: string, message: string): Promise<boolean> => {
  try {
    // In development, just log the SMS
    if (process.env.NODE_ENV === 'development') {
      console.log(`📱 SMS to ${phone}: ${message}`);
      return true;
    }

    // In production, integrate with SMS service provider
    // Example: Twilio, AWS SNS, etc.
    // const response = await twilioClient.messages.create({
    //   body: message,
    //   from: process.env.TWILIO_PHONE_NUMBER,
    //   to: phone
    // });

    return true;
  } catch (error) {
    console.error('SMS sending error:', error);
    return false;
  }
};

export const sendVerificationSMS = async (phone: string): Promise<string | null> => {
  try {
    const code = generateSMSCode();
    const message = `【PropAgent Pro】您的驗證碼是：${code}，5分鐘內有效，請勿洩露給他人。`;
    
    const success = await sendSMS(phone, message);
    
    if (success) {
      storeSMSCode(phone, code);
      return code;
    }
    
    return null;
  } catch (error) {
    console.error('Verification SMS error:', error);
    return null;
  }
};

export const validatePhoneNumber = (phone: string): boolean => {
  // Taiwan mobile phone format: 09xxxxxxxx
  const taiwanMobileRegex = /^09\d{8}$/;
  return taiwanMobileRegex.test(phone);
};

export const cleanupExpiredCodes = (): void => {
  const now = Date.now();
  for (const [phone, data] of smsCodeStore.entries()) {
    if (now > data.expiresAt) {
      smsCodeStore.delete(phone);
    }
  }
};

// Clean up expired codes every 5 minutes
setInterval(cleanupExpiredCodes, 5 * 60 * 1000);