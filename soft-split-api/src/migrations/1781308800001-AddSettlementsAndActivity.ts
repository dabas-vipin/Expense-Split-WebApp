import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSettlementsAndActivity1781308800001
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // --- settlement ---
    const hasSettlement = await queryRunner.hasTable('settlement');
    if (!hasSettlement) {
      await queryRunner.query(`
        CREATE TABLE "settlement" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "amount" numeric(10,2) NOT NULL,
          "note" character varying,
          "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
          "deleted_at" TIMESTAMP,
          "payerId" uuid NOT NULL,
          "payeeId" uuid NOT NULL,
          CONSTRAINT "PK_settlement" PRIMARY KEY ("id"),
          CONSTRAINT "FK_settlement_payer" FOREIGN KEY ("payerId")
            REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
          CONSTRAINT "FK_settlement_payee" FOREIGN KEY ("payeeId")
            REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        )
      `);
      await queryRunner.query(
        `CREATE INDEX "IDX_settlement_payer" ON "settlement" ("payerId")`,
      );
      await queryRunner.query(
        `CREATE INDEX "IDX_settlement_payee" ON "settlement" ("payeeId")`,
      );
    }

    // --- activity_event ---
    const hasActivity = await queryRunner.hasTable('activity_event');
    if (!hasActivity) {
      await queryRunner.query(`
        CREATE TABLE "activity_event" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "type" character varying NOT NULL,
          "payload" jsonb,
          "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
          "actorId" uuid NOT NULL,
          "recipientId" uuid,
          CONSTRAINT "PK_activity_event" PRIMARY KEY ("id"),
          CONSTRAINT "FK_activity_event_actor" FOREIGN KEY ("actorId")
            REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
          CONSTRAINT "FK_activity_event_recipient" FOREIGN KEY ("recipientId")
            REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        )
      `);
      await queryRunner.query(
        `CREATE INDEX "IDX_activity_event_actor" ON "activity_event" ("actorId")`,
      );
      await queryRunner.query(
        `CREATE INDEX "IDX_activity_event_recipient" ON "activity_event" ("recipientId")`,
      );
      await queryRunner.query(
        `CREATE INDEX "IDX_activity_event_created" ON "activity_event" ("createdAt")`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "activity_event"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "settlement"`);
  }
}
