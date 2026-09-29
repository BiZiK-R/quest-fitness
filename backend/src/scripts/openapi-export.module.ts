import { Module } from '@nestjs/common';
import { HealthModule } from '../modules/health/health.module';

/** Minimal app graph for OpenAPI export (no database). */
@Module({
  imports: [HealthModule],
})
export class OpenApiExportModule {}
