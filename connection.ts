// this is a test
import mongoose, { Schema } from 'mongoose'; // Import Schema
import dotenv from 'dotenv';

dotenv.config();

export async function testDatabaseConnection() {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('MongoDB Connection Successful!');

    // Define a simple schema for the "test" collection
    const testSchema = new Schema({
      name: String,
      value: Number,
    });

    // Create a model based on the schema
    const TestModel = mongoose.model('Test', testSchema);

    // Insert a single document with a random value
    const singleData = { name: 'Random Item', value: Math.floor(Math.random() * 100) }; // Random number between 0 and 99

    const createdItem = await TestModel.create(singleData);
    console.log('Single document inserted into "test" collection.', createdItem);

    // Optionally, retrieve and log the inserted data
    const insertedData = await TestModel.find();
    console.log('Inserted data:', insertedData);

    // Disconnect from the database
    await mongoose.disconnect();
    console.log('MongoDB Disconnected.');

  } catch (error) {
    console.error('MongoDB Connection or Test Failed:', error);
  }
}

let cachedConnection: mongoose.Connection | null = null;

export async function connectToDatabase() {
  if (cachedConnection) {
    return cachedConnection;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('MongoDB Connected');
    cachedConnection = mongoose.connection;
    return cachedConnection;
  } catch (error) {
    console.error('MongoDB Connection Error:', error);
    throw error;
  }
}

// export default 