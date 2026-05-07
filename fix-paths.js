const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function walk(dir, callback) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filepath = path.join(dir, file);
        const stats = fs.statSync(filepath);
        if (stats.isDirectory()) {
            walk(filepath, callback);
        } else if (stats.isFile()) {
            callback(filepath);
        }
    }
}

walk(srcDir, (filepath) => {
    if (filepath.endsWith('.js') || filepath.endsWith('.jsx')) {
        let content = fs.readFileSync(filepath, 'utf-8');
        let originalContent = content;

        // src="/assets/... -> src={process.env.PUBLIC_URL + "/assets/...}
        content = content.replace(/src="\/assets\/([^"]+)"/g, 'src={process.env.PUBLIC_URL + "/assets/$1"}');
        
        // src="/images/... -> src={process.env.PUBLIC_URL + "/images/...}
        content = content.replace(/src="\/images\/([^"]+)"/g, 'src={process.env.PUBLIC_URL + "/images/$1"}');

        // src={"/assets/..."} is tricky, let's just do:
        // "\/assets\/..." -> process.env.PUBLIC_URL + "/assets/..." (for string literals)
        // Wait, what if it's already process.env.PUBLIC_URL + "/assets/"?
        // We can do a negative lookbehind, but it's easier to just match carefully.
        // Let's replace ' "/assets/' (with space before) or '("/assets/'
        // Actually, just replacing '"/assets/' with 'process.env.PUBLIC_URL + "/assets/' is fine, EXCEPT we shouldn't do it if it's already done.
        
        // '/assets/...' -> process.env.PUBLIC_URL + '/assets/...'
        // Only if it doesn't already have process.env.PUBLIC_URL + 
        content = content.replace(/(?<!process\.env\.PUBLIC_URL \+ )'\/assets\/([^']+)'/g, "process.env.PUBLIC_URL + '/assets/$1'");
        content = content.replace(/(?<!process\.env\.PUBLIC_URL \+ )"\/assets\/([^"]+)"/g, 'process.env.PUBLIC_URL + "/assets/$1"');
        
        // "assets/images/..." in locations.js
        content = content.replace(/(?<!process\.env\.PUBLIC_URL \+ \/)"assets\/([^"]+)"/g, 'process.env.PUBLIC_URL + "/assets/$1"');

        if (content !== originalContent) {
            fs.writeFileSync(filepath, content, 'utf-8');
            console.log(`Updated ${filepath}`);
        }
    }
});
