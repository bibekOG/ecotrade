const fs = require('fs');
const path = require('path');

const pkgPath = path.join(__dirname, '..', 'node_modules', 'timeago.js');

function removeMap(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('[remove-timeago-sourcemaps] removed', filePath);
    }
  } catch (e) {
    console.error('[remove-timeago-sourcemaps] error removing', filePath, e.message);
  }
}

if (fs.existsSync(pkgPath)) {
  const dirs = ['esm', 'lib', 'dist'];
  dirs.forEach((d) => {
    const dir = path.join(pkgPath, d);
    if (fs.existsSync(dir)) {
      fs.readdirSync(dir).forEach((f) => {
        if (f.endsWith('.map')) {
          removeMap(path.join(dir, f));
        }
      });
    }
  });
} else {
  console.log('[remove-timeago-sourcemaps] package not found, skipping');
}
