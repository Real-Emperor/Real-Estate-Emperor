// Email service using Resend API
// Supports password reset, notifications, and receipt emails

interface EmailPayload {
  to: string | string[]
  subject: string
  html: string
  text?: string
  from?: string
}

const RESEND_API_KEY = process.env.RESEND_API_KEY
const DEFAULT_FROM = process.env.EMAIL_FROM || 'Al Reef Dashboard <noreply@alreef.ae>'

export async function sendEmail(payload: EmailPayload): Promise<{ success: boolean; error?: string }> {
  if (!RESEND_API_KEY) {
    console.warn('[Email] RESEND_API_KEY not configured. Email would have been sent to:', payload.to)
    // In development, log the email content instead of failing
    console.info('[Email] Subject:', payload.subject)
    return { success: true, error: 'Email service not configured (missing RESEND_API_KEY)' }
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: payload.from || DEFAULT_FROM,
        to: Array.isArray(payload.to) ? payload.to : [payload.to],
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('[Email] Failed to send:', error)
      return { success: false, error }
    }

    const result = await response.json()
    console.info('[Email] Sent successfully:', result.id)
    return { success: true }
  } catch (error: any) {
    console.error('[Email] Error:', error.message)
    return { success: false, error: error.message }
  }
}

// Password reset email
export async function sendPasswordResetEmail(
  email: string,
  resetLink: string,
  companyName: string = 'Al Reef Dashboard'
): Promise<{ success: boolean; error?: string }> {
  return sendEmail({
    to: email,
    subject: `${companyName} - Password Reset`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #0F766E 0%, #134E4A 100%); border-radius: 12px 12px 0 0; padding: 30px; text-align: center;">
          <h1 style="color: #FBBF24; margin: 0; font-size: 24px;">Password Reset</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">${companyName}</p>
        </div>
        <div style="background: #ffffff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; padding: 30px;">
          <p>Hello,</p>
          <p>We received a request to reset your password. Click the button below to choose a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background: #0F766E; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block; font-size: 16px;">
              Reset Password
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px;">This link expires in <strong>1 hour</strong>. If you didn't request this, you can safely ignore this email.</p>
          <p style="color: #6b7280; font-size: 14px;">If the button doesn't work, copy this link to your browser:</p>
          <p style="color: #0F766E; font-size: 13px; word-break: break-all; background: #f0fdfa; padding: 12px; border-radius: 6px;">${resetLink}</p>
        </div>
        <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
          <p>This is an automated message from ${companyName}. Please do not reply.</p>
        </div>
      </body>
      </html>
    `,
    text: `Password Reset - ${companyName}\n\nWe received a request to reset your password.\n\nClick this link to reset your password: ${resetLink}\n\nThis link expires in 1 hour. If you didn't request this, you can safely ignore this email.`,
  })
}

// Notification email (overdue, lease renewal, etc.)
export async function sendNotificationEmail(
  email: string,
  title: string,
  message: string,
  companyName: string = 'Al Reef Dashboard'
): Promise<{ success: boolean; error?: string }> {
  return sendEmail({
    to: email,
    subject: `${companyName} - ${title}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #0F766E 0%, #134E4A 100%); border-radius: 12px 12px 0 0; padding: 30px; text-align: center;">
          <h1 style="color: #FBBF24; margin: 0; font-size: 24px;">${title}</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">${companyName}</p>
        </div>
        <div style="background: #ffffff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; padding: 30px;">
          ${message}
        </div>
        <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
          <p>This is an automated message from ${companyName}.</p>
        </div>
      </body>
      </html>
    `,
    text: `${title} - ${companyName}\n\n${message.replace(/<[^>]*>/g, '')}`,
  })
}

// Receipt email
export async function sendReceiptEmail(
  email: string,
  receiptNumber: string,
  amount: number,
  tenantName: string,
  receiptLink: string,
  companyName: string = 'Al Reef Dashboard'
): Promise<{ success: boolean; error?: string }> {
  const formattedAmount = new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
  }).format(amount)

  return sendEmail({
    to: email,
    subject: `${companyName} - Receipt ${receiptNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #0F766E 0%, #134E4A 100%); border-radius: 12px 12px 0 0; padding: 30px; text-align: center;">
          <h1 style="color: #FBBF24; margin: 0; font-size: 24px;">Payment Receipt</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">${companyName}</p>
        </div>
        <div style="background: #ffffff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; padding: 30px;">
          <p>Dear ${tenantName},</p>
          <p>We have received your payment. Here are the details:</p>
          <div style="background: #f0fdfa; border: 1px solid #ccfbf1; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 0 0 8px;"><strong>Receipt Number:</strong> ${receiptNumber}</p>
            <p style="margin: 0 0 8px;"><strong>Amount:</strong> ${formattedAmount}</p>
            <p style="margin: 0;"><strong>Date:</strong> ${new Date().toLocaleDateString('en-AE')}</p>
          </div>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${receiptLink}" style="background: #0F766E; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
              View Full Receipt
            </a>
          </div>
        </div>
        <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
          <p>This is an automated message from ${companyName}.</p>
        </div>
      </body>
      </html>
    `,
    text: `Payment Receipt - ${companyName}\n\nDear ${tenantName},\n\nWe received your payment of ${formattedAmount}.\nReceipt: ${receiptNumber}\n\nView receipt: ${receiptLink}`,
  })
}

// Welcome email after signup
export async function sendWelcomeEmail(
  email: string,
  name: string,
  companyName: string,
  loginUrl: string
): Promise<{ success: boolean; error?: string }> {
  return sendEmail({
    to: email,
    subject: `Welcome to ${companyName} Dashboard`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #0F766E 0%, #134E4A 100%); border-radius: 12px 12px 0 0; padding: 30px; text-align: center;">
          <h1 style="color: #FBBF24; margin: 0; font-size: 24px;">Welcome!</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">${companyName}</p>
        </div>
        <div style="background: #ffffff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; padding: 30px;">
          <p>Hello ${name},</p>
          <p>Your account has been created successfully. You can now access the ${companyName} property management dashboard.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}" style="background: #0F766E; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block; font-size: 16px;">
              Go to Dashboard
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px;">If you have any questions, please contact your administrator.</p>
        </div>
        <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
          <p>This is an automated message from ${companyName}.</p>
        </div>
      </body>
      </html>
    `,
    text: `Welcome to ${companyName}!\n\nHello ${name},\n\nYour account has been created. Access the dashboard: ${loginUrl}`,
  })
}
