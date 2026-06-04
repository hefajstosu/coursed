-- CreateTable
CREATE TABLE "CourseFollow" (
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CourseFollow_pkey" PRIMARY KEY ("userId","courseId")
);

-- CreateIndex
CREATE INDEX "CourseFollow_courseId_idx" ON "CourseFollow"("courseId");

-- AddForeignKey
ALTER TABLE "CourseFollow" ADD CONSTRAINT "CourseFollow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseFollow" ADD CONSTRAINT "CourseFollow_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "User" ADD COLUMN "slug" TEXT;

-- Backfill: deterministyczny, unikalny slug dla istniejących użytkowników
UPDATE "User" SET "slug" = 'u-' || substr(md5("id"), 1, 12) WHERE "slug" IS NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_slug_key" ON "User"("slug");
