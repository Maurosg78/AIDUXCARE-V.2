/**
 * SMS Service
 * 
 * Handles SMS delivery for patient consent requests via Twilio.
 * 
 * Market: CA · en-CA · PHIPA/PIPEDA Ready
 * 
 * @version 1.0.0
 * @author AiDuxCare Development Team
 */

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import logger from '@/shared/utils/logger';
import { SMS_TEMPLATES, validateSMSTemplate } from '../content/smsTemplates';
import { getPublicBaseUrl } from '../utils/urlHelpers';
import { normalizeNameForSMS } from '../utils/textNormalizer';

const SMS_COLLECTION = 'pending_sms'; // Audit trail for SMS sends

const SMS_PROVIDER = (import.meta.env.VITE_SMS_PROVIDER || 'twilio').toLowerCase();

// Twilio configuration
const TWILIO_ACCOUNT_SID = import.meta.env.VITE_TWILIO_ACCOUNT_SID || '';
const TWILIO_AUTH_TOKEN = import.meta.env.VITE_TWILIO_AUTH_TOKEN || '';
const TWILIO_PHONE_NUMBER = import.meta.env.VITE_TWILIO_PHONE_NUMBER || '+16474240008';
const TWILIO_ENABLED = !!(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER);

// Vonage configuration
const VONAGE_API_KEY = import.meta.env.VITE_VONAGE_API_KEY || '';
const VONAGE_API_SECRET = import.meta.env.VITE_VONAGE_API_SECRET || '';
const VONAGE_FROM_NUMBER = import.meta.env.VITE_VONAGE_FROM_NUMBER || '';
const VONAGE_ENABLED = !!(VONAGE_API_KEY && VONAGE_API_SECRET && VONAGE_FROM_NUMBER);

// Log Twilio configuration status (only in development)
if (import.meta.env.DEV) {
  console.log('[SMS SERVICE] Provider configuration:', {
    provider: SMS_PROVIDER,
    twilio: {
      accountSid: TWILIO_ACCOUNT_SID ? '✅ Set' : '❌ Missing',
      authToken: TWILIO_AUTH_TOKEN ? '✅ Set' : '❌ Missing',
      phoneNumber: TWILIO_PHONE_NUMBER ? `✅ ${TWILIO_PHONE_NUMBER}` : '❌ Missing',
      enabled: TWILIO_ENABLED ? '✅ Enabled' : '❌ Disabled'
    },
    vonage: {
      apiKey: VONAGE_API_KEY ? '✅ Set' : '❌ Missing',
      apiSecret: VONAGE_API_SECRET ? '✅ Set' : '❌ Missing',
      phoneNumber: VONAGE_FROM_NUMBER ? `✅ ${VONAGE_FROM_NUMBER}` : '❌ Missing',
      enabled: VONAGE_ENABLED ? '✅ Enabled' : '❌ Disabled'
    }
  });
}

/**
 * SMS Service
 * 
 * Handles SMS delivery for patient consent and notifications
 */
