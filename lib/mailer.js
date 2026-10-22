import nodemailer from 'nodemailer'

/* Enquiries are emailed to MAIL_TO. Two ways to send, picked from env vars:
   - RESEND_API_KEY set → Resend's HTTPS API. Use this on Render's free plan,
     which blocks outbound SMTP ports (25/465/587).
   - otherwise SMTP_HOST/SMTP_USER/SMTP_PASS → plain SMTP via nodemailer. */
const DEFAULT_TO = 'sales@rootskysystem.com'

let transporter = null

function getTransporter() {
  if (transporter) return transporter
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    throw new Error('Email is not configured. Set RESEND_API_KEY, or SMTP_HOST, SMTP_USER, SMTP_PASS')
  }
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465, // true for 465, false for 587/STARTTLS
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    // Fail fast instead of hanging past the Vercel proxy timeout
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  })
  return transporter
}

async function sendWithResend({ from, to, replyTo, subject, html, text }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: to.split(',').map((s) => s.trim()), reply_to: replyTo, subject, html, text }),
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`)
  return res.json()
}

export function mailStatus() {
  if (process.env.RESEND_API_KEY) return 'resend'
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) return 'smtp'
  return 'not configured'
}

/* Send one enquiry to the inbox. `replyTo` is the visitor's address, so
   hitting "Reply" in the inbox answers them directly. */
export async function sendEnquiry({ subject, replyTo, html, text }) {
  const to = process.env.MAIL_TO || DEFAULT_TO
  if (process.env.RESEND_API_KEY) {
    const from = process.env.MAIL_FROM || 'Rootsky Website <onboarding@resend.dev>'
    return sendWithResend({ from, to, replyTo, subject, html, text })
  }
  const from = process.env.MAIL_FROM || process.env.SMTP_USER
  return getTransporter().sendMail({ from, to, replyTo, subject, html, text })
}
