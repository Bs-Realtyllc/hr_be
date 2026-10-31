import mongoose from 'mongoose';

export async function connectMongo() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/hr_inbox';
  await mongoose.connect(uri);
}
