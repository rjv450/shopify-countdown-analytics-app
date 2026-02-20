import mongoose from 'mongoose';
import Timer from '../models/Timer.js';
import config from '../config/env.js';

async function checkTimers() {
  try {
    await mongoose.connect(config.mongodb.uri);
    console.log('Connected to MongoDB');

    const timers = await Timer.find({});
    console.log(`Found ${timers.length} timers`);
    
    timers.forEach(t => {
      console.log(`- ID: ${t._id}`);
      console.log(`  Shop: ${t.shop}`);
      console.log(`  Target: ${t.targetType}`);
      console.log(`  Status: ${t.status}`);
      if (t.targetType === 'products') {
        console.log(`  Product IDs: ${t.targetIds.join(', ')}`);
      }
    });

  } catch (error) {
    console.error('Error checking timers:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkTimers();
