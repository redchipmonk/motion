import mongoose from "mongoose";

export async function connectDatabase(uri: string) {
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Mongo connection failed");
    throw error;
  }
}
