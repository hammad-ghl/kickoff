import mongoose from 'mongoose';
import Project from './models/Project';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/designsync';

async function migrateProjects() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all projects without a status field
    const projectsWithoutStatus = await Project.find({ 
      $or: [
        { status: { $exists: false } },
        { status: null }
      ]
    });

    console.log(`📊 Found ${projectsWithoutStatus.length} projects without status`);

    if (projectsWithoutStatus.length === 0) {
      console.log('✅ All projects already have status field');
      await mongoose.disconnect();
      return;
    }

    // Update all projects without status to have 'draft' status
    const result = await Project.updateMany(
      { 
        $or: [
          { status: { $exists: false } },
          { status: null }
        ]
      },
      { 
        $set: { status: 'draft' } 
      }
    );

    console.log(`✅ Updated ${result.modifiedCount} projects with default 'draft' status`);

    // Verify the update
    const remainingWithoutStatus = await Project.countDocuments({ 
      $or: [
        { status: { $exists: false } },
        { status: null }
      ]
    });

    if (remainingWithoutStatus === 0) {
      console.log('✅ Migration completed successfully!');
    } else {
      console.log(`⚠️  Warning: ${remainingWithoutStatus} projects still without status`);
    }

    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateProjects();
