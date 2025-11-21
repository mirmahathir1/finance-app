import nodemailer from 'nodemailer'

const BREVO_API_KEY = process.env.BREVO_API_KEY || ''
const BREVO_SENDER_EMAIL =
  process.env.BREVO_SENDER_EMAIL || 'no-reply@finance-app.dev'
const BREVO_SENDER_NAME = process.env.BREVO_SENDER_NAME || 'Finance App'

const resolvedProvider =
  process.env.EMAIL_PROVIDER ||
  (process.env.NODE_ENV === 'development' ? 'mailhog' : undefined) ||
  (process.env.MAILHOG_HOST ? 'mailhog' : undefined) ||
  (BREVO_API_KEY ? 'brevo' : undefined) ||
  'mock'

const EMAIL_PROVIDER = resolvedProvider.toLowerCase()

// Debug logging for email configuration
if (process.env.NODE_ENV === 'production') {
  console.log('[Email Config Debug]', {
    EMAIL_PROVIDER,
    hasBrevoApiKey: !!BREVO_API_KEY,
    brevoApiKeyLength: BREVO_API_KEY?.length,
    rawEmailProvider: process.env.EMAIL_PROVIDER,
  })
}

// Use VERCEL_URL for automatic deployment URL, or fallback to NEXT_PUBLIC_APP_URL
const getAppUrl = () => {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  return 'http://localhost:3000'
}

const APP_URL = getAppUrl()
const FORCE_GUEST_MODE = process.env.NEXT_PUBLIC_FORCE_GUEST_MODE === 'true'

const MAILHOG_HOST = process.env.MAILHOG_HOST || 'localhost'
const MAILHOG_PORT = parseInt(process.env.MAILHOG_PORT || '1025', 10)
const MAILHOG_USERNAME = process.env.MAILHOG_USERNAME || undefined
const MAILHOG_PASSWORD = process.env.MAILHOG_PASSWORD || undefined

type EmailPayload = {
  to: string
  subject: string
  htmlContent: string
  textContent: string
}

async function sendEmail(payload: EmailPayload): Promise<void> {
  if (FORCE_GUEST_MODE || EMAIL_PROVIDER === 'mock') {
    console.info('[Email mocked]', payload)
    return
  }

  if (EMAIL_PROVIDER === 'mailhog') {
    try {
      const transporter = nodemailer.createTransport({
        host: MAILHOG_HOST,
        port: MAILHOG_PORT,
        secure: false,
        auth:
          MAILHOG_USERNAME && MAILHOG_PASSWORD
            ? { user: MAILHOG_USERNAME, pass: MAILHOG_PASSWORD }
            : undefined,
      })

      await transporter.sendMail({
        from: `"${BREVO_SENDER_NAME}" <${BREVO_SENDER_EMAIL}>`,
        to: payload.to,
        subject: payload.subject,
        text: payload.textContent,
        html: payload.htmlContent,
      })
      return
    } catch (error) {
      console.error('[Email] Failed to send via MailHog SMTP', error)
      return
    }
  }

  if (EMAIL_PROVIDER === 'brevo' && BREVO_API_KEY) {
    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': BREVO_API_KEY,
        },
        body: JSON.stringify({
          sender: {
            name: BREVO_SENDER_NAME,
            email: BREVO_SENDER_EMAIL,
          },
          to: [{ email: payload.to }],
          subject: payload.subject,
          htmlContent: payload.htmlContent,
          textContent: payload.textContent,
        }),
      })

      if (!response.ok) {
        const errorBody = await response.text()
        console.error(
          '[Email] Brevo API error',
          response.status,
          response.statusText,
          errorBody
        )
      }
    } catch (error) {
      console.error('[Email] Failed to send email via Brevo', error)
    }
    return
  }

  console.warn(
    '[Email] No valid provider configured. Set EMAIL_PROVIDER to "mailhog" or "brevo".'
  )
  console.info('[Email fallback log]', payload)
}

export async function sendVerificationEmail(
  to: string,
  token: string
): Promise<void> {
  const verificationLink = `${APP_URL}/auth/verify?token=${token}`
  await sendEmail({
    to,
    subject: 'Verify your email',
    textContent: `Use this link to verify your email: ${verificationLink}`,
    htmlContent: `<p>Thanks for signing up!</p>
<p><a href="${verificationLink}">Click here to verify your email</a></p>
<p>If the button does not work, copy and paste this link into your browser:<br/>${verificationLink}</p>`,
  })
}

export async function sendPasswordResetEmail(
  to: string,
  token: string
): Promise<void> {
  const resetLink = `${APP_URL}/auth/reset-password?token=${token}`
  await sendEmail({
    to,
    subject: 'Reset your password',
    textContent: `Use this link to reset your password: ${resetLink}`,
    htmlContent: `<p>We received a request to reset your password.</p>
<p><a href="${resetLink}">Click here to create a new password</a></p>
<p>If you did not request this, you can ignore this email.</p>
<p>Reset link: ${resetLink}</p>`,
  })
}

