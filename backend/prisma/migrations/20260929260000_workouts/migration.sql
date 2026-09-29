-- CreateEnum
CREATE TYPE "WorkoutStatus" AS ENUM ('pending', 'attended', 'skipped', 'cancelled');

-- CreateTable
CREATE TABLE "workouts" (
    "id" TEXT NOT NULL,
    "client_profile_id" TEXT NOT NULL,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "status" "WorkoutStatus" NOT NULL DEFAULT 'pending',
    "template_id" TEXT,
    "source_stage_id" TEXT,
    "created_by_user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "idempotency_records" (
    "id" TEXT NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "actor_user_id" TEXT NOT NULL,
    "response_status" INTEGER NOT NULL,
    "response_body" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "idempotency_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "workouts_client_profile_id_scheduled_at_idx" ON "workouts"("client_profile_id", "scheduled_at");

-- CreateIndex
CREATE INDEX "idempotency_records_created_at_idx" ON "idempotency_records"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "idempotency_records_scope_idempotency_key_key" ON "idempotency_records"("scope", "idempotency_key");

-- AddForeignKey
ALTER TABLE "workouts" ADD CONSTRAINT "workouts_client_profile_id_fkey" FOREIGN KEY ("client_profile_id") REFERENCES "client_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workouts" ADD CONSTRAINT "workouts_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "workout_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workouts" ADD CONSTRAINT "workouts_source_stage_id_fkey" FOREIGN KEY ("source_stage_id") REFERENCES "macrocycle_stages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workouts" ADD CONSTRAINT "workouts_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
