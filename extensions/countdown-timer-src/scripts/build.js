import { build } from 'vite';
import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function buildExtension() {
  try {
    console.log('Building extension source...');
    await build();

    const distFile = join(__dirname, '..', 'dist', 'countdown-timer.iife.js');
    const extensionAssetsDir = join(__dirname, '..', '..', 'countdown-timer', 'assets');
    const extensionAssetsFile = join(extensionAssetsDir, 'countdown-timer.js');

    if (!existsSync(distFile)) {
      throw new Error(`Build file not found: ${distFile}`);
    }

    mkdirSync(extensionAssetsDir, { recursive: true });
    copyFileSync(distFile, extensionAssetsFile);

    console.log('✅ Build complete!');
    console.log(`   Output: ${extensionAssetsFile}`);
  } catch (error) {
    console.error('❌ Error building extension:', error);
    process.exit(1);
  }
}

buildExtension();







