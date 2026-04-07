'use strict';

const fs = require('fs');

const mainPath = '/app/packages/twenty-server/dist/main.js';

if (!fs.existsSync(mainPath)) {
  process.exit(0);
}

let source = fs.readFileSync(mainPath, 'utf8');

/**
 * Add host binding for PaaS health checks: `await app.listen(x)` → `await app.listen(x, '0.0.0.0')`
 * when x is a single argument (no top-level comma) and host is not already set.
 */
function patchListenCall(input) {
  const needle = 'await app.listen(';
  const idx = input.indexOf(needle);
  if (idx === -1) {
    return input;
  }

  const openParen = idx + needle.length - 1;
  let depth = 0;
  let closeIdx = -1;

  for (let i = openParen; i < input.length; i++) {
    const c = input[i];
    if (c === '(') {
      depth++;
    } else if (c === ')') {
      depth--;
      if (depth === 0) {
        closeIdx = i;
        break;
      }
    }
  }

  if (closeIdx === -1) {
    return input;
  }

  const args = input.slice(openParen + 1, closeIdx);
  if (args.includes('0.0.0.0')) {
    return input;
  }

  let argDepth = 0;
  let topLevelComma = false;
  for (let j = 0; j < args.length; j++) {
    const ch = args[j];
    if (ch === '(') {
      argDepth++;
    } else if (ch === ')') {
      argDepth--;
    } else if (ch === ',' && argDepth === 0) {
      topLevelComma = true;
      break;
    }
  }

  if (topLevelComma) {
    return input;
  }

  return (
    input.slice(0, openParen + 1) + args + ", '0.0.0.0'" + input.slice(closeIdx)
  );
}

const patched = patchListenCall(source);
if (patched !== source) {
  fs.writeFileSync(mainPath, patched);
  console.log('railway-patch-listen: bound HTTP server to 0.0.0.0 for PaaS health checks');
}
