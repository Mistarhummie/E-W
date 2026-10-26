import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_badges_group" ADD VALUE 'extra';
  CREATE TABLE "badges_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"categories_id" integer
  );
  
  ALTER TABLE "products" ADD COLUMN "league_badges" boolean DEFAULT true;
  ALTER TABLE "badges_rels" ADD CONSTRAINT "badges_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."badges"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "badges_rels" ADD CONSTRAINT "badges_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "badges_rels_order_idx" ON "badges_rels" USING btree ("order");
  CREATE INDEX "badges_rels_parent_idx" ON "badges_rels" USING btree ("parent_id");
  CREATE INDEX "badges_rels_path_idx" ON "badges_rels" USING btree ("path");
  CREATE INDEX "badges_rels_categories_id_idx" ON "badges_rels" USING btree ("categories_id");
  CREATE UNIQUE INDEX "badges_name_idx" ON "badges" USING btree ("name");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "badges_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "badges_rels" CASCADE;
  ALTER TABLE "badges" ALTER COLUMN "group" SET DATA TYPE text;
  ALTER TABLE "badges" ALTER COLUMN "group" SET DEFAULT 'league'::text;
  DROP TYPE "public"."enum_badges_group";
  CREATE TYPE "public"."enum_badges_group" AS ENUM('league', 'competition');
  ALTER TABLE "badges" ALTER COLUMN "group" SET DEFAULT 'league'::"public"."enum_badges_group";
  ALTER TABLE "badges" ALTER COLUMN "group" SET DATA TYPE "public"."enum_badges_group" USING "group"::"public"."enum_badges_group";
  DROP INDEX "badges_name_idx";
  ALTER TABLE "products" DROP COLUMN "league_badges";`)
}
