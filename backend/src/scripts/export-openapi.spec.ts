import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../app.module';
import { configureApp } from '../shared/bootstrap/configure-app';
import { createOpenApiDocument } from '../shared/swagger/create-openapi-document';
import { PrismaService } from '../shared/prisma/prisma.service';

describe('OpenAPI export contract', () => {
  let app: INestApplication;

  const prismaMock = {
    onModuleInit: async () => undefined,
    onModuleDestroy: async () => undefined,
    $connect: async () => undefined,
    $disconnect: async () => undefined,
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('emits OpenAPI 3.0.x with health and auth paths', () => {
    const document = createOpenApiDocument(app);

    expect(document.openapi).toMatch(/^3\.0\./);
    expect(document.paths).toHaveProperty('/api/health');
    expect(document.paths?.['/api/health']?.get).toBeDefined();
    expect(document.paths).toHaveProperty('/api/auth/login');
    expect(document.paths).toHaveProperty('/api/auth/logout');
    expect(document.paths).toHaveProperty('/api/auth/me');
  });
});
