import 'reflect-metadata';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { stringify } from 'yaml';
import { AppModule } from '../app.module';
import { configureApp } from '../shared/bootstrap/configure-app';
import { createOpenApiDocument } from '../shared/swagger/create-openapi-document';
import { PrismaService } from '../shared/prisma/prisma.service';

const prismaMock = {
  onModuleInit: async () => undefined,
  onModuleDestroy: async () => undefined,
  $connect: async () => undefined,
  $disconnect: async () => undefined,
};

async function createExportApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(PrismaService)
    .useValue(prismaMock)
    .compile();

  const app = moduleRef.createNestApplication();
  configureApp(app);
  await app.init();
  return app;
}

async function exportOpenApi(): Promise<void> {
  const app = await createExportApp();

  const document = createOpenApiDocument(app);
  const outPath = join(__dirname, '../../openapi/openapi.yaml');

  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, stringify(document), 'utf8');

  await app.close();
}

void exportOpenApi();
