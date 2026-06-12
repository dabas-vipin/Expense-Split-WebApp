import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Phase 3 expense richness: category, currency, notes columns on `expense`.
 * Sane defaults so existing rows pass NOT NULL checks; UI defaults to
 * "other" + USD when nothing is selected.
 */
export class AddExpenseRichness1781308800003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('expense');
    if (!table) {
      throw new Error('expense table does not exist');
    }

    if (!table.columns.find((c) => c.name === 'category')) {
      await queryRunner.query(
        `ALTER TABLE "expense" ADD "category" varchar NOT NULL DEFAULT 'other'`,
      );
    }
    if (!table.columns.find((c) => c.name === 'currency')) {
      await queryRunner.query(
        `ALTER TABLE "expense" ADD "currency" varchar(3) NOT NULL DEFAULT 'USD'`,
      );
    }
    if (!table.columns.find((c) => c.name === 'notes')) {
      await queryRunner.query(`ALTER TABLE "expense" ADD "notes" text`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "expense" DROP COLUMN IF EXISTS "notes"`);
    await queryRunner.query(`ALTER TABLE "expense" DROP COLUMN IF EXISTS "currency"`);
    await queryRunner.query(`ALTER TABLE "expense" DROP COLUMN IF EXISTS "category"`);
  }
}
