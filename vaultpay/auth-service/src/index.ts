import express from 'express';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import authRoutes from './routes/auth-routes';
import { initEventBus } from './events/event-bus';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'Auth Service Running' });
});

const start = async () => {
  if (!process.env.NATS_URL) throw new Error('NATS_URL must be defined');
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI must be defined');
  if (!process.env.JWT_ACCESS_SECRET)
    throw new Error('JWT_ACCESS_SECRET must be defined');
  if (!process.env.JWT_REFRESH_SECRET)
    throw new Error('JWT_REFRESH_SECRET must be defined');
  if (!process.env.REDIS_URL) throw new Error('REDIS_URL must be defined');
  if (!process.env.AES_SECRET) throw new Error('AES_SECRET must be defined');

  try {
    await initEventBus();
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Auth Service running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Startup Error:', err);
  }
};

start();
