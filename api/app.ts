/**
 * This is a API server
 */

import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import helmet from 'helmet'
import authRoutes from './routes/auth.js'
import meetingRoutes from './routes/meeting.js'

// load env
dotenv.config()

const app: express.Application = express()

// Security headers
app.use(helmet())

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'API server is running',
    routes: {
      health: '/api/health',
      meetingAnalyze: '/api/meeting/analyze',
      meetingTask: '/api/meeting/tasks/:id',
      meetingLogs: '/api/meeting/tasks/:id/logs',
      auth: '/api/auth'
    }
  })
})

/**
 * API Routes
 */
app.use('/api/auth', authRoutes)
app.use('/api/meeting', meetingRoutes)

/**
 * health
 */
app.use(
  '/api/health',
  (req: Request, res: Response): void => {
    const method = req.method
    res.status(200).json({
      success: true,
      message: 'ok',
      method,
    })
  },
)

/**
 * error handler middleware
 */
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  const path = req.originalUrl
  console.error('Server internal error', error)
  res.status(500).json({
    success: false,
    error: 'Server internal error',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    path,
  })
})

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
