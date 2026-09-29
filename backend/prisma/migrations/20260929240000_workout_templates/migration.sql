-- CreateTable
CREATE TABLE "workout_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "duration_minutes" INTEGER,
    "microcycle_weeks" INTEGER,
    "version" INTEGER NOT NULL DEFAULT 1,
    "archived_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workout_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "template_exercises" (
    "id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "exercise_id" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "planned_sets" INTEGER,
    "planned_reps" INTEGER,
    "planned_weight_kg" DECIMAL(10,2),
    "notes" TEXT,

    CONSTRAINT "template_exercises_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "template_exercises_template_id_sort_order_key" ON "template_exercises"("template_id", "sort_order");

-- AddForeignKey
ALTER TABLE "template_exercises" ADD CONSTRAINT "template_exercises_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "workout_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_exercises" ADD CONSTRAINT "template_exercises_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
