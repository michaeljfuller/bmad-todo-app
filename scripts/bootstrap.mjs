import { copyFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pairs = [
  [join(root, 'client', '.env.example'), join(root, 'client', '.env')],
  [join(root, 'api', '.env.example'), join(root, 'api', '.env')],
];

for (const [src, dest] of pairs) {
  if (!existsSync(src)) {
    console.error(`bootstrap: missing ${src}`);
    process.exit(1);
  }
  if (existsSync(dest)) {
    console.log(`bootstrap: skip (exists): ${dest}`);
  } else {
    copyFileSync(src, dest);
    console.log(`bootstrap: created ${dest}`);
  }
}
