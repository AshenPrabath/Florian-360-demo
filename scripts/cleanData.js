const fs = require('fs');
const path = './src/data/locations.js';
let content = fs.readFileSync(path, 'utf8');

// Strip out nightImage properties
content = content.replace(/\s*"nightImage"\s*:\s*"[^"]*"/g, '');

// Clean up trailing commas in objects if they were left behind before the closing brace
content = content.replace(/,\s*\}/g, '\n      }');

fs.writeFileSync(path, content);
console.log('Cleaned up locations.js');
