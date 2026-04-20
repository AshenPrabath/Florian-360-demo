const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/pages/TourPage.jsx');
let content = fs.readFileSync(filePath, 'utf8');

if (!content.includes('useMemo,')) {
  content = content.replace(
    'useEffect,',
    'useEffect,\n  useMemo,'
  );
}

fs.writeFileSync(filePath, content);
console.log('Import fix successful');
