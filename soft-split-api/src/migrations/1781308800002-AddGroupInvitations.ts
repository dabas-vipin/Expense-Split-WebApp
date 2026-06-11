import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGroupInvitations1781308800002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const exists = await queryRunner.hasTable('group_invitation');
    if (!exists) {
      await queryRunner.query(`
        CREATE TABLE "group_invitation" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "status" character varying NOT NULL DEFAULT 'pending',
          "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
          "respondedAt" TIMESTAMP,
          "groupId" uuid NOT NULL,
          "inviterId" uuid NOT NULL,
          "inviteeId" uuid NOT NULL,
          CONSTRAINT "PK_group_invitation" PRIMARY KEY ("id"),
          CONSTRAINT "FK_group_invitation_group" FOREIGN KEY ("groupId")
            REFERENCES "group"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
          CONSTRAINT "FK_group_invitation_inviter" FOREIGN KEY ("inviterId")
            REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
          CONSTRAINT "FK_group_invitation_invitee" FOREIGN KEY ("inviteeId")
            REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        )
      `);
      await queryRunner.query(
        `CREATE INDEX "IDX_group_invitation_invitee_status" ON "group_invitation" ("inviteeId", "status")`,
      );
      await queryRunner.query(
        `CREATE INDEX "IDX_group_invitation_group_status" ON "group_invitation" ("groupId", "status")`,
      );
      // Partial unique constraint: at most one pending invitation per
      // (group, invitee). Keeps duplicate invites from racing in.
      await queryRunner.query(
        `CREATE UNIQUE INDEX "UQ_group_invitation_pending" ON "group_invitation" ("groupId", "inviteeId") WHERE status = 'pending'`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "group_invitation"`);
  }
}
