import { MigrationInterface, QueryRunner } from "typeorm";

export class ApplyExpenseOptimizations1774210604374 implements MigrationInterface {
    name = 'ApplyExpenseOptimizations1774210604374'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "expense" ADD "deleted_at" TIMESTAMP`);
        await queryRunner.query(`CREATE INDEX "IDX_EXPENSE_DATE" ON "expense" ("date")`);
        await queryRunner.query(`CREATE INDEX "IDX_EXPENSE_PAID_BY" ON "expense" ("paidById")`);
        await queryRunner.query(`CREATE INDEX "IDX_EXPENSE_GROUP" ON "expense" ("groupId")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_EXPENSE_GROUP"`);
        await queryRunner.query(`DROP INDEX "IDX_EXPENSE_PAID_BY"`);
        await queryRunner.query(`DROP INDEX "IDX_EXPENSE_DATE"`);
        await queryRunner.query(`ALTER TABLE "expense" DROP COLUMN "deleted_at"`);
    }

}