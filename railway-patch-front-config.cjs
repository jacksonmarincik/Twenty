#!/usr/bin/env node
/*
 * Augments the prebuilt server's generate-front-config.js so that the
 * runtime window._env_ block also exposes REACT_APP_MESSENGER_BASE_URL.
 *
 * The upstream server only writes REACT_APP_SERVER_BASE_URL; we need the
 * messenger URL to flow from the Railway env (MESSENGER_BASE_URL) into the
 * static frontend at container start, without a server source rebuild.
 */
const fs = require('fs');
const path = require('path');

const TARGETS = [
  '/app/packages/twenty-server/dist/src/utils/generate-front-config.js',
  '/app/packages/twenty-server/dist/utils/generate-front-config.js',
  '/app/packages/twenty-server/dist/packages/twenty-server/src/utils/generate-front-config.js',
];

let target = null;
for (const candidate of TARGETS) {
  if (fs.existsSync(candidate)) {
    target = candidate;
    break;
  }
}

if (target === null) {
  console.error('railway-patch-front-config: generate-front-config.js not found; skipping');
  process.exit(0);
}

const original = fs.readFileSync(target, 'utf8');

if (original.includes('REACT_APP_MESSENGER_BASE_URL')) {
  console.log(`railway-patch-front-config: ${target} already patched`);
  process.exit(0);
}

// Match either TS-compiled object literal shapes:
//   REACT_APP_SERVER_BASE_URL: process.env.SERVER_URL,
//   "REACT_APP_SERVER_BASE_URL": process.env.SERVER_URL,
const injectionRegex =
  /(['"]?REACT_APP_SERVER_BASE_URL['"]?\s*:\s*process\.env\.SERVER_URL)(\s*,?\s*)/;

if (!injectionRegex.test(original)) {
  console.error(
    `railway-patch-front-config: could not locate injection point in ${target}; leaving file unchanged`,
  );
  process.exit(0);
}

const patched = original.replace(
  injectionRegex,
  '$1, REACT_APP_MESSENGER_BASE_URL: (process.env.MESSENGER_BASE_URL || process.env.REACT_APP_MESSENGER_BASE_URL || "")$2',
);

fs.writeFileSync(target, patched, 'utf8');
console.log(`railway-patch-front-config: patched ${target}`);
