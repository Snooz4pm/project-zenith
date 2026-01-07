/*
  Warnings:

  - You are about to drop the column `calibrationCompleted` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `emailVerified` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `image` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `last_login` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `password_hash` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `provider` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `tier` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `tradingStyle` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Account` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Activity` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AssetLifetimeScore` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ChartCache` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MarketCandle` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PathDefinition` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PriceHistory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Session` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TimeframeAnalysis` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TradingNote` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserAssetView` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserPathScore` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserPreferences` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserSignalInteraction` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserTrait` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserWatchlist` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `articles` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `badges` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `categories` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `community_comments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `community_follows` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `community_likes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `community_posts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `playing_with_neon` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `product_outcomes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `shared_trades` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `source_stats` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `trading_assets` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `trading_holdings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `trading_pending_orders` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `trading_portfolio_history` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `trading_trades` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `trading_users` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_badges` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_profiles` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_sessions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `zenith_scores` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[walletAddress]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[username]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `walletAddress` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Account" DROP CONSTRAINT "Account_userId_fkey";

-- DropForeignKey
ALTER TABLE "Activity" DROP CONSTRAINT "Activity_userId_fkey";

-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "Session_userId_fkey";

-- DropForeignKey
ALTER TABLE "TradingNote" DROP CONSTRAINT "TradingNote_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserAssetView" DROP CONSTRAINT "UserAssetView_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserPreferences" DROP CONSTRAINT "UserPreferences_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserSignalInteraction" DROP CONSTRAINT "UserSignalInteraction_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserWatchlist" DROP CONSTRAINT "UserWatchlist_userId_fkey";

-- DropIndex
DROP INDEX "User_email_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "calibrationCompleted",
DROP COLUMN "created_at",
DROP COLUMN "email",
DROP COLUMN "emailVerified",
DROP COLUMN "image",
DROP COLUMN "last_login",
DROP COLUMN "name",
DROP COLUMN "password_hash",
DROP COLUMN "provider",
DROP COLUMN "tier",
DROP COLUMN "tradingStyle",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "username" TEXT,
ADD COLUMN     "walletAddress" TEXT NOT NULL;

-- DropTable
DROP TABLE "Account";

-- DropTable
DROP TABLE "Activity";

-- DropTable
DROP TABLE "AssetLifetimeScore";

-- DropTable
DROP TABLE "ChartCache";

-- DropTable
DROP TABLE "MarketCandle";

-- DropTable
DROP TABLE "PathDefinition";

-- DropTable
DROP TABLE "PriceHistory";

-- DropTable
DROP TABLE "Session";

-- DropTable
DROP TABLE "TimeframeAnalysis";

-- DropTable
DROP TABLE "TradingNote";

-- DropTable
DROP TABLE "UserAssetView";

-- DropTable
DROP TABLE "UserPathScore";

-- DropTable
DROP TABLE "UserPreferences";

-- DropTable
DROP TABLE "UserSignalInteraction";

-- DropTable
DROP TABLE "UserTrait";

-- DropTable
DROP TABLE "UserWatchlist";

-- DropTable
DROP TABLE "articles";

-- DropTable
DROP TABLE "badges";

-- DropTable
DROP TABLE "categories";

-- DropTable
DROP TABLE "community_comments";

-- DropTable
DROP TABLE "community_follows";

-- DropTable
DROP TABLE "community_likes";

-- DropTable
DROP TABLE "community_posts";

-- DropTable
DROP TABLE "playing_with_neon";

-- DropTable
DROP TABLE "product_outcomes";

-- DropTable
DROP TABLE "shared_trades";

-- DropTable
DROP TABLE "source_stats";

-- DropTable
DROP TABLE "trading_assets";

-- DropTable
DROP TABLE "trading_holdings";

-- DropTable
DROP TABLE "trading_pending_orders";

-- DropTable
DROP TABLE "trading_portfolio_history";

-- DropTable
DROP TABLE "trading_trades";

-- DropTable
DROP TABLE "trading_users";

-- DropTable
DROP TABLE "user_badges";

-- DropTable
DROP TABLE "user_profiles";

-- DropTable
DROP TABLE "user_sessions";

-- DropTable
DROP TABLE "users";

-- DropTable
DROP TABLE "zenith_scores";

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bio" TEXT,
    "avatar" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "slug" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lesson" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "lastLessonId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "context" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "slug" TEXT NOT NULL,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomJoinRequest" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoomJoinRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SwapReceipt" (
    "id" TEXT NOT NULL,
    "wallet" TEXT NOT NULL,
    "inputMint" TEXT NOT NULL,
    "outputMint" TEXT NOT NULL,
    "inputSymbol" TEXT,
    "outputSymbol" TEXT,
    "inAmount" TEXT NOT NULL,
    "outAmount" TEXT NOT NULL,
    "inAmountUi" DOUBLE PRECISION,
    "outAmountUi" DOUBLE PRECISION,
    "inAmountUsd" DOUBLE PRECISION,
    "outAmountUsd" DOUBLE PRECISION,
    "txid" TEXT NOT NULL,
    "routeType" TEXT,
    "routeHops" INTEGER,
    "slippageBps" INTEGER,
    "priceImpactPct" DOUBLE PRECISION,
    "feeAmount" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "jitoBundle" BOOLEAN NOT NULL DEFAULT false,
    "jitoBundleId" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),

    CONSTRAINT "SwapReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArenaSwap" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "chainName" TEXT,
    "sellToken" TEXT NOT NULL,
    "sellTokenAddress" TEXT NOT NULL,
    "buyToken" TEXT NOT NULL,
    "buyTokenAddress" TEXT NOT NULL,
    "sellAmount" TEXT NOT NULL,
    "buyAmount" TEXT NOT NULL,
    "sellAmountUSD" DOUBLE PRECISION,
    "buyAmountUSD" DOUBLE PRECISION,
    "affiliateFee" DOUBLE PRECISION,
    "affiliateFeeBps" INTEGER,
    "feeToken" TEXT,
    "txHash" TEXT NOT NULL,
    "txStatus" TEXT NOT NULL DEFAULT 'pending',
    "blockNumber" INTEGER,
    "gasUsed" TEXT,
    "gasPrice" TEXT,
    "tokenAge" INTEGER,
    "liquidityUSD" DOUBLE PRECISION,
    "volumeAccel" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),

    CONSTRAINT "ArenaSwap_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Course_slug_key" ON "Course"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "CourseProgress_userId_courseId_key" ON "CourseProgress"("userId", "courseId");

-- CreateIndex
CREATE INDEX "Note_userId_idx" ON "Note"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Room_slug_key" ON "Room"("slug");

-- CreateIndex
CREATE INDEX "Room_slug_idx" ON "Room"("slug");

-- CreateIndex
CREATE INDEX "Room_ownerId_idx" ON "Room"("ownerId");

-- CreateIndex
CREATE INDEX "RoomJoinRequest_roomId_idx" ON "RoomJoinRequest"("roomId");

-- CreateIndex
CREATE INDEX "RoomJoinRequest_userId_idx" ON "RoomJoinRequest"("userId");

-- CreateIndex
CREATE INDEX "RoomJoinRequest_status_idx" ON "RoomJoinRequest"("status");

-- CreateIndex
CREATE UNIQUE INDEX "RoomJoinRequest_roomId_userId_key" ON "RoomJoinRequest"("roomId", "userId");

-- CreateIndex
CREATE INDEX "Post_roomId_idx" ON "Post"("roomId");

-- CreateIndex
CREATE INDEX "Post_userId_idx" ON "Post"("userId");

-- CreateIndex
CREATE INDEX "Post_createdAt_idx" ON "Post"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "Message_roomId_idx" ON "Message"("roomId");

-- CreateIndex
CREATE INDEX "Message_userId_idx" ON "Message"("userId");

-- CreateIndex
CREATE INDEX "Message_createdAt_idx" ON "Message"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "SwapReceipt_txid_key" ON "SwapReceipt"("txid");

-- CreateIndex
CREATE INDEX "SwapReceipt_wallet_idx" ON "SwapReceipt"("wallet");

-- CreateIndex
CREATE INDEX "SwapReceipt_txid_idx" ON "SwapReceipt"("txid");

-- CreateIndex
CREATE INDEX "SwapReceipt_status_idx" ON "SwapReceipt"("status");

-- CreateIndex
CREATE INDEX "SwapReceipt_createdAt_idx" ON "SwapReceipt"("createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "ArenaSwap_txHash_key" ON "ArenaSwap"("txHash");

-- CreateIndex
CREATE INDEX "ArenaSwap_walletAddress_idx" ON "ArenaSwap"("walletAddress");

-- CreateIndex
CREATE INDEX "ArenaSwap_chainId_idx" ON "ArenaSwap"("chainId");

-- CreateIndex
CREATE INDEX "ArenaSwap_txHash_idx" ON "ArenaSwap"("txHash");

-- CreateIndex
CREATE INDEX "ArenaSwap_txStatus_idx" ON "ArenaSwap"("txStatus");

-- CreateIndex
CREATE INDEX "ArenaSwap_createdAt_idx" ON "ArenaSwap"("createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "User_walletAddress_key" ON "User"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_walletAddress_idx" ON "User"("walletAddress");

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseProgress" ADD CONSTRAINT "CourseProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseProgress" ADD CONSTRAINT "CourseProgress_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomJoinRequest" ADD CONSTRAINT "RoomJoinRequest_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomJoinRequest" ADD CONSTRAINT "RoomJoinRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
