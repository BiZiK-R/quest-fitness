-- CreateTable
CREATE TABLE "sets" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "session_exercise_id" TEXT NOT NULL,
    "sequence_index" INTEGER NOT NULL,
    "weight_kg" DECIMAL(10,2),
    "reps" INTEGER,
    "rpe" DECIMAL(3,1),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sets_session_id_sequence_index_idx" ON "sets"("session_id", "sequence_index");

-- AddForeignKey
ALTER TABLE "sets" ADD CONSTRAINT "sets_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sets" ADD CONSTRAINT "sets_session_exercise_id_fkey" FOREIGN KEY ("session_exercise_id") REFERENCES "session_exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;
