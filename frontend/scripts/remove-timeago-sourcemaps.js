const fs = require('fs');
const path = require('path');

const pkgPath = path.join(__dirname, '..', 'node_modules', 'timeago.js');

function stripSourceMapComment(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      const newLines = lines.filter(line => !line.includes('//# sourceMappingURL='));

      if (lines.length !== newLines.length) {
        fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
        console.log('[remove-timeago-sourcemaps] stripped sourceMappingURL from', filePath);
      }
    }
  } catch (e) {
    console.error('[remove-timeago-sourcemaps] error processing', filePath, e.message);
  }
}

function walkSync(currentDir, filelist = []) {
  if (fs.existsSync(currentDir)) {
    fs.readdirSync(currentDir).forEach(file => {
      const filePath = path.join(currentDir, file);
      if (fs.statSync(filePath).isDirectory()) {
        filelist = walkSync(filePath, filelist);
      } else {
        if (file.endsWith('.js') || file.endsWith('.ts')) {
          filelist.push(filePath);
        }
      }
    });
  }
  return filelist;
}

if (fs.existsSync(pkgPath)) {
  const dirs = ['esm', 'lib', 'dist', 'src'];
  dirs.forEach((d) => {
    const dir = path.join(pkgPath, d);
    if (fs.existsSync(dir)) {
      const files = walkSync(dir);
      files.forEach(f => stripSourceMapComment(f));
    }
  });
} else {
  console.log('[remove-timeago-sourcemaps] package not found, skipping');
}
