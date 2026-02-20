import mongoose from 'mongoose';
import Timer from '../models/Timer.js';
import config from '../config/env.js';

const OLD_SHOP = 'test-shop.myshopify.com';
const NEW_SHOP = 'development-store-15820042444.myshopify.com';

async function fixShopDomain() {
    try {
        await mongoose.connect(config.mongodb.uri);
        console.log('Connected to MongoDB');

        const result = await Timer.updateMany(
            { shop: OLD_SHOP },
            { $set: { shop: NEW_SHOP } }
        );

        console.log(`Updated ${result.modifiedCount} timers.`);
        console.log(`From: ${OLD_SHOP}`);
        console.log(`To:   ${NEW_SHOP}`);

        // Verify
        const count = await Timer.countDocuments({ shop: NEW_SHOP });
        console.log(`Total timers for ${NEW_SHOP}: ${count}`);

    } catch (error) {
        console.error('Error fixing shop domain:', error);
    } finally {
        await mongoose.disconnect();
    }
}

fixShopDomain();
