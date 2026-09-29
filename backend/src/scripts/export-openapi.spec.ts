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
    expect(document.paths).toHaveProperty('/api/trainer/ping');
    expect(document.paths).toHaveProperty('/api/clients');
    const clientsGet = document.paths?.['/api/clients']?.get;
    const clientsPost = document.paths?.['/api/clients']?.post;
    expect(clientsGet?.responses?.['200']).toBeDefined();
    expect(clientsPost?.responses?.['201']).toBeDefined();
    expect(clientsPost?.requestBody).toBeDefined();
    const clientSchema =
      clientsPost?.requestBody?.content?.['application/json']?.schema;
    expect(JSON.stringify(clientSchema)).not.toMatch(/ownerTrainerId/i);
    expect(document.paths).toHaveProperty('/api/clients/{clientId}/invites');
    const invitePost =
      document.paths?.['/api/clients/{clientId}/invites']?.post;
    expect(invitePost?.responses?.['201']).toBeDefined();
    expect(document.paths).toHaveProperty(
      '/api/clients/{clientId}/invites/active',
    );
    expect(document.paths).toHaveProperty('/api/invites/{token}/register');
    expect(document.paths).toHaveProperty('/api/invites/{token}');
    const loginPost = document.paths?.['/api/auth/login']?.post;
    expect(loginPost?.requestBody).toBeDefined();
  });
});
