import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI environment variable is not defined');
}

const connectDB = async () => {
  try {
    if (mongoose.connection.readyState >= 1) return;
    
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
    
    console.log('🟢 MongoDB Connected:', mongoose.connection.host);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('🔴 MongoDB connection failed:', message);
    throw new Error(`Database connection failed: ${message}`);
  }
};

export default connectDB;