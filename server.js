import express from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import contactRoutes from './routes/contact.js'
import careersRoutes from './routes/careers.js'
import { mailStatus } from './lib/mailer.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Behind Render's proxy (and Vercel's rewrite): use the visitor's IP for rate limiting
app.set('trust proxy', 2)

app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }))
app.use(express.json({ limit: '100kb' }))

// Throttle form endpoints to deter spam
const formLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { message: 'Too many requests. Please try again later.' } })

app.get('/api/health', (_req, res) => res.json({ status: 'ok', mail: mailStatus() }))
app.use('/api/contact', formLimiter, contactRoutes)
app.use('/api/careers', formLimiter, careersRoutes)

app.use((_req, res) => res.status(404).json({ message: 'Not found.' }))

app.listen(PORT, () => console.log(`✓ API running on http://localhost:${PORT} (mail: ${mailStatus()})`))
