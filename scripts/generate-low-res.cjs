/**
 * Node script to generate low-res image placeholders for progressive loading.
 * 
 * Usage: node scripts/generate-low-res.cjs
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Install sharp locally if not present
try {
  require.resolve('sharp');
} catch (e) {
  console.log('Installing sharp...');
  execSync('npm install sharp --no-save', { stdio: 'inherit' });
}

const sharp = require('sharp');

const imagesDir = path.join(__dirname, '..', 'public', 'assets', 'images');

async function processImages() {
  if (!fs.existsSync(imagesDir)) {
    console.error(`Directory not found: ${imagesDir}`);
    return;
  }

  const files = fs.readdirSync(imagesDir);
  const jpgFiles = files.filter(f => f.toLowerCase().endsWith('.jpg') && !f.includes('_low.jpg'));

  for (const file of jpgFiles) {
    const inputPath = path.join(imagesDir, file);
    const lowResFile = file.replace('.jpg', '_low.jpg').replace('.JPG', '_low.jpg');
    const outputPath = path.join(imagesDir, lowResFile);

    // Skip if already exists
    if (!fs.existsSync(outputPath)) {
      console.log(`Generating LQIP for ${file}...`);
      try {
        await sharp(inputPath)
          .resize(512) // Resize to 512px width (maintains aspect ratio, usually 2:1 for panos)
          .jpeg({ quality: 60 }) // High compression for ultra-fast loading
          .toFile(outputPath);
        console.log(`  -> ${lowResFile} created.`);
      } catch (err) {
        console.error(`Error processing ${file}:`, err);
      }
    } else {
      console.log(`Skipping ${file}, LQIP already exists.`);
    }
  }
  
  console.log('Done generating low-resolution proxies!');
}

processImages();
