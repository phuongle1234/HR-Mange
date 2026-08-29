-- CreateEnum
CREATE TYPE "WorkflowStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "WorkflowRequestStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'NEEDS_REVISION', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "WorkflowAction" AS ENUM ('SUBMIT', 'RESUBMIT', 'REVIEW', 'APPROVE', 'FEEDBACK', 'REJECT', 'CANCEL');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('WORKFLOW_REQUEST_SUBMITTED', 'WORKFLOW_REQUEST_APPROVED', 'WORKFLOW_REQUEST_FEEDBACK', 'WORKFLOW_REQUEST_REJECTED', 'WORKFLOW_REQUEST_COMPLETED', 'WORKFLOW_REQUEST_CANCELLED');

-- CreateTable
CREATE TABLE "workflows" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "form_schema" JSONB NOT NULL,
    "status" "WorkflowStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_steps" (
    "id" TEXT NOT NULL,
    "workflow_id" TEXT NOT NULL,
    "parent_id" TEXT,
    "name" VARCHAR(255) NOT NULL,
    "organization_type_id" TEXT NOT NULL,
    "step_order" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_requests" (
    "id" TEXT NOT NULL,
    "workflow_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "current_step_id" TEXT,
    "status" "WorkflowRequestStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "form_data" JSONB NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 0,
    "submitted_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_histories" (
    "id" TEXT NOT NULL,
    "workflow_request_id" TEXT NOT NULL,
    "workflow_step_id" TEXT,
    "employee_id" TEXT NOT NULL,
    "action" "WorkflowAction" NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "recipient_employee_id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "reference_id" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "workflows_code_key" ON "workflows"("code");

-- CreateIndex
CREATE INDEX "workflows_status_idx" ON "workflows"("status");

-- CreateIndex
CREATE INDEX "workflow_steps_workflow_id_idx" ON "workflow_steps"("workflow_id");

-- CreateIndex
CREATE INDEX "workflow_steps_parent_id_idx" ON "workflow_steps"("parent_id");

-- CreateIndex
CREATE INDEX "workflow_steps_organization_type_id_idx" ON "workflow_steps"("organization_type_id");

-- CreateIndex
CREATE INDEX "workflow_requests_employee_id_idx" ON "workflow_requests"("employee_id");

-- CreateIndex
CREATE INDEX "workflow_requests_current_step_id_idx" ON "workflow_requests"("current_step_id");

-- CreateIndex
CREATE INDEX "workflow_requests_status_idx" ON "workflow_requests"("status");

-- CreateIndex
CREATE INDEX "workflow_requests_workflow_id_idx" ON "workflow_requests"("workflow_id");

-- CreateIndex
CREATE INDEX "workflow_histories_workflow_request_id_idx" ON "workflow_histories"("workflow_request_id");

-- CreateIndex
CREATE INDEX "workflow_histories_workflow_request_id_created_at_idx" ON "workflow_histories"("workflow_request_id", "created_at");

-- CreateIndex
CREATE INDEX "notifications_recipient_employee_id_idx" ON "notifications"("recipient_employee_id");

-- CreateIndex
CREATE INDEX "notifications_recipient_employee_id_is_read_idx" ON "notifications"("recipient_employee_id", "is_read");

-- AddForeignKey
ALTER TABLE "workflows" ADD CONSTRAINT "workflows_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_steps" ADD CONSTRAINT "workflow_steps_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_steps" ADD CONSTRAINT "workflow_steps_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "workflow_steps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_steps" ADD CONSTRAINT "workflow_steps_organization_type_id_fkey" FOREIGN KEY ("organization_type_id") REFERENCES "organization_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_requests" ADD CONSTRAINT "workflow_requests_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "workflows"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_requests" ADD CONSTRAINT "workflow_requests_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_requests" ADD CONSTRAINT "workflow_requests_current_step_id_fkey" FOREIGN KEY ("current_step_id") REFERENCES "workflow_steps"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_histories" ADD CONSTRAINT "workflow_histories_workflow_request_id_fkey" FOREIGN KEY ("workflow_request_id") REFERENCES "workflow_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_histories" ADD CONSTRAINT "workflow_histories_workflow_step_id_fkey" FOREIGN KEY ("workflow_step_id") REFERENCES "workflow_steps"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_histories" ADD CONSTRAINT "workflow_histories_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_employee_id_fkey" FOREIGN KEY ("recipient_employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
