-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "tags" TEXT[];

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "linkedinUrl" TEXT,
ADD COLUMN     "twitterHandle" TEXT,
ADD COLUMN     "websiteUrl" TEXT;
