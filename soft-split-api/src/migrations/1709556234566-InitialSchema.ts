import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1709556234566 implements MigrationInterface {
    name = 'InitialSchema1709556234566'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "group" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_256aa0fda9b1de1a73ee0b7106b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "expense" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "description" character varying NOT NULL, "amount" numeric(10,2) NOT NULL, "date" TIMESTAMP NOT NULL, "splitType" character varying NOT NULL DEFAULT 'equal', "splitDetails" json, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "paidById" uuid, "groupId" uuid, CONSTRAINT "PK_edd925b450e13ea36197c9590fc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "deleted_at" TIMESTAMP, "email" character varying NOT NULL, "password" character varying NOT NULL, "avatar" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "isAdmin" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_USER_EMAIL_ACTIVE" ON "user" ("email") WHERE deleted_at IS NULL`);
        await queryRunner.query(`CREATE TABLE "friend_request" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "status" character varying NOT NULL DEFAULT 'pending', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "senderId" uuid, "receiverId" uuid, CONSTRAINT "PK_4c9d23ff394888750cf66cac17c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "group_members_user" ("groupId" uuid NOT NULL, "userId" uuid NOT NULL, CONSTRAINT "PK_7170c9a27e7b823d391d9e11f2e" PRIMARY KEY ("groupId", "userId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_bfa303089d367a2e3c02b002b8" ON "group_members_user" ("groupId") `);
        await queryRunner.query(`CREATE INDEX "IDX_427107c650638bcb2f1e167d2e" ON "group_members_user" ("userId") `);
        await queryRunner.query(`CREATE TABLE "expense_participants_user" ("expenseId" uuid NOT NULL, "userId" uuid NOT NULL, CONSTRAINT "PK_fe7a05c694145bcae6354d490f2" PRIMARY KEY ("expenseId", "userId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_1de68b4e25bae8f3f9eed64a87" ON "expense_participants_user" ("expenseId") `);
        await queryRunner.query(`CREATE INDEX "IDX_902352c7e2efabfc0af00d3f7a" ON "expense_participants_user" ("userId") `);
        await queryRunner.query(`CREATE TABLE "user_expenses_involved_expense" ("userId" uuid NOT NULL, "expenseId" uuid NOT NULL, CONSTRAINT "PK_68e644c4284476fd9abd00517d8" PRIMARY KEY ("userId", "expenseId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_4e2aa9d9b76a8273b75e914f78" ON "user_expenses_involved_expense" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_a55cb01be7942377269a77f8ec" ON "user_expenses_involved_expense" ("expenseId") `);
        await queryRunner.query(`CREATE TABLE "user_friends_user" ("userId_1" uuid NOT NULL, "userId_2" uuid NOT NULL, CONSTRAINT "PK_f2b5631d91f6b7fda632135932f" PRIMARY KEY ("userId_1", "userId_2"))`);
        await queryRunner.query(`CREATE INDEX "IDX_04840fd160b733de706a336013" ON "user_friends_user" ("userId_1") `);
        await queryRunner.query(`CREATE INDEX "IDX_e81f236c989f3fd54836b50a12" ON "user_friends_user" ("userId_2") `);
        await queryRunner.query(`ALTER TABLE "expense" ADD CONSTRAINT "FK_11747f69e8441abcbaabd7c259f" FOREIGN KEY ("paidById") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "expense" ADD CONSTRAINT "FK_3e5276c441c4db9113773113136" FOREIGN KEY ("groupId") REFERENCES "group"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "friend_request" ADD CONSTRAINT "FK_9509b72f50f495668bae3c0171c" FOREIGN KEY ("senderId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "friend_request" ADD CONSTRAINT "FK_470e723fdad9d6f4981ab2481eb" FOREIGN KEY ("receiverId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "group_members_user" ADD CONSTRAINT "FK_bfa303089d367a2e3c02b002b8f" FOREIGN KEY ("groupId") REFERENCES "group"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "group_members_user" ADD CONSTRAINT "FK_427107c650638bcb2f1e167d2e5" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "expense_participants_user" ADD CONSTRAINT "FK_1de68b4e25bae8f3f9eed64a87c" FOREIGN KEY ("expenseId") REFERENCES "expense"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "expense_participants_user" ADD CONSTRAINT "FK_902352c7e2efabfc0af00d3f7a1" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "user_expenses_involved_expense" ADD CONSTRAINT "FK_4e2aa9d9b76a8273b75e914f786" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "user_expenses_involved_expense" ADD CONSTRAINT "FK_a55cb01be7942377269a77f8ec9" FOREIGN KEY ("expenseId") REFERENCES "expense"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "user_friends_user" ADD CONSTRAINT "FK_04840fd160b733de706a3360134" FOREIGN KEY ("userId_1") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "user_friends_user" ADD CONSTRAINT "FK_e81f236c989f3fd54836b50a12d" FOREIGN KEY ("userId_2") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_friends_user" DROP CONSTRAINT "FK_e81f236c989f3fd54836b50a12d"`);
        await queryRunner.query(`ALTER TABLE "user_friends_user" DROP CONSTRAINT "FK_04840fd160b733de706a3360134"`);
        await queryRunner.query(`ALTER TABLE "user_expenses_involved_expense" DROP CONSTRAINT "FK_a55cb01be7942377269a77f8ec9"`);
        await queryRunner.query(`ALTER TABLE "user_expenses_involved_expense" DROP CONSTRAINT "FK_4e2aa9d9b76a8273b75e914f786"`);
        await queryRunner.query(`ALTER TABLE "expense_participants_user" DROP CONSTRAINT "FK_902352c7e2efabfc0af00d3f7a1"`);
        await queryRunner.query(`ALTER TABLE "expense_participants_user" DROP CONSTRAINT "FK_1de68b4e25bae8f3f9eed64a87c"`);
        await queryRunner.query(`ALTER TABLE "group_members_user" DROP CONSTRAINT "FK_427107c650638bcb2f1e167d2e5"`);
        await queryRunner.query(`ALTER TABLE "group_members_user" DROP CONSTRAINT "FK_bfa303089d367a2e3c02b002b8f"`);
        await queryRunner.query(`ALTER TABLE "friend_request" DROP CONSTRAINT "FK_470e723fdad9d6f4981ab2481eb"`);
        await queryRunner.query(`ALTER TABLE "friend_request" DROP CONSTRAINT "FK_9509b72f50f495668bae3c0171c"`);
        await queryRunner.query(`ALTER TABLE "expense" DROP CONSTRAINT "FK_3e5276c441c4db9113773113136"`);
        await queryRunner.query(`ALTER TABLE "expense" DROP CONSTRAINT "FK_11747f69e8441abcbaabd7c259f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e81f236c989f3fd54836b50a12"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_04840fd160b733de706a336013"`);
        await queryRunner.query(`DROP TABLE "user_friends_user"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a55cb01be7942377269a77f8ec"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4e2aa9d9b76a8273b75e914f78"`);
        await queryRunner.query(`DROP TABLE "user_expenses_involved_expense"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_902352c7e2efabfc0af00d3f7a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1de68b4e25bae8f3f9eed64a87"`);
        await queryRunner.query(`DROP TABLE "expense_participants_user"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_427107c650638bcb2f1e167d2e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bfa303089d367a2e3c02b002b8"`);
        await queryRunner.query(`DROP TABLE "group_members_user"`);
        await queryRunner.query(`DROP TABLE "friend_request"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_USER_EMAIL_ACTIVE"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TABLE "expense"`);
        await queryRunner.query(`DROP TABLE "group"`);
    }

}
