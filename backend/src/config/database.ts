import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/greenlane';

interface ConnectionOptions {
  maxRetries?: number;
  retryDelay?: number;
}

let isConnected = false;

export async function connectDatabase(options: ConnectionOptions = {}): Promise<void> {
  const { maxRetries = 5, retryDelay = 5000 } = options;

  if (isConnected) {
    console.log('📦 Using existing database connection');
    return;
  }

  let retries = 0;

  while (retries < maxRetries) {
    try {
      console.log(`🔌 Connecting to MongoDB... (attempt ${retries + 1}/${maxRetries})`);
      
      await mongoose.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      isConnected = true;
      console.log('✅ Connected to MongoDB successfully');
      console.log(`   Database: ${mongoose.connection.db?.databaseName || 'greenlane'}`);
      
      // Handle connection events
      mongoose.connection.on('error', (err) => {
        console.error('❌ MongoDB connection error:', err);
        isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        console.log('⚠️ MongoDB disconnected');
        isConnected = false;
      });

      mongoose.connection.on('reconnected', () => {
        console.log('🔄 MongoDB reconnected');
        isConnected = true;
      });

      return;
    } catch (error) {
      retries++;
      console.error(`❌ MongoDB connection failed (attempt ${retries}/${maxRetries}):`, error);
      
      if (retries < maxRetries) {
        console.log(`   Retrying in ${retryDelay / 1000}s...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  throw new Error(`Failed to connect to MongoDB after ${maxRetries} attempts`);
}

export async function disconnectDatabase(): Promise<void> {
  if (!isConnected) return;

  try {
    await mongoose.disconnect();
    isConnected = false;
    console.log('👋 Disconnected from MongoDB');
  } catch (error) {
    console.error('Error disconnecting from MongoDB:', error);
  }
}

export function getConnectionStatus(): { isConnected: boolean; readyState: string } {
  const states: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  return {
    isConnected,
    readyState: states[mongoose.connection.readyState] || 'unknown',
  };
}

export { mongoose };
