const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      results.push(file);
    }
  });
  return results;
}

const apiDir = path.join(__dirname, '../app/api');
try {
  const files = walk(apiDir);
  console.log("All API Route Files:");
  files.forEach(f => {
    console.log(`- ${path.relative(apiDir, f)}`);
  });
} catch (e) {
  console.error("Error listing routes:", e);
}
