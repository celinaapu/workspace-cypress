import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  );
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development and function executions in serverless environments like Netlify.
 */
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // This prevents the creation of multiple connections during development
  var mongoose: MongooseCache | undefined;
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  // 1. If we have a connection already, return it immediately
  if (cached?.conn) {
    return cached.conn;
  }

  // 2. If no connection promise exists, create one
  if (!cached?.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000, // Stay within Netlify function limits
      connectTimeoutMS: 10000,
    };

    console.log('📡 Initializing new MongoDB connection...');
    
    cached!.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('🟢 MongoDB Connected successfully');
      return mongoose;
    });
  }

  // 3. Wait for the promise to resolve and cache the connection
  try {
    cached!.conn = await cached!.promise;
  } catch (e) {
    // If the connection fails, clear the promise so we can try again on the next request
    cached!.promise = null;
    console.error('🔴 MongoDB connection error:', e);
    throw e;
  }

  return cached!.conn;
}

export default connectDB;