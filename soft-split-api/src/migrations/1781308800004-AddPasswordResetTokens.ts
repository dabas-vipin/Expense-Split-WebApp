import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPasswordResetTokens1781308800004 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const exists = await queryRunner.hasTable('password_reset_token');
    if (!exists) {
      await queryRunner.query(`
        CREATE TABLE "password_reset_token" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "token" varchar NOT NULL,
          "expiresAt" timestamp NOT NULL,
          "used" boolean NOT NULL DEFAULT false,
          "createdAt" timestamp NOT NULL DEFAULT now(),
          "userId" uuid NOT NULL,
          CONSTRAINT "PK_password_reset_token" PRIMARY KEY ("id"),
          CONSTRAINT "UQ_password_reset_token_token" UNIQUE ("token"),
          CONSTRAINT "FK_password_reset_token_user" FOREIGN KEY ("userId")
            REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        )
      `);
      await queryRunner.query(
        `CREATE INDEX "IDX_password_reset_token_user" ON "password_reset_token" ("userId")`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "password_reset_token"`);
  }
}
