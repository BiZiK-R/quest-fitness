import { existsSync } from 'node:fs';

/**
 * Ensures the canonical backend OpenAPI YAML exists before codegen or build.
 */
export function assertOpenApiPresent(openApiPath: string): void {
  if (!existsSync(openApiPath)) {
    throw new Error(
      `OpenAPI contract missing at ${openApiPath}. Run \`npm run openapi:export\` in backend/.`,
    );
  }
}
