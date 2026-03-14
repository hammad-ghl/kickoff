import { initializeQdrantCollection, isQdrantAvailable } from './services/qdrantService';

import authRoutes from './routes/authRoutes';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import projectRoutes from './routes/projectRoutes';
import repositoryRoutes from './routes/repositoryRoutes';
import reviewRoutes from './routes/reviewRoutes';
import uiLibraryRoutes from './routes/uiLibraryRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/designsync';

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  process.env.CORS_ORIGIN,
].filter(Boolean) as string[];

app.use(cors({ 
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/ui-libraries', uiLibraryRoutes);
app.use('/api/repositories', repositoryRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

mongoose
  .connect(MONGODB_URI)
  .then(async () => {
    console.log("🚀 ~ MONGODB_URI:", MONGODB_URI)
    console.log('✅ Connected to MongoDB');
    
    if (isQdrantAvailable()) {
      try {
        await initializeQdrantCollection();
        console.log('✅ Qdrant collection initialized');
      } catch (err) {
        console.warn('⚠️ Qdrant initialization failed (continuing without vector search):', err);
      }
    } else {
      console.log('ℹ️ Qdrant not configured - Repository Intelligence will work without vector search');
    }
    
    app.listen(PORT, () => {
      console.log(`🚀 DesignSync Backend running on http://localhost:${PORT}`);
      console.log(`📊 API endpoints:`);
      console.log(`   - Projects: http://localhost:${PORT}/api/projects`);
      console.log(`   - Reviews: http://localhost:${PORT}/api/reviews`);
      console.log(`   - Auth: http://localhost:${PORT}/api/auth`);
      console.log(`   - UI Libraries: http://localhost:${PORT}/api/ui-libraries`);
      console.log(`   - Repositories: http://localhost:${PORT}/api/repositories`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

export default app;
