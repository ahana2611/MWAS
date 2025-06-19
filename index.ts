import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from './models/User';
import Therapist from './models/Therapist';
import Appointment from './models/Appointment';
import Chat from './models/Chat';
import authRoutes from './routes/authRoutes';
import type { Request } from 'express';
import therapistRoutes from './routes/therapistRoutes';
import appointmentRoutes from './routes/appointmentRoutes';
import chatRoutes from './routes/chatRoutes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mwas';

// Middleware
app.use(cors());
app.use(express.json()); // Built-in body-parser for JSON
app.use(express.urlencoded({ extended: true })); // Built-in body-parser for URL-encoded
app.use('/api/chat', chatRoutes);
// MongoDB Connection
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB successfully');
  })
  .catch((error: any) => {
    console.error('❌ MongoDB connection error:', error);
  });

// JWT Secret (in production, use process.env.JWT_SECRET)
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

// Extend Express Request type to include user
interface AuthRequest extends Request {
  user?: any;
}

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to MWAS Backend API',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// User routes
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { name, email } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const user = new User({ name, email });
    const savedUser = await user.save();
    
    res.status(201).json(savedUser);
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(400).json({ error: 'Email already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create user' });
    }
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email },
      { new: true, runValidators: true }
    );
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Auth: Signup
app.use('/api/auth', authRoutes);

// Middleware: Authenticate JWT and check role
export function authenticateRole(roles: string[]) {
  return (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });
    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.status(403).json({ error: 'Invalid token' });
      if (!roles.includes(user.role)) return res.status(403).json({ error: 'Forbidden: insufficient role' });
      req.user = user;
      next();
    });
  };
}

// POST /api/appointments - Book an appointment (user only)
app.post('/api/appointments', authenticateRole(['user']), async (req: AuthRequest, res: express.Response) => {
  try {
    const { therapistId, datetime } = req.body;
    const userId = req.user.userId;
    if (!therapistId || !datetime) {
      return res.status(400).json({ error: 'therapistId and datetime are required' });
    }
    // Optionally: check if therapist exists
    // const therapist = await Therapist.findById(therapistId);
    // if (!therapist) return res.status(404).json({ error: 'Therapist not found' });
    const appointment = new Appointment({ userId, therapistId, datetime, status: 'pending' });
    await appointment.save();
    res.status(201).json({ message: 'Appointment booked', appointment });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to book appointment' });
  }
});

// PUT /api/appointments/:id - Therapist confirms or rejects an appointment
app.put('/api/appointments/:id', authenticateRole(['therapist']), async (req: AuthRequest, res: express.Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const therapistId = req.user.userId;
    if (!['confirmed', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be confirmed or rejected' });
    }
    // Only allow the assigned therapist to update
    const appointment = await Appointment.findOne({ _id: id, therapistId });
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found or not assigned to you' });
    }
    appointment.status = status;
    await appointment.save();
    res.json({ message: `Appointment ${status}`, appointment });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update appointment' });
  }
});

// GET /api/admin/appointments - Admin gets all appointments
app.get('/api/admin/appointments', authenticateRole(['admin']), async (req: AuthRequest, res: express.Response) => {
  try {
    const appointments = await Appointment.find()
      .populate('userId', 'name email')
      .populate('therapistId', 'specialization');
    res.json({ appointments });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// GET /api/appointments - Therapist gets their appointments (with optional therapistId filter)
app.get('/api/appointments', authenticateRole(['therapist']), async (req: AuthRequest, res: express.Response) => {
  try {
    const therapistId = req.query.therapistId || req.user.userId;
    const appointments = await Appointment.find({ therapistId })
      .populate('userId', 'name email')
      .populate('therapistId', 'specialization');
    res.json({ appointments });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// PUT /api/therapists/availability - Therapist sets/updates their availability
app.put('/api/therapists/availability', authenticateRole(['therapist']), async (req: AuthRequest, res: express.Response) => {
  try {
    const therapistId = req.user.userId;
    const { availability } = req.body;
    if (!Array.isArray(availability)) {
      return res.status(400).json({ error: 'Availability must be an array' });
    }
    const therapist = await Therapist.findOneAndUpdate(
      { user: therapistId },
      { availability },
      { new: true, upsert: true }
    );
    res.json({ message: 'Availability updated', therapist });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update availability' });
  }
});

// GET /api/admin/users - Admin gets all users
app.get('/api/admin/users', authenticateRole(['admin']), async (req: AuthRequest, res: express.Response) => {
  try {
    const users = await User.find();
    res.json({ users });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /api/admin/therapists - Admin gets all therapists
app.get('/api/admin/therapists', authenticateRole(['admin']), async (req: AuthRequest, res: express.Response) => {
  try {
    const therapists = await Therapist.find().populate('user', 'name email');
    res.json({ therapists });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch therapists' });
  }
});

// GET /api/admin/stats - Admin gets counts of chats, bookings, users, therapists
app.get('/api/admin/stats', authenticateRole(['admin']), async (req: AuthRequest, res: express.Response) => {
  try {
    const [userCount, therapistCount, appointmentCount, chatCount] = await Promise.all([
      User.countDocuments(),
      Therapist.countDocuments(),
      Appointment.countDocuments(),
      Chat.countDocuments()
    ]);
    res.json({
      users: userCount,
      therapists: therapistCount,
      appointments: appointmentCount,
      chats: chatCount
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Therapist routes
app.use('/api/therapists', therapistRoutes);

// Appointment routes
app.use('/api/appointments', appointmentRoutes);

// Chat routes
app.use('/api/chat', chatRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API base: http://localhost:${PORT}/api`);
});