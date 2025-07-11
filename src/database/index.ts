import mongoose from 'mongoose';

const { MONGO_URI: mongoURI } = process.env;

export async function setupMongo() {
  try {
    if (mongoose.connection.readyState === 1) {
      console.log('Already connected to MongoDB.');
      return;
    }
    console.log('⏳ Connecting to MongoDB...');
    if (!mongoURI) {
      throw new Error('MONGO_URI is not defined');
    }
    await mongoose.connect(String(mongoURI), {
      serverSelectionTimeoutMS: 3000,
    });
    console.log('✅ Connected to MongoDB successfully');
  } catch (error) {
    console.log('❌ No connecting to MongoDB', error);
  }
}
