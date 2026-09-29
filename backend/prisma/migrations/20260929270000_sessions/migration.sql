-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('active', 'completed', 'abandoned');

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "workout_id" TEXT NOT NULL,
    "client_profile_id" TEXT NOT NULL,
    "author_trainer_id" TEXT NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'active',
    "started_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "abandoned_at" TIMESTAMP(3),
    "planned_duration_minutes" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_exercises" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "exercise_id" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "planned_sets" INTEGER,
    "planned_reps" INTEGER,
    "planned_weight_kg" DECIMAL(10,2),
    "name_snapshot" TEXT NOT NULL,
    "notes" TEXT,

    CONSTRAINT "session_exercises_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sessions_workout_id_key" ON "sessions"("workout_id");

-- CreateIndex
CREATE INDEX "sessions_client_profile_id_idx" ON "sessions"("client_profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "session_exercises_session_id_sort_order_key" ON "session_exercises"("session_id", "sort_order");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_workout_id_fkey" FOREIGN KEY ("workout_id") REFERENCES "workouts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_client_profile_id_fkey" FOREIGN KEY ("client_profile_id") REFERENCES "client_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_author_trainer_id_fkey" FOREIGN KEY ("author_trainer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_exercises" ADD CONSTRAINT "session_exercises_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_exercises" ADD CONSTRAINT "session_exercises_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
