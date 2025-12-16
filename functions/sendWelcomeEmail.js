/**
 * Cloud Function: Send Welcome Email
 * 
 * Sends a personalized welcome email after user registration.
 * This complements Firebase Auth's verification email with a warmer, more professional message.
 * 
 * Trigger: Firestore document creation in 'users' collection
 * 
 * Market: CA · en-CA · PHIPA/PIPEDA Ready
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const LOCATION = 'northamerica-northeast1'; // ✅ CANADÁ (Montreal) - PHIPA compliance

/**
 * Email template HTML
 */
const getWelcomeEmailHTML = (displayName, verificationUrl) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a202c; margin: 0; padding: 0; background-color: #f5f7fa; }
    .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; }
    .content { padding: 40px; }
    .button-container { text-align: center; margin: 30px 0; }
    .button { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; }
    .link-box { padding: 12px; background: #f7fafc; border-radius: 6px; border-left: 3px solid #667eea; margin: 20px 0; word-break: break-all; }
    .link-box a { color: #667eea; text-decoration: none; font-size: 13px; }
    .info-box { margin: 40px 0; padding: 24px; background-color: #f7fafc; border-radius: 8px; }
    .info-box h2 { margin: 0 0 16px; color: #1a202c; font-size: 18px; font-weight: 600; }
    .info-box ul { margin: 0; padding-left: 20px; color: #4a5568; line-height: 1.8; }
    .footer { padding: 30px 40px; background: #f7fafc; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #718096; }
    .footer a { color: #667eea; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to AiDuxCare 🍁</h1>
    </div>
    <div class="content">
      <p>Hello ${displayName || 'there'},</p>
      <p>Thank you for joining AiDuxCare! We're thrilled to have you as part of our community of healthcare professionals in Canada.</p>
      <p>To get started, please verify your email address by clicking the button below. This helps us ensure the security of your account and maintain compliance with PHIPA & PIPEDA regulations.</p>
      
      <div class="button-container">
        <a href="${verificationUrl}" class="button">Verify Your Email Address</a>
      </div>

      <p style="color: #718096; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
      <div class="link-box">
        <a href="${verificationUrl}">${verificationUrl}</a>
      </div>

      <div class="info-box">
        <h2>What's Next?</h2>
        <ul>
          <li>Complete your professional profile</li>
          <li>Explore our intelligent SOAP note generation</li>
          <li>Access medico-legal documentation support</li>
          <li>Start documenting patient encounters with confidence</li>
        </ul>
      </div>

      <p style="color: #718096; font-size: 14px;">This verification link will expire in 24 hours. If you didn't create an account with AiDuxCare, you can safely ignore this email.</p>
    </div>
    <div class="footer">
      <p><strong>Need help?</strong><br>
      Our support team is here for you. Reach out at <a href="mailto:support@aiduxcare.com">support@aiduxcare.com</a></p>
      <p>© 2024 AiDuxCare. All rights reserved.<br>
      Protecting healthcare professionals across Canada.</p>
    </div>
  </div>
</body>
</html>
`;

/**
 * Send welcome email using Firebase Admin SDK
 * 
 * NOTE: This requires configuring SMTP or using a service like SendGrid/Resend
 * For now, this is a template that can be completed when email service is configured
 */
exports.sendWelcomeEmail = functions.region(LOCATION).firestore
  .document('users/{userId}')
  .onCreate(async (snap, context) => {
    const userData = snap.data();
    const userId = context.params.userId;
    
    // Only send if this is a new registration (has email but not verified)
    if (!userData.email || userData.emailVerified) {
      console.log('[Welcome Email] Skipping - user already verified or no email');
      return null;
    }

    const displayName = userData.displayName || userData.name || 'there';
    const email = userData.email;
    
    // Get verification URL from Firebase Auth
    // Note: You'll need to generate this URL or get it from Firebase Auth
    const verificationUrl = `https://${functions.config().app?.domain || 'aiduxcare-v2-uat-dev.firebaseapp.com'}/email-verified?mode=verifyEmail&oobCode=GENERATE_FROM_FIREBASE_AUTH`;
    
    console.log('[Welcome Email] Preparing to send welcome email to:', email);

    // TODO: Implement email sending using your preferred service:
    // Option 1: SendGrid
    // Option 2: Resend
    // Option 3: Nodemailer with SMTP
    // Option 4: Firebase Extensions "Trigger Email"
    
    // Example with SendGrid (uncomment and configure):
    /*
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(functions.config().sendgrid?.api_key);
    
    const msg = {
      to: email,
      from: 'noreply@aiduxcare.com',
      subject: 'Welcome to AiDuxCare - Verify Your Email 🍁',
      html: getWelcomeEmailHTML(displayName, verificationUrl),
    };
    
    await sgMail.send(msg);
    */

    // For now, log the email (remove this in production)
    console.log('[Welcome Email] Email would be sent:', {
      to: email,
      subject: 'Welcome to AiDuxCare - Verify Your Email 🍁',
      displayName,
    });

    return null;
  });

console.log("[OK] functions/sendWelcomeEmail.js: Welcome email function ready");


