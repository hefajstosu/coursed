-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "unhelpfulCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "ReviewVote" ADD COLUMN     "value" INTEGER NOT NULL DEFAULT 1;
