import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

if (!process.env.MONGODB_URI) {
  console.log('🔴 No MongoDB URI found in .env');
}

const MONGODB_URI = process.env.MONGODB_URI as string;

const connectDB = async () => {
  try {
    if (mongoose.connection.readyState >= 1) return;
    
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000
    });
    console.log('🟢 MongoDB Connected Successfully');
  } catch (error) {
    console.log('🔴 Error connecting to MongoDB:', error instanceof Error ? error.message : 'Unknown error');
    throw new Error('Database connection failed. Please check your MongoDB Atlas IP whitelist.');
  }
};

export default connectDB;