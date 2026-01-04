const fs = require('fs');
const path = require('path');

const pkgPath = path.join(__dirname, '..', 'node_modules', 'timeago.js');

if (!fs.existsSync(pkgPath)) {
    console.log('timeago.js not found');
    process.exit(0);
}

// 1. Create missing directories
const dirsToCreate = [
    'esm', // should exist
    'src',
    path.join('src', 'lang'),
    path.join('src', 'utils')
];

dirsToCreate.forEach(d => {
    const p = path.join(pkgPath, d);
    if (!fs.existsSync(p)) {
        console.log('Creating dir:', p);
        fs.mkdirSync(p, { recursive: true });
    }
});

// 2. Create missing source maps (minimal valid JSON)
const mapContent = JSON.stringify({
    version: 3,
    sources: [],
    names: [],
    mappings: "",
    file: "generated.js"
});

const mapsToCreate = [
    'esm/format.js.map',
    'esm/index.js.map',
    'esm/realtime.js.map',
    'esm/register.js.map'
];

mapsToCreate.forEach(f => {
    const p = path.join(pkgPath, f);
    if (!fs.existsSync(p)) {
        console.log('Creating map:', p);
        fs.writeFileSync(p, mapContent);
    } else {
        console.log('Map exists (refilling just in case):', p);
        fs.writeFileSync(p, mapContent); // Overwrite to ensure validity
    }
});

// 3. Create missing TS source files (empty)
const tsContent = "// empty";
const tsFilesToCreate = [
    'src/lang/en_US.ts',
    'src/lang/zh_CN.ts',
    'src/utils/date.ts',
    'src/utils/dom.ts'
];

tsFilesToCreate.forEach(f => {
    const p = path.join(pkgPath, f);
    if (!fs.existsSync(p)) {
        console.log('Creating source:', p);
        fs.writeFileSync(p, tsContent);
    }
});

console.log('Done creating dummy files to silence warnings.');
