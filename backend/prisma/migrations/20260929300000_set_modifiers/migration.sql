-- CreateTable
CREATE TABLE "set_modifiers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color_token" TEXT NOT NULL,
    "is_preset" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMP(3),
    "created_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "set_modifiers_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "sets" ADD COLUMN "modifier_id" TEXT;

-- AddForeignKey
ALTER TABLE "set_modifiers" ADD CONSTRAINT "set_modifiers_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sets" ADD CONSTRAINT "sets_modifier_id_fkey" FOREIGN KEY ("modifier_id") REFERENCES "set_modifiers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
