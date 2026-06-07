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
import { SMS_TEMPLATES, validateSMSTemplate, validateSMSTemplateEs } from '../content/smsTemplates';
import { getPublicBaseUrl } from '../utils/urlHelpers';
import { normalizeNameForSMS } from '../utils/textNormalizer';
import { getCurrentJurisdiction } from '@/core/consent/consentJurisdiction';
import { buildAuthenticatedJsonHeaders } from './firebaseAuthHeaders';
import { safeLogger } from '@/utils/safeLogger';

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

function resolveConsentSmsJurisdiction(phone: string, explicitJurisdiction?: string): 'ES-ES' | 'CA-ON' {
  const normalizedJurisdiction = (explicitJurisdiction || '').trim().toUpperCase();
  if (normalizedJurisdiction === 'ES' || normalizedJurisdiction === 'ES-ES') {
    return 'ES-ES';
  }
  if (normalizedJurisdiction === 'CA' || normalizedJurisdiction === 'CA-ON') {
    return 'CA-ON';
  }

  const normalizedPhone = phone.trim().replace(/[^\d+]/g, '');
  if (normalizedPhone.startsWith('+34')) {
    return 'ES-ES';
  }
  if (normalizedPhone.startsWith('+1')) {
    return 'CA-ON';
  }

  return getCurrentJurisdiction() === 'ES-ES' ? 'ES-ES' : 'CA-ON';
}

