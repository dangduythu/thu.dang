const path = require('node:path');

function assetPath(root, address) {
  const url = new URL(address);
  if (url.protocol !== 'mathkid:' || url.hostname !== 'app') throw new Error('Invalid app origin');
  let pathname = decodeURIComponent(url.pathname);
  if (pathname.includes('\\') || pathname.includes('\0')) throw new Error('Invalid asset path');
  if (pathname === '/') pathname = '/index.html';
  const base = path.resolve(root);
  const resolved = path.resolve(base, '.' + pathname);
  if (resolved !== base && !resolved.startsWith(base + path.sep)) throw new Error('Outside app bundle');
  return resolved;
}
module.exports = { assetPath };
