-- CreateEnum
CREATE TYPE "OrganizationChartType" AS ENUM ('COMPANY', 'BRANCH', 'DIVISION', 'DEPARTMENT', 'TEAM');

-- AlterTable
ALTER TABLE "organizations"
ALTER COLUMN "type" DROP DEFAULT;

ALTER TABLE "organizations"
ALTER COLUMN "type" TYPE "OrganizationChartType"
USING "type"::text::"OrganizationChartType";

ALTER TABLE "organizations"
ALTER COLUMN "type" SET DEFAULT 'DEPARTMENT'::"OrganizationChartType";

-- Drop old enum used by the existing Organization chart schema
DROP TYPE "OrganizationType";

-- CreateTable
CREATE TABLE "organization_types" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "created_by_user_id" TEXT,
    "updated_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_types_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organization_types_name_key"
ON "organization_types"("name");

-- AddForeignKey
ALTER TABLE "organization_types"
ADD CONSTRAINT "organization_types_created_by_user_id_fkey"
FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_types"
ADD CONSTRAINT "organization_types_updated_by_user_id_fkey"
FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
