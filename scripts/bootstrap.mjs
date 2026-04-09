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
    try {
      copyFileSync(src, dest);
      console.log(`bootstrap: created ${dest}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`bootstrap: could not write ${dest}: ${message}`);
      process.exit(1);
    }
  }
}
