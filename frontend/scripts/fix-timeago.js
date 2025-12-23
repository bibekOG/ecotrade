const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf'); // You might not have this, so I'll use fs.rmSync

const projectRoot = path.join(__dirname, '..');
const timeagoPath = path.join(projectRoot, 'node_modules', 'timeago.js');
const cachePath = path.join(projectRoot, 'node_modules', '.cache');

function walk(dir) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir);
    list.forEach(function (file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.js') || file.endsWith('.ts')) {
                results.push(file);
            }
        }
    });
    return results;
}

if (fs.existsSync(timeagoPath)) {
    console.log(`Scanning ${timeagoPath}...`);
    const files = walk(timeagoPath);
    let fixedCount = 0;

    files.forEach(file => {
        try {
            const content = fs.readFileSync(file, 'utf8');
            if (content.includes('sourceMappingURL=')) {
                console.log(`Fixing ${file}`);
                // Remove lines containing sourceMappingURL
                const newContent = content.split('\n')
                    .filter(line => !line.includes('sourceMappingURL='))
                    .join('\n');
                fs.writeFileSync(file, newContent, 'utf8');
                fixedCount++;
            }
        } catch (err) {
            console.error(`Error processing ${file}:`, err);
        }
    });
    console.log(`Fixed ${fixedCount} files.`);
} else {
    console.log('timeago.js not found in node_modules');
}

// Clear cache
if (fs.existsSync(cachePath)) {
    console.log(`Clearing cache at ${cachePath}...`);
    try {
        fs.rmSync(cachePath, { recursive: true, force: true });
        console.log('Cache cleared.');
    } catch (e) {
        console.error('Failed to clear cache (might be in use):', e.message);
    }
}
