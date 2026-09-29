import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const frontendRoot = resolve(scriptDir, '..');
const openApiPath = resolve(
  process.env.OPENAPI_CONTRACT_PATH ??
    join(frontendRoot, '../backend/openapi/openapi.yaml'),
);
const apiDir = resolve(frontendRoot, 'src/shared/api');
const schemaOut = join(apiDir, 'schema.d.ts');

if (!existsSync(openApiPath)) {
  console.error(
    `OpenAPI contract missing at ${openApiPath}. Run "npm run openapi:export" in backend/.`,
  );
  process.exit(1);
}

execSync(`npx openapi-typescript "${openApiPath}" -o "${schemaOut}"`, {
  stdio: 'inherit',
  cwd: frontendRoot,
});

console.log(`Generated ${schemaOut}`);
