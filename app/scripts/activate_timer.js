import mongoose from 'mongoose';
import Timer from '../models/Timer.js';
import config from '../config/env.js';

async function activateTimer() {
    try {
        await mongoose.connect(config.mongodb.uri);
        console.log('Connected to MongoDB');

        // Find the scheduled timer
        const timer = await Timer.findOne({ status: 'scheduled' });

        if (!timer) {
            console.log('No scheduled timer found.');
            // Fallback: try to find any fixed timer
            const anyFixed = await Timer.findOne({ type: 'fixed' });
            if (anyFixed) {
                console.log(`Found fixed timer ${anyFixed._id} with status ${anyFixed.status}. Updating...`);
                anyFixed.startDate = new Date(Date.now() - 3600000); // 1 hour ago
                anyFixed.endDate = new Date(Date.now() + 86400000); // 24 hours from now
                anyFixed.status = 'active'; // Force status update
                await anyFixed.save();
                console.log('Timer updated to active!');
            } else {
                console.log('No fixed timers found at all.');
            }
            return;
        }

        console.log(`Found scheduled timer: ${timer._id}`);

        // Set start date to 1 hour ago
        timer.startDate = new Date(Date.now() - 3600000);
        // Set end date to 24 hours from now (to be safe)
        timer.endDate = new Date(Date.now() + 86400000);

        // Save (pre-save hook will update status to active)
        await timer.save();

        console.log(`Timer ${timer._id} activated!`);
        console.log(`New Start Date: ${timer.startDate}`);
        console.log(`New End Date: ${timer.endDate}`);
        console.log(`New Status: ${timer.status}`);

    } catch (error) {
        console.error('Error activating timer:', error);
    } finally {
        await mongoose.disconnect();
    }
}

activateTimer();
