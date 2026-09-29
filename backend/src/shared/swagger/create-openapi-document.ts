import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';

/**
 * Builds the OpenAPI document from the live Nest application (controllers + global prefix).
 */
export function createOpenApiDocument(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('Quest Fitness API')
    .setDescription('Quest Fitness BFF')
    .setVersion('0.1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  if (document.openapi.startsWith('3.1')) {
    document.openapi = '3.0.3';
  }

  return document;
}
