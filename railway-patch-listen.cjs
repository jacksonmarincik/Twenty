'use strict';

const fs = require('fs');

const mainPath = '/app/packages/twenty-server/dist/main.js';

if (!fs.existsSync(mainPath)) {
  process.exit(0);
}

let source = fs.readFileSync(mainPath, 'utf8');

if (/\blisten\([^)]*['"]0\.0\.0\.0['"]/.test(source)) {
  process.exit(0);
}

const replacements = [
  [
    /\bawait app\.listen\(listenPort\)\s*;/g,
    "await app.listen(listenPort, '0.0.0.0');",
  ],
  [
    /\bawait app\.listen\(twentyConfigService\.get\('NODE_PORT'\)\)\s*;/g,
    "await app.listen(twentyConfigService.get('NODE_PORT'), '0.0.0.0');",
  ],
  [
    /\bawait app\.listen\(twentyConfigService\.get\("NODE_PORT"\)\)\s*;/g,
    'await app.listen(twentyConfigService.get("NODE_PORT"), \'0.0.0.0\');',
  ],
];

const before = source;
for (const [pattern, replacement] of replacements) {
  source = source.replace(pattern, replacement);
}

if (source !== before) {
  fs.writeFileSync(mainPath, source);
  console.log('railway-patch-listen: bound HTTP server to 0.0.0.0 for PaaS health checks');
}
