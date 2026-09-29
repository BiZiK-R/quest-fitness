-- CreateTable
CREATE TABLE "client_locks" (
    "client_id" TEXT NOT NULL,
    "holder_trainer_id" TEXT NOT NULL,
    "last_activity_at" TIMESTAMP(3) NOT NULL,
    "active_session_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_locks_pkey" PRIMARY KEY ("client_id")
);

-- AddForeignKey
ALTER TABLE "client_locks" ADD CONSTRAINT "client_locks_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_locks" ADD CONSTRAINT "client_locks_holder_trainer_id_fkey" FOREIGN KEY ("holder_trainer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
