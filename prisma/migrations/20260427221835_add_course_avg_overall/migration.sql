-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "avgOverall" DOUBLE PRECISION,
ADD COLUMN     "ratingsCount" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Course_avgOverall_idx" ON "Course"("avgOverall");

-- CreateIndex
CREATE INDEX "Course_createdAt_idx" ON "Course"("createdAt");
