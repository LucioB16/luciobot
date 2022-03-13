/*
  Warnings:

  - Added the required column `lastMessageId` to the `Poll` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Poll" ADD COLUMN     "lastMessageId" TEXT NOT NULL;
