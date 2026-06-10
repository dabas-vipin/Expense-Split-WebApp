import { MigrationInterface, QueryRunner } from "typeorm";

export class AddGroupSoftDelete1781308800000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable("group");
        if (!table) {
            throw new Error("Group table does not exist");
        }

        const hasDeletedAt = table.columns.find(column => column.name === "deleted_at");
        if (!hasDeletedAt) {
            await queryRunner.query(`ALTER TABLE "group" ADD "deleted_at" TIMESTAMP`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "group" DROP COLUMN IF EXISTS "deleted_at"`);
    }
}
