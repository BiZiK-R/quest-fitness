import { existsSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Nest 12 exports map expects interfaces.js; the package ships a directory only. */
const nestCommonDir = join(
  dirname(fileURLToPath(import.meta.url)),
  '../node_modules/@nestjs/common',
);
const shimPath = join(nestCommonDir, 'interfaces.js');

if (!existsSync(shimPath)) {
  writeFileSync(shimPath, "export * from './interfaces/index.js';\n");
}
