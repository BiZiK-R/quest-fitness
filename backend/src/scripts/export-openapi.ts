import 'reflect-metadata';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { stringify } from 'yaml';
import { createOpenApiDocument } from '../shared/swagger/create-openapi-document';
import { OpenApiExportModule } from './openapi-export.module';

async function exportOpenApi(): Promise<void> {
  const app = await NestFactory.create(OpenApiExportModule, { logger: false });
  app.setGlobalPrefix('api');
  await app.init();

  const document = createOpenApiDocument(app);
  const outPath = join(__dirname, '../../openapi/openapi.yaml');

  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, stringify(document), 'utf8');

  await app.close();
}

void exportOpenApi();
