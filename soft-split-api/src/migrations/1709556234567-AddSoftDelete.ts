import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class AddSoftDelete1709556234567 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if columns exist before adding them
        const hasTable = await queryRunner.hasTable("user");
        if (!hasTable) {
            throw new Error("User table does not exist");
        }

        const table = await queryRunner.getTable("user");
        
        // Check for deleted_at column
        const hasDeletedAt = table.columns.find(column => column.name === "deleted_at");
        if (!hasDeletedAt) {
            await queryRunner.query(`ALTER TABLE "user" ADD "deleted_at" TIMESTAMP`);
        }
        
        // Check for is_active column
        const hasIsActive = table.columns.find(column => column.name === "is_active");
        if (!hasIsActive) {
            await queryRunner.query(`ALTER TABLE "user" ADD "is_active" boolean NOT NULL DEFAULT true`);
        }

        // Drop existing email constraint if exists
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT IF EXISTS "UQ_e12875dfb3b1d92d7d7c5377e22"`);
        
        // Create unique index (will replace if exists)
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_USER_EMAIL_ACTIVE"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_USER_EMAIL_ACTIVE" ON "user" ("email") WHERE deleted_at IS NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_USER_EMAIL_ACTIVE"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN IF EXISTS "deleted_at"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN IF EXISTS "is_active"`);
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email")`);
    }
} 