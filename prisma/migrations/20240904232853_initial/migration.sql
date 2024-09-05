/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Policy` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `name` to the `Policy` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Policy" ADD COLUMN     "name" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Policy_name_key" ON "Policy"("name");
