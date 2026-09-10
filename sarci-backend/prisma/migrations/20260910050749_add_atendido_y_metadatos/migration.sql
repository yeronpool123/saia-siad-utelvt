-- AlterEnum
ALTER TYPE "EstadoTicket" ADD VALUE 'ATENDIDO';

-- AlterTable
ALTER TABLE "tickets" ADD COLUMN     "atendido_en" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "cargo" TEXT,
ADD COLUMN     "carrera" TEXT,
ADD COLUMN     "facultad" TEXT;
