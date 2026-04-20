import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import recordsRoutes from './routes/records';
import enquiriesRoutes from './routes/enquiries';
import settingsRoutes from './routes/settings';

const app = express();

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/records', recordsRoutes);
app.use('/api/enquiries', enquiriesRoutes);
app.use('/api/settings', settingsRoutes);

// Export for serverless (Vercel)
export default app;
