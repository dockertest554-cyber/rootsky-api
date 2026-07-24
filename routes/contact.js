import { Router } from 'express'
import { sendEnquiry } from '../lib/mailer.js'

const router = Router()
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
const esc = (v = '') => String(v).replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]))

// POST /api/contact — submit a contact message
router.post('/', async (req, res) => {
  try {
    const { name, email, company, message } = req.body || {}
    if (!name || !email || !message)
      return res.status(400).json({ message: 'Name, email, and message are required.' })
    if (!isEmail(email))
      return res.status(400).json({ message: 'Please enter a valid email address.' })

    await sendEnquiry({
      subject: `New enquiry from ${name}${company ? ` (${company})` : ''}`,
      replyTo: email,
      text: `Name: ${name}\nEmail: ${email}\nCompany: ${company || '—'}\n\n${message}`,
      html: `
        <h2>New contact enquiry</h2>
        <p><strong>Name:</strong> ${esc(name)}</p>
        <p><strong>Email:</strong> ${esc(email)}</p>
        <p><strong>Company:</strong> ${esc(company) || '—'}</p>
        <p><strong>Message:</strong></p>
        <p style="white-space:pre-wrap">${esc(message)}</p>`,
    })

    return res.status(201).json({ message: 'Message received.' })
  } catch (err) {
    console.error('Contact error:', err.message)
    return res.status(500).json({ message: 'Server error. Please try again later.' })
  }
})

export default router