import { BrevoClient } from '@getbrevo/brevo';

const brevo = new BrevoClient({
  apiKey: process.env.BREVO_API_KEY as string,
});

export async function sendEmailVerification(email: string, otp: string) {
  try {
    await brevo.transactionalEmails.sendTransacEmail({
      subject: `${otp} is your Picturehouse verification code`,
      sender: { name: 'Picturehouse', email: process.env.EMAIL_FROM },
      to: [{ email }],
      htmlContent: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 20px 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 40px 32px;">
            <tr>
              <td>
                <h2 style="margin: 0 0 24px 0; font-size: 24px; font-weight: 700; color: #6a4ff7; letter-spacing: -0.5px;">
                  Picturehouse
                </h2>

                <p style="margin: 0 0 12px 0; font-size: 16px; color: #111827; line-height: 1.5;">
                  Hello,
                </p>

                <p style="margin: 0 0 24px 0; font-size: 16px; color: #374151; line-height: 1.5;">
                  Use the code below to verify your email address for your Picturehouse account:
                </p>

                <!-- OTP Card Box -->
                <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0; background-color: #f3f0ff; border-radius: 6px; text-align: center;">
                  <tr>
                    <td style="padding: 18px 0; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #6a4ff7; font-family: monospace;">
                      ${otp}
                    </td>
                  </tr>
                </table>

                <p style="margin: 0 0 8px 0; font-size: 14px; color: #4b5563; line-height: 1.5;">
                  This code will expire in <strong>5 minutes</strong>. Do not share this code with anyone.
                </p>

                <p style="margin: 0 0 32px 0; font-size: 14px; color: #6b7280; line-height: 1.5;">
                  If you didn't create this account, you can safely ignore this email.
                </p>

                <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; font-size: 13px; color: #6b7280; line-height: 1.5;">
                  <p style="margin: 0 0 4px 0;">Having trouble? Reply to this email and we'll help you out.</p>
                  <p style="margin: 0;">— The Picturehouse team</p>
                </div>
              </td>
            </tr>
          </table>
        </body>
      </html>
      `,
    });
  } catch (error) {
    console.error('Failed to send verification email:', error);

    throw new Error('Failed to send verification email', {
      cause: error,
    });
  }
}

export async function sendResetPasswordLink(
  email: string,
  resetPasswordLink: string,
) {
  try {
    await brevo.transactionalEmails.sendTransacEmail({
      subject: 'Reset your Picturehouse password',
      sender: { name: 'Picturehouse', email: process.env.EMAIL_FROM },
      to: [{ email }],
      htmlContent: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 20px 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 40px 32px;">
            <tr>
              <td>
                <h2 style="margin: 0 0 24px 0; font-size: 24px; font-weight: 700; color: #6a4ff7; letter-spacing: -0.5px;">
                  Picturehouse
                </h2>

                <p style="margin: 0 0 12px 0; font-size: 16px; color: #111827; line-height: 1.5;">
                  Hello,
                </p>

                <p style="margin: 0 0 24px 0; font-size: 16px; color: #374151; line-height: 1.5;">
                  We received a request to reset your password for your Picturehouse account. Click the button below to choose a new password:
                </p>

                <!-- Centered Call to Action Button -->
                <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 28px auto;">
                  <tr>
                    <td align="center" style="border-radius: 6px; background-color: #6a4ff7;">
                      <a href="${resetPasswordLink}" target="_blank" style="font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; display: inline-block;">
                        Reset Password
                      </a>
                    </td>
                  </tr>
                </table>

                <p style="margin: 0 0 8px 0; font-size: 14px; color: #4b5563; line-height: 1.5;">
                  This password reset link will expire in <strong>15 minutes</strong>.
                </p>

                <p style="margin: 0 0 24px 0; font-size: 14px; color: #6b7280; line-height: 1.5;">
                  If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
                </p>

                <p style="margin: 0 0 32px 0; font-size: 12px; color: #9ca3af; word-break: break-all; line-height: 1.4;">
                  If the button above doesn't work, copy and paste this link into your web browser:<br>
                  <a href="${resetPasswordLink}" style="color: #6a4ff7;">${resetPasswordLink}</a>
                </p>

                <!-- Footer Section (Prevents Gmail Trimming) -->
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-top: 1px solid #e5e7eb; padding-top: 20px;">
                  <tr>
                    <td style="font-size: 13px; color: #6b7280; line-height: 1.5;">
                      <p style="margin: 0 0 4px 0;">Having trouble? Reply to this email and we'll help you out.</p>
                      <p style="margin: 0;">— The Picturehouse team</p>
                      <span style="display:none !important; font-size:0px; line-height:0px; max-height:0px; opacity:0; overflow:hidden;">${Date.now()}</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
      `,
    });
  } catch (error) {
    console.error('Failed to send reset password email:', error);

    throw new Error('Failed to send reset password email', {
      cause: error,
    });
  }
}
