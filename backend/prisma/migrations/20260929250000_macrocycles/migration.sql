-- CreateTable
CREATE TABLE "macrocycles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "periodicity_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "macrocycles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "macrocycle_stages" (
    "id" TEXT NOT NULL,
    "macrocycle_id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,

    CONSTRAINT "macrocycle_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_macro_progress" (
    "id" TEXT NOT NULL,
    "client_profile_id" TEXT NOT NULL,
    "macrocycle_id" TEXT NOT NULL,
    "current_stage_id" TEXT,

    CONSTRAINT "client_macro_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "macrocycle_stages_macrocycle_id_sort_order_key" ON "macrocycle_stages"("macrocycle_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "client_macro_progress_client_profile_id_key" ON "client_macro_progress"("client_profile_id");

-- AddForeignKey
ALTER TABLE "macrocycle_stages" ADD CONSTRAINT "macrocycle_stages_macrocycle_id_fkey" FOREIGN KEY ("macrocycle_id") REFERENCES "macrocycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "macrocycle_stages" ADD CONSTRAINT "macrocycle_stages_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "workout_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_macro_progress" ADD CONSTRAINT "client_macro_progress_client_profile_id_fkey" FOREIGN KEY ("client_profile_id") REFERENCES "client_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_macro_progress" ADD CONSTRAINT "client_macro_progress_macrocycle_id_fkey" FOREIGN KEY ("macrocycle_id") REFERENCES "macrocycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_macro_progress" ADD CONSTRAINT "client_macro_progress_current_stage_id_fkey" FOREIGN KEY ("current_stage_id") REFERENCES "macrocycle_stages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