export class SMSService {
  /**
   * ✅ WO-CONSENT-VERBAL-NON-BLOCKING-01: Send disclosure document link via SMS
   * 
   * @param phone - Patient phone number (E.164 format)
   * @param patientName - Patient name
   * @param patientId - Patient ID
   * @returns Promise<void>
   */
  static async sendDisclosureLink(
    phone: string,
    patientName: string,
    patientId: string
  ): Promise<void> {
    try {
      const publicBaseUrl = getPublicBaseUrl();
      const disclosureUrl = `${publicBaseUrl}/disclosure/${patientId}`;
      
      // Simple disclosure message (can be enhanced later)
      const message = `Hi ${normalizeNameForSMS(patientName)}, your consent disclosure document is available at: ${disclosureUrl}`;
      
      // Validate template
      const validation = validateSMSTemplate(message);
      if (!validation.isValid) {
        logger.error('[SMS] Disclosure template validation failed:', validation.errors);
        throw new Error(`SMS template validation failed: ${validation.errors.join(', ')}`);
      }

      // Validate and format phone number
      let validatedPhone = phone.trim();
      
      // Use same SMS sending logic as consent link
      if (SMS_PROVIDER === 'vonage' && VONAGE_ENABLED) {
        // Vonage implementation (same as sendConsentLink)
        const response = await fetch(
          `https://us-central1-${import.meta.env.VITE_FIREBASE_PROJECT_ID}.cloudfunctions.net/sendConsentSMS`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              to: validatedPhone,
              message,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        logger.info('[SMS] Vonage disclosure SMS sent via Cloud Function:', {
          to: validatedPhone,
          messageId: result.messageId,
          remainingBalance: result.remainingBalance
        });
      } else if (TWILIO_ENABLED) {
        // Twilio implementation (same as sendConsentLink)
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
        const formData = new URLSearchParams();
        formData.append('To', validatedPhone);
        formData.append('From', TWILIO_PHONE_NUMBER);
        formData.append('Body', message);

        const response = await fetch(twilioUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData.toString(),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Twilio error: ${response.statusText}`);
        }

        const result = await response.json();
        logger.info('[SMS] Twilio disclosure SMS sent:', {
          to: validatedPhone,
          sid: result.sid,
          status: result.status
        });
      } else {
        throw new Error('SMS service is not configured');
      }

      // Audit trail
      await addDoc(collection(db, SMS_COLLECTION), {
        phone: validatedPhone,
        message,
        patientName,
        patientId,
        type: 'disclosure',
        status: 'sent',
        createdAt: serverTimestamp(),
      });
    } catch (error: any) {
      logger.error('[SMS] Error sending disclosure link:', error);
      throw error;
    }
  }

  /**
   * Send consent link via SMS using Twilio
   * 
   * @param phone - Patient phone number (E.164 format recommended)
   * @param patientName - Patient name
   * @param clinicName - Clinic name
   * @param physiotherapistName - Physiotherapist name
   * @param consentToken - Unique consent token
   * @returns Promise<void>
   */
  static async sendConsentLink(
    phone: string,
    patientName: string,
    clinicName: string,
    physiotherapistName: string,
    consentToken: string
  ): Promise<void> {
    try {
      // Get production URL (never localhost in production)
      const publicBaseUrl = getPublicBaseUrl();
      const consentUrl = `${publicBaseUrl}/consent/${consentToken}`;
      const privacyUrl = `${publicBaseUrl}/privacy-policy`;
      
      // Use English template (en-CA for Canadian market)
      const message = SMS_TEMPLATES.consent.en_CA(
        normalizeNameForSMS(patientName),
        normalizeNameForSMS(physiotherapistName),
        consentUrl,
        privacyUrl
      );
      
      // Validate template (ensure no Spanish content)
      const validation = validateSMSTemplate(message);
      if (!validation.isValid) {
        logger.error('[SMS] Template validation failed:', validation.errors);
        throw new Error(`SMS template validation failed: ${validation.errors.join(', ')}`);
      }

      // Validate and format phone number BEFORE using it
      let validatedPhone = phone.trim();
      
      // Log original phone for debugging
      logger.info('[SMS] Original phone number:', { original: validatedPhone, length: validatedPhone.length });
      
      // Validate phone number
      if (!SMSService.validatePhoneNumber(validatedPhone)) {
        const formatted = SMSService.formatPhoneNumber(validatedPhone);
        if (!SMSService.validatePhoneNumber(formatted)) {
          logger.error('[SMS] Phone validation failed:', { original: validatedPhone, formatted });
          throw new Error(`Invalid phone number format: ${validatedPhone}. Expected E.164 format (e.g., +14161234567)`);
        }
        validatedPhone = formatted;
        logger.info('[SMS] Phone number formatted:', { original: phone, formatted: validatedPhone });
      }
      
      // Final validation: must be E.164 format
      if (!/^\+[1-9]\d{1,14}$/.test(validatedPhone)) {
        logger.error('[SMS] Phone number does not match E.164 format:', { phone: validatedPhone });
        throw new Error(`Invalid phone number format: ${validatedPhone}. Must be E.164 format (e.g., +14161234567)`);
      }
      
      // Ensure phone number is exactly 12 characters for North American numbers (+1 + 10 digits)
      if (validatedPhone.startsWith('+1') && validatedPhone.length !== 12) {
        logger.error('[SMS] North American phone number has incorrect length:', { 
          phone: validatedPhone, 
          length: validatedPhone.length,
          expected: 12 
        });
        throw new Error(`Invalid North American phone number length: ${validatedPhone}. Expected 12 characters (+1 + 10 digits)`);
      }
      
      phone = validatedPhone; // Use validated phone
      logger.info('[SMS] Final validated phone:', { phone, length: phone.length });

      // Save to Firestore audit trail BEFORE sending
      const auditRef = await addDoc(collection(db, SMS_COLLECTION), {
        phone,
        message,
        patientName,
        clinicName,
        consentToken,
        consentUrl,
        status: 'sending',
        createdAt: serverTimestamp(),
        type: 'consent_request',
        twilioEnabled: TWILIO_ENABLED,
      });

      logger.info('[SMS] Sending consent link:', {
        phone,
        phoneLength: phone.length,
        patientName,
        consentUrl,
        twilioEnabled: TWILIO_ENABLED,
        note: '⚠️ In Twilio trial accounts, SMS can only be sent to verified phone numbers. Verify numbers in Twilio Console > Phone Numbers > Verified Caller IDs'
      });

      const providerUsed = SMS_PROVIDER === 'vonage' ? 'vonage' : 'twilio';

      if (providerUsed === 'vonage') {
        if (!VONAGE_ENABLED) {
          throw new Error('Vonage provider selected but API key/secret or phone number are missing.');
        }
        await SMSService.sendViaVonage({
          phone,
          message,
          patientName,
          clinicName,
          consentToken,
          consentUrl,
          auditRefId: auditRef.id,
        });
      } else if (TWILIO_ENABLED) {
        try {
          // Ensure phone number has no spaces (Twilio requires E.164 without spaces)
          const cleanPhoneForTwilio = phone.replace(/\s/g, '');
          
          // Detect if sending to Canadian number from US Twilio number
          const isCanadianNumber = cleanPhoneForTwilio.startsWith('+1') && 
            (cleanPhoneForTwilio.startsWith('+1416') || cleanPhoneForTwilio.startsWith('+1647') || 
             cleanPhoneForTwilio.startsWith('+1437') || cleanPhoneForTwilio.startsWith('+1513') ||
             cleanPhoneForTwilio.startsWith('+1613') || cleanPhoneForTwilio.startsWith('+1506') ||
             cleanPhoneForTwilio.startsWith('+1705') || cleanPhoneForTwilio.startsWith('+1807') ||
             cleanPhoneForTwilio.startsWith('+1226') || cleanPhoneForTwilio.startsWith('+1343') ||
             cleanPhoneForTwilio.startsWith('+1365') || cleanPhoneForTwilio.startsWith('+1403') ||
             cleanPhoneForTwilio.startsWith('+1431') || cleanPhoneForTwilio.startsWith('+1450') ||
             cleanPhoneForTwilio.startsWith('+1418') || cleanPhoneForTwilio.startsWith('+1819') ||
             cleanPhoneForTwilio.startsWith('+1878') || cleanPhoneForTwilio.startsWith('+1236') ||
             cleanPhoneForTwilio.startsWith('+1249') || cleanPhoneForTwilio.startsWith('+1289') ||
             cleanPhoneForTwilio.startsWith('+1306') || cleanPhoneForTwilio.startsWith('+1639') ||
             cleanPhoneForTwilio.startsWith('+1832') || cleanPhoneForTwilio.startsWith('+1867') ||
             cleanPhoneForTwilio.startsWith('+1905') || cleanPhoneForTwilio.startsWith('+1937'));
          
          const isUSNumber = TWILIO_PHONE_NUMBER?.startsWith('+1') && 
            !TWILIO_PHONE_NUMBER.startsWith('+1416') && !TWILIO_PHONE_NUMBER.startsWith('+1647') &&
            !TWILIO_PHONE_NUMBER.startsWith('+1437') && !TWILIO_PHONE_NUMBER.startsWith('+1513') &&
            !TWILIO_PHONE_NUMBER.startsWith('+1613') && !TWILIO_PHONE_NUMBER.startsWith('+1506') &&
            !TWILIO_PHONE_NUMBER.startsWith('+1705') && !TWILIO_PHONE_NUMBER.startsWith('+1807') &&
            !TWILIO_PHONE_NUMBER.startsWith('+1226') && !TWILIO_PHONE_NUMBER.startsWith('+1343') &&
            !TWILIO_PHONE_NUMBER.startsWith('+1365') && !TWILIO_PHONE_NUMBER.startsWith('+1403') &&
            !TWILIO_PHONE_NUMBER.startsWith('+1431') && !TWILIO_PHONE_NUMBER.startsWith('+1450') &&
            !TWILIO_PHONE_NUMBER.startsWith('+1418') && !TWILIO_PHONE_NUMBER.startsWith('+1819') &&
            !TWILIO_PHONE_NUMBER.startsWith('+1878') && !TWILIO_PHONE_NUMBER.startsWith('+1236') &&
            !TWILIO_PHONE_NUMBER.startsWith('+1249') && !TWILIO_PHONE_NUMBER.startsWith('+1289') &&
            !TWILIO_PHONE_NUMBER.startsWith('+1306') && !TWILIO_PHONE_NUMBER.startsWith('+1639') &&
            !TWILIO_PHONE_NUMBER.startsWith('+1832') && !TWILIO_PHONE_NUMBER.startsWith('+1867') &&
            !TWILIO_PHONE_NUMBER.startsWith('+1905') && !TWILIO_PHONE_NUMBER.startsWith('+1937');
          
          // Log exact values being sent to Twilio
          logger.info('[SMS] Twilio API Request Details:', {
            from: TWILIO_PHONE_NUMBER,
            to: cleanPhoneForTwilio,
            toLength: cleanPhoneForTwilio.length,
            toFormatted: cleanPhoneForTwilio,
            messageLength: message.length,
            accountSid: TWILIO_ACCOUNT_SID?.substring(0, 10) + '...',
            isCanadianNumber,
            isUSNumber,
            warning: isUSNumber && isCanadianNumber ? '⚠️ US Twilio number sending to Canadian number - may be blocked by domestic-only restriction' : null,
          });
          
          // Use Twilio REST API directly (no SDK needed for simple use case)
          const response = await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
              },
              body: new URLSearchParams({
                From: TWILIO_PHONE_NUMBER,
                To: cleanPhoneForTwilio, // Use cleaned phone without spaces
                Body: message,
              }),
            }
          );

          if (!response.ok) {
            const errorData = await response.json();
            const errorMessage = errorData.message || response.statusText;
            const errorCode = errorData.code;
            
            // Log full error response for debugging
            logger.error('[SMS] Twilio API Error Response:', {
              status: response.status,
              statusText: response.statusText,
              errorCode,
              errorMessage,
              phoneSent: cleanPhoneForTwilio,
              fullError: errorData,
            });
            
            // Check for common Twilio trial account errors
            if (errorMessage.includes('not a valid') || errorMessage.includes('unverified') || errorCode === 21211) {
              logger.error('[SMS] Twilio trial account restriction:', {
                phone: cleanPhoneForTwilio,
                error: errorMessage,
                errorCode,
                solution: 'Verify this phone number in Twilio Console > Phone Numbers > Verified Caller IDs, or upgrade to a paid account'
              });
            }
            
            // Check for domestic-only restrictions (US number trying to send to Canada)
            if (errorCode === 21608 || errorMessage.includes('domestic') || errorMessage.includes('not allowed')) {
              logger.error('[SMS] Twilio domestic-only restriction detected:', {
                fromNumber: TWILIO_PHONE_NUMBER,
                toNumber: cleanPhoneForTwilio,
                error: errorMessage,
                errorCode,
                issue: 'US Twilio number (+1 229 267 3348) may only send to US domestic numbers. Canadian numbers (+1 647) may be blocked.',
                solution: 'Purchase a Canadian Twilio number or use a Twilio number that supports international SMS to Canada'
              });
            }
            
            throw new Error(`Twilio API error: ${errorMessage} (Code: ${errorCode || 'N/A'})`);
          }

          const result = await response.json();
          
          // Log successful response details
          logger.info('[SMS] Twilio API Success Response:', {
            sid: result.sid,
            status: result.status,
            to: result.to,
            from: result.from,
            dateCreated: result.date_created,
            price: result.price,
            priceUnit: result.price_unit,
          });

          // Update audit trail with success
          await addDoc(collection(db, SMS_COLLECTION), {
            phone: cleanPhoneForTwilio, // Store cleaned version (no spaces)
            phoneOriginal: phone, // Store original for reference
            message,
            patientName,
            clinicName,
            consentToken,
            consentUrl,
            status: 'sent',
            twilioSid: result.sid,
            twilioStatus: result.status,
            twilioPrice: result.price,
            twilioPriceUnit: result.price_unit,
            createdAt: serverTimestamp(),
            type: 'consent_request',
            auditRefId: auditRef.id,
          });

          console.log('✅ [SMS] Message sent successfully:', {
            to: cleanPhoneForTwilio,
            toOriginal: phone,
            patient: patientName,
            twilioSid: result.sid,
            status: result.status,
            messageStatus: result.status,
            price: result.price,
            priceUnit: result.price_unit,
          });

          logger.info('[SMS] Consent SMS sent via Twilio:', {
            phone: cleanPhoneForTwilio,
            phoneOriginal: phone,
            patientName,
            twilioSid: result.sid,
            status: result.status,
            dateCreated: result.date_created,
          });

        } catch (twilioError: any) {
          console.error('❌ [SMS] Twilio send failed:', twilioError);

          // Update audit trail with error
          await addDoc(collection(db, SMS_COLLECTION), {
            phone,
            message,
            patientName,
            clinicName,
            consentToken,
            consentUrl,
            status: 'failed',
            error: twilioError.message || 'Twilio send failed',
            createdAt: serverTimestamp(),
            type: 'consent_request',
            auditRefId: auditRef.id,
          });

          logger.error('[SMS] Twilio send error:', twilioError);
          
          // Re-throw to allow caller to handle (e.g., show manual fallback)
          throw new Error(`Failed to send SMS via Twilio: ${twilioError.message}`);
        }
      } else {
        // Twilio not configured - save as pending for manual sending
        console.warn('⚠️ [SMS] Twilio not configured, saving to queue for manual sending');
        
        await addDoc(collection(db, SMS_COLLECTION), {
          phone,
          message,
          patientName,
          clinicName,
          consentToken,
          consentUrl,
          status: 'pending',
          createdAt: serverTimestamp(),
          type: 'consent_request',
          auditRefId: auditRef.id,
          note: 'Twilio not configured - requires manual sending',
        });

        logger.warn('[SMS] Twilio not configured, message queued for manual sending:', {
          phone,
          patientName,
        });

        throw new Error('SMS service is not configured. Message queued for manual sending.');
      }

    } catch (error) {
      console.error('❌ [SMS] Error sending consent link:', error);
      logger.error('[SMS] Failed to send consent link:', error);
      throw error;
    }
  }

  private static async sendViaVonage(params: {
    phone: string;
    message: string;
    patientName: string;
    clinicName: string;
    consentToken: string;
    consentUrl: string;
    auditRefId: string;
  }): Promise<void> {
    const {
      phone,
      message,
      patientName,
      clinicName,
      consentToken,
      consentUrl,
      auditRefId,
    } = params;

    if (!VONAGE_ENABLED) {
      throw new Error('Vonage provider is not fully configured.');
    }

    // Get Cloud Function URL from environment or construct it
    // Format: https://{REGION}-{PROJECT_ID}.cloudfunctions.net/{FUNCTION_NAME}
    const FUNCTION_REGION = import.meta.env.VITE_FIREBASE_FUNCTIONS_REGION || 'us-central1';
    const PROJECT_ID = import.meta.env.VITE_FIREBASE_PROJECT_ID || 'aiduxcare-v2-uat-dev';
    const FUNCTION_URL = import.meta.env.VITE_SMS_FUNCTION_URL || 
      `https://${FUNCTION_REGION}-${PROJECT_ID}.cloudfunctions.net/sendConsentSMS`;

    logger.info('[SMS] Calling Cloud Function for Vonage SMS:', {
      functionUrl: FUNCTION_URL,
      to: phone,
    });

    // Call Cloud Function instead of Vonage directly (avoids CORS)
    const response = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone,
        message,
        clinicName,
        patientName,
        consentToken,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.ok) {
      logger.error('[SMS] Cloud Function error:', {
        status: response.status,
        error: data.error,
        message: data.message,
      });
      throw new Error(data.message || `SMS function error: ${data.error || 'Unknown error'}`);
    }

    logger.info('[SMS] Vonage SMS sent via Cloud Function:', {
      to: phone,
      messageId: data.messageId,
      remainingBalance: data.remainingBalance,
    });

    await addDoc(collection(db, SMS_COLLECTION), {
      phone,
      message,
      patientName,
      clinicName,
      consentToken,
      consentUrl,
      status: 'sent',
      provider: 'vonage',
      vonageMessageId: data.messageId,
      remainingBalance: data.remainingBalance,
      createdAt: serverTimestamp(),
      type: 'consent_request',
      auditRefId,
    });
  }

  /**
   * Send professional activation link via SMS
   * 
   * @param phone - Professional phone number (E.164 format recommended)
   * @param professionalName - Professional name
   * @param activationToken - Unique activation token
   * @returns Promise<void>
   */
  static async sendActivationLink(
    phone: string,
    professionalName: string,
    activationToken: string
  ): Promise<void> {
    try {
      // Get production URL (never localhost in production)
      const publicBaseUrl = getPublicBaseUrl();
      const activationUrl = `${publicBaseUrl}/activate?token=${activationToken}`;
      
      // Build privacy policy and data usage URLs
      const privacyPolicyUrl = `${publicBaseUrl}/privacy-policy`;
      const dataUsageUrl = `${publicBaseUrl}/privacy-policy#data-usage`;
      
      // Use English template (en-CA for Canadian market)
      const message = SMS_TEMPLATES.activation.en_CA(
        normalizeNameForSMS(professionalName),
        activationUrl,
        privacyPolicyUrl,
        dataUsageUrl
      );
      
      // Validate template (ensure no Spanish content)
      const validation = validateSMSTemplate(message);
      if (!validation.isValid) {
        logger.error('[SMS Activation] Template validation failed:', validation.errors);
        throw new Error(`SMS template validation failed: ${validation.errors.join(', ')}`);
      }

      // Validate and format phone number
      let validatedPhone = phone.trim();
      
      logger.info('[SMS Activation] Original phone number:', { original: validatedPhone, length: validatedPhone.length });
      
      // Validate phone number
      if (!SMSService.validatePhoneNumber(validatedPhone)) {
        const formatted = SMSService.formatPhoneNumber(validatedPhone);
        if (!SMSService.validatePhoneNumber(formatted)) {
          logger.error('[SMS Activation] Phone validation failed:', { original: validatedPhone, formatted });
          throw new Error(`Invalid phone number format: ${validatedPhone}. Expected E.164 format (e.g., +14161234567)`);
        }
        validatedPhone = formatted;
        logger.info('[SMS Activation] Phone number formatted:', { original: phone, formatted: validatedPhone });
      }
      
      // Final validation: must be E.164 format
      if (!/^\+[1-9]\d{1,14}$/.test(validatedPhone)) {
        logger.error('[SMS Activation] Phone number does not match E.164 format:', { phone: validatedPhone });
        throw new Error(`Invalid phone number format: ${validatedPhone}. Must be E.164 format (e.g., +34600123456)`);
      }
      
      phone = validatedPhone;
      logger.info('[SMS Activation] Final validated phone:', { phone, length: phone.length });

      // Send SMS via Vonage Cloud Function (preferred) or Twilio
      const providerUsed = SMS_PROVIDER === 'vonage' ? 'vonage' : 'twilio';

      if (providerUsed === 'vonage') {
        if (!VONAGE_ENABLED) {
          throw new Error('Vonage provider selected but API key/secret or phone number are missing.');
        }
        
        // Get Cloud Function URL
        const FUNCTION_REGION = import.meta.env.VITE_FIREBASE_FUNCTIONS_REGION || 'us-central1';
        const PROJECT_ID = import.meta.env.VITE_FIREBASE_PROJECT_ID || 'aiduxcare-v2-uat-dev';
        const FUNCTION_URL = import.meta.env.VITE_SMS_FUNCTION_URL || 
          `https://${FUNCTION_REGION}-${PROJECT_ID}.cloudfunctions.net/sendConsentSMS`;

        logger.info('[SMS Activation] Calling Cloud Function for Vonage SMS:', {
          functionUrl: FUNCTION_URL,
          to: phone,
        });

        // Call Cloud Function
        const response = await fetch(FUNCTION_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phone,
            message,
            clinicName: 'AiDuxCare',
            patientName: professionalName,
            consentToken: activationToken,
          }),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok || !data.ok) {
          logger.error('[SMS Activation] Cloud Function error:', {
            status: response.status,
            error: data.error,
            message: data.message,
          });
          throw new Error(data.message || `SMS function error: ${data.error || 'Unknown error'}`);
        }

        logger.info('[SMS Activation] Vonage SMS sent via Cloud Function:', {
          to: phone,
          messageId: data.messageId,
          remainingBalance: data.remainingBalance,
        });

        // Log to Firestore audit trail (async, don't wait)
        addDoc(collection(db, SMS_COLLECTION), {
          phone,
          message,
          professionalName,
          activationToken,
          activationUrl,
          privacyPolicyUrl,
          dataUsageUrl,
          status: 'sent',
          provider: 'vonage',
          vonageMessageId: data.messageId,
          remainingBalance: data.remainingBalance,
          createdAt: serverTimestamp(),
          type: 'professional_activation',
        }).catch((error) => {
          logger.error('[SMS Activation] Error logging to Firestore:', error);
        });

      } else if (TWILIO_ENABLED) {
        // Use Twilio REST API directly
        const cleanPhoneForTwilio = phone.replace(/\s/g, '');
        
        logger.info('[SMS Activation] Sending via Twilio:', {
          from: TWILIO_PHONE_NUMBER,
          to: cleanPhoneForTwilio,
        });
        
        const response = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Authorization': `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
            },
            body: new URLSearchParams({
              From: TWILIO_PHONE_NUMBER,
              To: cleanPhoneForTwilio,
              Body: message,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          const errorMessage = errorData.message || response.statusText;
          logger.error('[SMS Activation] Twilio API Error:', {
            status: response.status,
            errorMessage,
            phone: cleanPhoneForTwilio,
          });
          throw new Error(`Twilio API error: ${errorMessage}`);
        }

        const result = await response.json();
        
        logger.info('[SMS Activation] Twilio SMS sent successfully:', {
          to: cleanPhoneForTwilio,
          twilioSid: result.sid,
          status: result.status,
        });

        // Log to Firestore audit trail (async, don't wait)
        addDoc(collection(db, SMS_COLLECTION), {
          phone: cleanPhoneForTwilio,
          message,
          professionalName,
          activationToken,
          activationUrl,
          privacyPolicyUrl,
          dataUsageUrl,
          status: 'sent',
          provider: 'twilio',
          twilioSid: result.sid,
          twilioStatus: result.status,
          createdAt: serverTimestamp(),
          type: 'professional_activation',
        }).catch((error) => {
          logger.error('[SMS Activation] Error logging to Firestore:', error);
        });

      } else {
        throw new Error('SMS service is not configured. Please configure Twilio or Vonage.');
      }

    } catch (error) {
      console.error('❌ [SMS Activation] Error sending activation link:', error);
      logger.error('[SMS Activation] Failed to send activation link:', error);
      throw error;
    }
  }

  /**
   * Create shortened URL for SMS (reduces message length)
   * 
   * @param longUrl - Full URL to shorten
   * @returns Promise<string> - Shortened URL
   */
  static async createShortUrl(longUrl: string): Promise<string> {
    // TODO: Integrate with URL shortener service (bit.ly, tinyurl, etc.)
    // For MVP, return original URL
    return longUrl;
  }

  /**
   * Validate phone number format
   * 
   * @param phone - Phone number to validate
   * @returns boolean - True if valid format
   */
  static validatePhoneNumber(phone: string): boolean {
    // Basic validation: E.164 format or North American format
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    const naFormatRegex = /^\+1\d{10}$/;
    
    return e164Regex.test(phone) || naFormatRegex.test(phone);
  }

  /**
   * Format phone number to E.164 format
   * 
   * @param phone - Phone number in any format
   * @returns string - Formatted phone number
   */
  static formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    
    // If starts with 1 and has 11 digits, assume North American
    if (digits.length === 11 && digits.startsWith('1')) {
      return `+${digits}`;
    }
    
    // If has 10 digits, assume North American without country code
    if (digits.length === 10) {
      return `+1${digits}`;
    }
    
    // Otherwise, try to add + if missing
    if (!phone.startsWith('+')) {
      return `+${digits}`;
    }
    
    return phone;
  }
}

