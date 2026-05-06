const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const publicDir = path.join(__dirname, 'public');
const srcDir = path.join(__dirname, 'src');

async function walk(dir, callback) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filepath = path.join(dir, file);
        const stats = fs.statSync(filepath);
        if (stats.isDirectory()) {
            await walk(filepath, callback);
        } else if (stats.isFile()) {
            await callback(filepath);
        }
    }
}

async function convertImages() {
    const imagesToConvert = [];
    await walk(publicDir, async (filepath) => {
        const ext = path.extname(filepath).toLowerCase();
        if (ext === '.jpg' || ext === '.jpeg' || ext === '.png') {
            imagesToConvert.push(filepath);
        }
    });

    for (const filepath of imagesToConvert) {
        const ext = path.extname(filepath);
        const newFilepath = filepath.slice(0, -ext.length) + '.webp';
        console.log(`Converting ${filepath} to ${newFilepath}`);
        await sharp(filepath).webp({ quality: 80 }).toFile(newFilepath);
        fs.unlinkSync(filepath);
    }
    console.log('Finished converting images.');
}

async function updateFilePaths(dir) {
    await walk(dir, async (filepath) => {
        const ext = path.extname(filepath).toLowerCase();
        if (['.js', '.jsx', '.html', '.css', '.json'].includes(ext)) {
            let content = fs.readFileSync(filepath, 'utf-8');
            let originalContent = content;

            // Replace standard paths
            content = content.replace(/\.png/g, '.webp');
            content = content.replace(/\.jpg/g, '.webp');
            content = content.replace(/\.jpeg/g, '.webp');
            // Capital extensions if any
            content = content.replace(/\.PNG/g, '.webp');
            content = content.replace(/\.JPG/g, '.webp');
            content = content.replace(/\.JPEG/g, '.webp');
            
            // update mime types for manifest.json
            content = content.replace(/"type": "image\/png"/g, '"type": "image/webp"');
            content = content.replace(/"type": "image\/jpeg"/g, '"type": "image/webp"');

            if (content !== originalContent) {
                console.log(`Updated paths in ${filepath}`);
                fs.writeFileSync(filepath, content, 'utf-8');
            }
        }
    });
}

async function main() {
    await convertImages();
    await updateFilePaths(srcDir);
    await updateFilePaths(publicDir);
    
    // Check root files as well
    const rootFiles = fs.readdirSync(__dirname);
    for (const file of rootFiles) {
        if (file.endsWith('.js') && file !== 'convert-images.js') {
            let filepath = path.join(__dirname, file);
            let content = fs.readFileSync(filepath, 'utf-8');
            let originalContent = content;
            content = content.replace(/\.png/g, '.webp');
            content = content.replace(/\.jpg/g, '.webp');
            content = content.replace(/\.jpeg/g, '.webp');
            content = content.replace(/\.PNG/g, '.webp');
            content = content.replace(/\.JPG/g, '.webp');
            content = content.replace(/\.JPEG/g, '.webp');
            if (content !== originalContent) {
                console.log(`Updated paths in ${filepath}`);
                fs.writeFileSync(filepath, content, 'utf-8');
            }
        }
    }
    console.log('Finished updating paths.');
}

main().catch(console.error);
