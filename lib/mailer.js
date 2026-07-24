import nodemailer from 'nodemailer'

/* One reusable SMTP transport, built from environment variables.
   Nothing here is hardcoded — set the SMTP_* vars in your .env. */
let transporter = null

function getTransporter() {
  if (transporter) return transporter
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    throw new Error('SMTP is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS in .env')
  }
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465, // true for 465, false for 587/STARTTLS
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  })
  return transporter
}

/* Send one enquiry to the inbox. `replyTo` is the visitor's address, so
   hitting "Reply" in the inbox answers them directly. */
export async function sendEnquiry({ subject, replyTo, html, text }) {
  const to = process.env.MAIL_TO || 'girish@rootskysystem.com'
  const from = process.env.MAIL_FROM || process.env.SMTP_USER
  return getTransporter().sendMail({ from, to, replyTo, subject, html, text })
}