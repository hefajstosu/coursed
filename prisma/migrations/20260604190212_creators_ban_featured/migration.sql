-- CreateEnum
CREATE TYPE "CourseClaimStatus" AS ENUM ('NEW', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "ownerId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "banned" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "CourseClaim" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "note" TEXT,
    "status" "CourseClaimStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseClaim_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CourseClaim_status_idx" ON "CourseClaim"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CourseClaim_courseId_userId_key" ON "CourseClaim"("courseId", "userId");

-- CreateIndex
CREATE INDEX "Course_featured_idx" ON "Course"("featured");

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseClaim" ADD CONSTRAINT "CourseClaim_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseClaim" ADD CONSTRAINT "CourseClaim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
