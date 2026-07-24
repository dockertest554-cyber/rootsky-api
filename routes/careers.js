import { Router } from 'express'
import { sendEnquiry } from '../lib/mailer.js'

const router = Router()
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
const esc = (v = '') => String(v).replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]))

// POST /api/careers — submit a job application
router.post('/', async (req, res) => {
  try {
    const { name, email, role, message } = req.body || {}
    if (!name || !email || !role || !message)
      return res.status(400).json({ message: 'All fields are required.' })
    if (!isEmail(email))
      return res.status(400).json({ message: 'Please enter a valid email address.' })

    await sendEnquiry({
      subject: `Job application: ${role} — ${name}`,
      replyTo: email,
      text: `Name: ${name}\nEmail: ${email}\nRole: ${role}\n\n${message}`,
      html: `
        <h2>New job application</h2>
        <p><strong>Name:</strong> ${esc(name)}</p>
        <p><strong>Email:</strong> ${esc(email)}</p>
        <p><strong>Role:</strong> ${esc(role)}</p>
        <p><strong>Message:</strong></p>
        <p style="white-space:pre-wrap">${esc(message)}</p>`,
    })

    return res.status(201).json({ message: 'Application received.' })
  } catch (err) {
    console.error('Careers error:', err.message)
    return res.status(500).json({ message: 'Server error. Please try again later.' })
  }
})

export default router