// Log Twilio configuration status (only in development)
if (import.meta.env.DEV) {
  safeLogger.identifierOperation('sms_provider', SMS_PROVIDER);
  safeLogger.phoneValidation('twilio_configured', TWILIO_ENABLED);
  safeLogger.phoneValidation('vonage_configured', VONAGE_ENABLED);
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
      const jurisdiction = resolveConsentSmsJurisdiction(phone);
      const language = jurisdiction === 'ES-ES' ? 'es' : 'en';
      const disclosureUrl = `${publicBaseUrl}/disclosure/${patientId}?lang=${language}`;
      const normalizedName = normalizeNameForSMS(patientName);
      const message = language === 'es'
        ? `Hola ${normalizedName}, tu documento informativo de consentimiento está disponible aquí: ${disclosureUrl}`
        : `Hi ${normalizedName}, your consent disclosure document is available at: ${disclosureUrl}`;

      const validation = language === 'es' ? validateSMSTemplateEs(message) : validateSMSTemplate(message);
      if (!validation.isValid) {
        const disclosureTemplateErrorCount = validation.errors.length;
        safeLogger.errorOccurred('SMSDisclosureTemplate', disclosureTemplateErrorCount, true);
        throw new Error(`SMS template validation failed: ${validation.errors.join(', ')}`);
      }

      // Validate and format phone number
      let validatedPhone = phone.trim();

      // Use same SMS sending logic as consent link
      if (SMS_PROVIDER === 'vonage' && VONAGE_ENABLED) {
        // Vonage implementation (same as sendConsentLink)
        const region = import.meta.env.VITE_FIREBASE_FUNCTIONS_REGION || 'northamerica-northeast1';
        const headers = await buildAuthenticatedJsonHeaders();
        const response = await fetch(
          `https://${region}-${import.meta.env.VITE_FIREBASE_PROJECT_ID}.cloudfunctions.net/sendConsentSMS`,
          {
            method: 'POST',
            headers,
            body: JSON.stringify({
              phone: validatedPhone,
              message,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        const vonageDisclosureSuccess = Boolean(result.messageId);
        safeLogger.phoneValidation('vonage_disclosure_sent', vonageDisclosureSuccess);
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
        const twilioDisclosureSuccess = Boolean(result.sid);
        safeLogger.phoneValidation('twilio_disclosure_sent', twilioDisclosureSuccess);
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
      const disclosureErrorCode = error?.code ?? 'unknown';
      const disclosureHasMessage = Boolean(error?.message);
      safeLogger.errorOccurred('SMSDisclosure', disclosureErrorCode, disclosureHasMessage);
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
    consentToken: string,
    options?: { jurisdiction?: string }
  ): Promise<void> {
    try {
      // Get production URL (never localhost in production)
      const publicBaseUrl = getPublicBaseUrl();
      const consentUrl = `${publicBaseUrl}/consent/${consentToken}`;
      const privacyUrl = `${publicBaseUrl}/privacy-policy`;

      // Template by jurisdiction (en-CA PHIPA, es_ES GDPR/RGPD)
      const jurisdiction = resolveConsentSmsJurisdiction(phone, options?.jurisdiction);
      const useEsTemplate = jurisdiction === 'ES-ES';
      const consentTemplate = useEsTemplate ? SMS_TEMPLATES.consent.es_ES : SMS_TEMPLATES.consent.en_CA;
      const message = consentTemplate(
        normalizeNameForSMS(patientName),
        normalizeNameForSMS(physiotherapistName),
        consentUrl,
        privacyUrl
      );

      const validation = useEsTemplate ? validateSMSTemplateEs(message) : validateSMSTemplate(message);
      if (!validation.isValid) {
        const templateErrorCount = validation.errors.length;
        safeLogger.errorOccurred('SMSTemplate', templateErrorCount, true);
        throw new Error(`SMS template validation failed: ${validation.errors.join(', ')}`);
      }

      // Validate and format phone number BEFORE using it
      let validatedPhone = phone.trim();

      // Log original phone for debugging
      const originalPhoneIsPresent = validatedPhone.length > 0;
      safeLogger.phoneValidation('original_phone_received', originalPhoneIsPresent);

      // Validate phone number
      if (!SMSService.validatePhoneNumber(validatedPhone)) {
        const formatted = SMSService.formatPhoneNumber(validatedPhone);
        if (!SMSService.validatePhoneNumber(formatted)) {
          const formattedPhoneIsValid = SMSService.validatePhoneNumber(formatted);
          safeLogger.phoneValidation('phone_format_failed', formattedPhoneIsValid);
          throw new Error(`Invalid phone number format: ${validatedPhone}. Expected E.164 format (e.g., +14161234567)`);
        }
        validatedPhone = formatted;
        const formattedPhoneIsValid = SMSService.validatePhoneNumber(validatedPhone);
        safeLogger.phoneValidation('phone_formatted', formattedPhoneIsValid);
      }

      // Final validation: must be E.164 format
      if (!/^\+[1-9]\d{1,14}$/.test(validatedPhone)) {
        safeLogger.phoneValidation('e164_validation', false);
        throw new Error(`Invalid phone number format: ${validatedPhone}. Must be E.164 format (e.g., +14161234567)`);
      }

      // Ensure phone number is exactly 12 characters for North American numbers (+1 + 10 digits)
      if (validatedPhone.startsWith('+1') && validatedPhone.length !== 12) {
        safeLogger.phoneValidation('north_american_length_validation', false);
        throw new Error(`Invalid North American phone number length: ${validatedPhone}. Expected 12 characters (+1 + 10 digits)`);
      }

      phone = validatedPhone; // Use validated phone
      const finalPhoneIsValid = SMSService.validatePhoneNumber(phone);
      safeLogger.phoneValidation('final_phone_validated', finalPhoneIsValid);

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

      safeLogger.identifierOperation('sms_consent_link', jurisdiction);
      safeLogger.phoneValidation('sms_provider_enabled', TWILIO_ENABLED || VONAGE_ENABLED);

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
          safeLogger.phoneValidation('twilio_target_canadian_number', isCanadianNumber);
          safeLogger.phoneValidation('twilio_sender_us_number', isUSNumber);
          safeLogger.vertexResponse(message.length, message.length > 0, 'sms_message_prepared');

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
            const twilioErrorCode = errorCode ?? response.status;
            const twilioHasMessage = Boolean(errorMessage);
            safeLogger.errorOccurred('SMSTwilioApi', twilioErrorCode, twilioHasMessage);

            // Check for common Twilio trial account errors
            if (errorMessage.includes('not a valid') || errorMessage.includes('unverified') || errorCode === 21211) {
              const trialRestrictionCode = errorCode ?? 'trial_restriction';
              safeLogger.errorOccurred('SMSTwilioTrialRestriction', trialRestrictionCode, true);
            }

            // Check for domestic-only restrictions (US number trying to send to Canada)
            if (errorCode === 21608 || errorMessage.includes('domestic') || errorMessage.includes('not allowed')) {
              const domesticRestrictionCode = errorCode ?? 'domestic_restriction';
              safeLogger.errorOccurred('SMSTwilioDomesticRestriction', domesticRestrictionCode, true);
            }

            throw new Error(`Twilio API error: ${errorMessage} (Code: ${errorCode || 'N/A'})`);
          }

          const result = await response.json();

          // Log successful response details
          const twilioSuccess = Boolean(result.sid);
          safeLogger.phoneValidation('twilio_api_success', twilioSuccess);

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

          safeLogger.phoneValidation('consent_sms_sent_twilio', twilioSuccess);

        } catch (twilioError: any) {
          const twilioSendErrorCode = twilioError?.code ?? 'unknown';
          const twilioSendHasMessage = Boolean(twilioError?.message);
          safeLogger.errorOccurred('SMSTwilioSend', twilioSendErrorCode, twilioSendHasMessage);

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

          safeLogger.errorOccurred('SMSTwilioSendAudit', twilioSendErrorCode, twilioSendHasMessage);

          // Re-throw to allow caller to handle (e.g., show manual fallback)
          throw new Error(`Failed to send SMS via Twilio: ${twilioError.message}`);
        }
      } else {
        // Twilio not configured - save as pending for manual sending
        safeLogger.phoneValidation('twilio_configured', false);

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

        safeLogger.identifierOperation('sms_consent_link', 'queued_manual_send');

        throw new Error('SMS service is not configured. Message queued for manual sending.');
      }

    } catch (error) {
      const consentLinkErrorCode = (error as { code?: string })?.code ?? 'unknown';
      const consentLinkHasMessage = Boolean((error as { message?: string })?.message);
      safeLogger.errorOccurred('SMSConsentLink', consentLinkErrorCode, consentLinkHasMessage);
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
    const FUNCTION_REGION = import.meta.env.VITE_FIREBASE_FUNCTIONS_REGION || 'northamerica-northeast1';
    const PROJECT_ID = import.meta.env.VITE_FIREBASE_PROJECT_ID || 'aiduxcare-v2-uat-dev';
    const FUNCTION_URL = import.meta.env.VITE_SMS_FUNCTION_URL ||
      `https://${FUNCTION_REGION}-${PROJECT_ID}.cloudfunctions.net/sendConsentSMS`;

    safeLogger.identifierOperation('sms_vonage_function', 'calling');

    // Call Cloud Function instead of Vonage directly (avoids CORS)
    const headers = await buildAuthenticatedJsonHeaders();
    const response = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers,
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
      const vonageFunctionErrorCode = data.error ?? response.status;
      const vonageFunctionHasMessage = Boolean(data.message);
      safeLogger.errorOccurred('SMSVonageFunction', vonageFunctionErrorCode, vonageFunctionHasMessage);
      throw new Error(data.message || `SMS function error: ${data.error || 'Unknown error'}`);
    }

    const vonageSendSuccess = Boolean(data.messageId);
    safeLogger.phoneValidation('vonage_sms_sent', vonageSendSuccess);

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
        const activationTemplateErrorCount = validation.errors.length;
        safeLogger.errorOccurred('SMSActivationTemplate', activationTemplateErrorCount, true);
        throw new Error(`SMS template validation failed: ${validation.errors.join(', ')}`);
      }

      // Validate and format phone number
      let validatedPhone = phone.trim();

      const activationOriginalPhoneIsPresent = validatedPhone.length > 0;
      safeLogger.phoneValidation('activation_original_phone_received', activationOriginalPhoneIsPresent);

      // Validate phone number
      if (!SMSService.validatePhoneNumber(validatedPhone)) {
        const formatted = SMSService.formatPhoneNumber(validatedPhone);
        if (!SMSService.validatePhoneNumber(formatted)) {
          const activationFormattedPhoneIsValid = SMSService.validatePhoneNumber(formatted);
          safeLogger.phoneValidation('activation_phone_format_failed', activationFormattedPhoneIsValid);
          throw new Error(`Invalid phone number format: ${validatedPhone}. Expected E.164 format (e.g., +14161234567)`);
        }
        validatedPhone = formatted;
        const activationFormattedPhoneIsValid = SMSService.validatePhoneNumber(validatedPhone);
        safeLogger.phoneValidation('activation_phone_formatted', activationFormattedPhoneIsValid);
      }

      // Final validation: must be E.164 format
      if (!/^\+[1-9]\d{1,14}$/.test(validatedPhone)) {
        safeLogger.phoneValidation('activation_e164_validation', false);
        throw new Error(`Invalid phone number format: ${validatedPhone}. Must be E.164 format (e.g., +34600123456)`);
      }

      phone = validatedPhone;
      const activationFinalPhoneIsValid = SMSService.validatePhoneNumber(phone);
      safeLogger.phoneValidation('activation_final_phone_validated', activationFinalPhoneIsValid);

      // Send SMS via Vonage Cloud Function (preferred) or Twilio
      const providerUsed = SMS_PROVIDER === 'vonage' ? 'vonage' : 'twilio';

      if (providerUsed === 'vonage') {
        if (!VONAGE_ENABLED) {
          throw new Error('Vonage provider selected but API key/secret or phone number are missing.');
        }

        // Get Cloud Function URL (region must match functions deployment: northamerica-northeast1)
        const FUNCTION_REGION = import.meta.env.VITE_FIREBASE_FUNCTIONS_REGION || 'northamerica-northeast1';
        const PROJECT_ID = import.meta.env.VITE_FIREBASE_PROJECT_ID || 'aiduxcare-v2-uat-dev';
        const FUNCTION_URL = import.meta.env.VITE_SMS_FUNCTION_URL ||
          `https://${FUNCTION_REGION}-${PROJECT_ID}.cloudfunctions.net/sendConsentSMS`;

        safeLogger.identifierOperation('sms_activation_vonage_function', 'calling');

        // Call Cloud Function
        const headers = await buildAuthenticatedJsonHeaders();
        const response = await fetch(FUNCTION_URL, {
          method: 'POST',
          headers,
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
          const activationVonageErrorCode = data.error ?? response.status;
          const activationVonageHasMessage = Boolean(data.message);
          safeLogger.errorOccurred('SMSActivationVonageFunction', activationVonageErrorCode, activationVonageHasMessage);
          throw new Error(data.message || `SMS function error: ${data.error || 'Unknown error'}`);
        }

        const activationVonageSuccess = Boolean(data.messageId);
        safeLogger.phoneValidation('activation_vonage_sms_sent', activationVonageSuccess);

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
          const activationAuditErrorCode = error?.code ?? 'unknown';
          const activationAuditHasMessage = Boolean(error?.message);
          safeLogger.errorOccurred('SMSActivationAudit', activationAuditErrorCode, activationAuditHasMessage);
        });

      } else if (TWILIO_ENABLED) {
        // Use Twilio REST API directly
        const cleanPhoneForTwilio = phone.replace(/\s/g, '');

        safeLogger.identifierOperation('sms_activation_twilio', 'sending');

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
          const activationTwilioErrorCode = errorData.code ?? response.status;
          const activationTwilioHasMessage = Boolean(errorMessage);
          safeLogger.errorOccurred('SMSActivationTwilioApi', activationTwilioErrorCode, activationTwilioHasMessage);
          throw new Error(`Twilio API error: ${errorMessage}`);
        }

        const result = await response.json();

        const activationTwilioSuccess = Boolean(result.sid);
        safeLogger.phoneValidation('activation_twilio_sms_sent', activationTwilioSuccess);

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
          const activationTwilioAuditErrorCode = error?.code ?? 'unknown';
          const activationTwilioAuditHasMessage = Boolean(error?.message);
          safeLogger.errorOccurred('SMSActivationTwilioAudit', activationTwilioAuditErrorCode, activationTwilioAuditHasMessage);
        });

      } else {
        throw new Error('SMS service is not configured. Please configure Twilio or Vonage.');
      }

    } catch (error) {
      const activationLinkErrorCode = (error as { code?: string })?.code ?? 'unknown';
      const activationLinkHasMessage = Boolean((error as { message?: string })?.message);
      safeLogger.errorOccurred('SMSActivationLink', activationLinkErrorCode, activationLinkHasMessage);
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
