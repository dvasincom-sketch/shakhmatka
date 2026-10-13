import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_articles_factcheck_status" AS ENUM('confirmed', 'changed', 'refuted', 'unverified');
  CREATE TYPE "public"."enum_articles_type" AS ENUM('object', 'developer', 'market', 'regulation', 'architecture');
  CREATE TYPE "public"."enum_articles_review_status" AS ENUM('ready', 'needs_review');
  CREATE TYPE "public"."enum_articles_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__articles_v_version_factcheck_status" AS ENUM('confirmed', 'changed', 'refuted', 'unverified');
  CREATE TYPE "public"."enum__articles_v_version_type" AS ENUM('object', 'developer', 'market', 'regulation', 'architecture');
  CREATE TYPE "public"."enum__articles_v_version_review_status" AS ENUM('ready', 'needs_review');
  CREATE TYPE "public"."enum__articles_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_objects_timeline_kind" AS ENUM('land', 'krt', 'tender', 'concept', 'architecture', 'permit', 'sales', 'price', 'deal', 'construction', 'court', 'other');
  CREATE TYPE "public"."enum_objects_timeline_certainty" AS ENUM('fact', 'signal');
  CREATE TYPE "public"."enum_objects_stage" AS ENUM('land', 'concept', 'architecture', 'permit', 'sales', 'completed');
  CREATE TYPE "public"."enum_objects_class" AS ENUM('comfort', 'business', 'premium', 'deluxe');
  CREATE TYPE "public"."enum_places_kind" AS ENUM('district', 'region');
  CREATE TABLE "articles_topics" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar
  );
  
  CREATE TABLE "articles_keywords" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar
  );
  
  CREATE TABLE "articles_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"q" varchar,
  	"a" varchar
  );
  
  CREATE TABLE "articles_factcheck" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"claim" varchar,
  	"status" "enum_articles_factcheck_status",
  	"source" varchar,
  	"note" varchar
  );
  
  CREATE TABLE "articles_removed" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar
  );
  
  CREATE TABLE "articles" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"lead" varchar,
  	"body" varchar,
  	"hero_image_id" integer,
  	"type" "enum_articles_type",
  	"region" varchar DEFAULT 'moscow',
  	"source_note_id" numeric,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"main_query" varchar,
  	"schema" jsonb,
  	"review_status" "enum_articles_review_status" DEFAULT 'needs_review',
  	"editor_notes" varchar,
  	"date_published" timestamp(3) with time zone,
  	"date_modified" timestamp(3) with time zone,
  	"link_check" varchar,
  	"author" varchar DEFAULT 'Редакция Шахматки',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_articles_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "articles_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer,
  	"objects_id" integer,
  	"developers_id" integer
  );
  
  CREATE TABLE "_articles_v_version_topics" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_articles_v_version_keywords" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_articles_v_version_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"q" varchar,
  	"a" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_articles_v_version_factcheck" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"claim" varchar,
  	"status" "enum__articles_v_version_factcheck_status",
  	"source" varchar,
  	"note" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_articles_v_version_removed" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_articles_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_lead" varchar,
  	"version_body" varchar,
  	"version_hero_image_id" integer,
  	"version_type" "enum__articles_v_version_type",
  	"version_region" varchar DEFAULT 'moscow',
  	"version_source_note_id" numeric,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_main_query" varchar,
  	"version_schema" jsonb,
  	"version_review_status" "enum__articles_v_version_review_status" DEFAULT 'needs_review',
  	"version_editor_notes" varchar,
  	"version_date_published" timestamp(3) with time zone,
  	"version_date_modified" timestamp(3) with time zone,
  	"version_link_check" varchar,
  	"version_author" varchar DEFAULT 'Редакция Шахматки',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__articles_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_articles_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer,
  	"objects_id" integer,
  	"developers_id" integer
  );
  
  CREATE TABLE "objects_aliases" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar
  );
  
  CREATE TABLE "objects_timeline" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"date" timestamp(3) with time zone NOT NULL,
  	"date_label" varchar,
  	"kind" "enum_objects_timeline_kind" DEFAULT 'other',
  	"title" varchar NOT NULL,
  	"text" varchar,
  	"image_id" integer,
  	"certainty" "enum_objects_timeline_certainty" DEFAULT 'fact',
  	"confirmed_on" timestamp(3) with time zone,
  	"source_note" numeric,
  	"verified" boolean
  );
  
  CREATE TABLE "objects_neighbors" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"object_id" integer,
  	"date" timestamp(3) with time zone,
  	"text" varchar,
  	"image_id" integer
  );
  
  CREATE TABLE "objects" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"zu" varchar,
  	"region" varchar DEFAULT 'moscow',
  	"district" varchar,
  	"stage" "enum_objects_stage",
  	"class" "enum_objects_class",
  	"price_from" numeric,
  	"price_m2_from" numeric,
  	"price_as_of" varchar,
  	"price_source" varchar,
  	"completion" varchar,
  	"legal_entity" varchar,
  	"summary" varchar,
  	"developer_id" integer,
  	"last_event_at" timestamp(3) with time zone,
  	"signal_count" numeric,
  	"auto" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "objects_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer,
  	"developers_id" integer
  );
  
  CREATE TABLE "developers_legal_names" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar
  );
  
  CREATE TABLE "developers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"about" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "places" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"name_in" varchar NOT NULL,
  	"kind" "enum_places_kind" DEFAULT 'district' NOT NULL,
  	"key" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"okrug" varchar,
  	"intro" varchar,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"force_index" boolean,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "terms_sources" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"url" varchar
  );
  
  CREATE TABLE "terms" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"term" varchar NOT NULL,
  	"full" varchar,
  	"slug" varchar NOT NULL,
  	"short" varchar NOT NULL,
  	"body" varchar,
  	"published" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"caption" varchar,
  	"credit" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"reset_password_requested_at" timestamp(3) with time zone,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"articles_id" integer,
  	"objects_id" integer,
  	"developers_id" integer,
  	"places_id" integer,
  	"terms_id" integer,
  	"media_id" integer,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "articles_topics" ADD CONSTRAINT "articles_topics_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_keywords" ADD CONSTRAINT "articles_keywords_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_faq" ADD CONSTRAINT "articles_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_factcheck" ADD CONSTRAINT "articles_factcheck_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_removed" ADD CONSTRAINT "articles_removed_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles" ADD CONSTRAINT "articles_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "articles_rels" ADD CONSTRAINT "articles_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_rels" ADD CONSTRAINT "articles_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_rels" ADD CONSTRAINT "articles_rels_objects_fk" FOREIGN KEY ("objects_id") REFERENCES "public"."objects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_rels" ADD CONSTRAINT "articles_rels_developers_fk" FOREIGN KEY ("developers_id") REFERENCES "public"."developers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articles_v_version_topics" ADD CONSTRAINT "_articles_v_version_topics_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_articles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articles_v_version_keywords" ADD CONSTRAINT "_articles_v_version_keywords_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_articles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articles_v_version_faq" ADD CONSTRAINT "_articles_v_version_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_articles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articles_v_version_factcheck" ADD CONSTRAINT "_articles_v_version_factcheck_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_articles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articles_v_version_removed" ADD CONSTRAINT "_articles_v_version_removed_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_articles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articles_v" ADD CONSTRAINT "_articles_v_parent_id_articles_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."articles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_articles_v" ADD CONSTRAINT "_articles_v_version_hero_image_id_media_id_fk" FOREIGN KEY ("version_hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_articles_v_rels" ADD CONSTRAINT "_articles_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_articles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articles_v_rels" ADD CONSTRAINT "_articles_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articles_v_rels" ADD CONSTRAINT "_articles_v_rels_objects_fk" FOREIGN KEY ("objects_id") REFERENCES "public"."objects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articles_v_rels" ADD CONSTRAINT "_articles_v_rels_developers_fk" FOREIGN KEY ("developers_id") REFERENCES "public"."developers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "objects_aliases" ADD CONSTRAINT "objects_aliases_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."objects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "objects_timeline" ADD CONSTRAINT "objects_timeline_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "objects_timeline" ADD CONSTRAINT "objects_timeline_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."objects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "objects_neighbors" ADD CONSTRAINT "objects_neighbors_object_id_objects_id_fk" FOREIGN KEY ("object_id") REFERENCES "public"."objects"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "objects_neighbors" ADD CONSTRAINT "objects_neighbors_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "objects_neighbors" ADD CONSTRAINT "objects_neighbors_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."objects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "objects" ADD CONSTRAINT "objects_developer_id_developers_id_fk" FOREIGN KEY ("developer_id") REFERENCES "public"."developers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "objects_rels" ADD CONSTRAINT "objects_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."objects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "objects_rels" ADD CONSTRAINT "objects_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "objects_rels" ADD CONSTRAINT "objects_rels_developers_fk" FOREIGN KEY ("developers_id") REFERENCES "public"."developers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "developers_legal_names" ADD CONSTRAINT "developers_legal_names_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."developers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "terms_sources" ADD CONSTRAINT "terms_sources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."terms"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_articles_fk" FOREIGN KEY ("articles_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_objects_fk" FOREIGN KEY ("objects_id") REFERENCES "public"."objects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_developers_fk" FOREIGN KEY ("developers_id") REFERENCES "public"."developers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_places_fk" FOREIGN KEY ("places_id") REFERENCES "public"."places"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_terms_fk" FOREIGN KEY ("terms_id") REFERENCES "public"."terms"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "articles_topics_order_idx" ON "articles_topics" USING btree ("_order");
  CREATE INDEX "articles_topics_parent_id_idx" ON "articles_topics" USING btree ("_parent_id");
  CREATE INDEX "articles_keywords_order_idx" ON "articles_keywords" USING btree ("_order");
  CREATE INDEX "articles_keywords_parent_id_idx" ON "articles_keywords" USING btree ("_parent_id");
  CREATE INDEX "articles_faq_order_idx" ON "articles_faq" USING btree ("_order");
  CREATE INDEX "articles_faq_parent_id_idx" ON "articles_faq" USING btree ("_parent_id");
  CREATE INDEX "articles_factcheck_order_idx" ON "articles_factcheck" USING btree ("_order");
  CREATE INDEX "articles_factcheck_parent_id_idx" ON "articles_factcheck" USING btree ("_parent_id");
  CREATE INDEX "articles_removed_order_idx" ON "articles_removed" USING btree ("_order");
  CREATE INDEX "articles_removed_parent_id_idx" ON "articles_removed" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "articles_slug_idx" ON "articles" USING btree ("slug");
  CREATE INDEX "articles_hero_image_idx" ON "articles" USING btree ("hero_image_id");
  CREATE INDEX "articles_updated_at_idx" ON "articles" USING btree ("updated_at");
  CREATE INDEX "articles_created_at_idx" ON "articles" USING btree ("created_at");
  CREATE INDEX "articles__status_idx" ON "articles" USING btree ("_status");
  CREATE INDEX "articles_rels_order_idx" ON "articles_rels" USING btree ("order");
  CREATE INDEX "articles_rels_parent_idx" ON "articles_rels" USING btree ("parent_id");
  CREATE INDEX "articles_rels_path_idx" ON "articles_rels" USING btree ("path");
  CREATE INDEX "articles_rels_media_id_idx" ON "articles_rels" USING btree ("media_id");
  CREATE INDEX "articles_rels_objects_id_idx" ON "articles_rels" USING btree ("objects_id");
  CREATE INDEX "articles_rels_developers_id_idx" ON "articles_rels" USING btree ("developers_id");
  CREATE INDEX "_articles_v_version_topics_order_idx" ON "_articles_v_version_topics" USING btree ("_order");
  CREATE INDEX "_articles_v_version_topics_parent_id_idx" ON "_articles_v_version_topics" USING btree ("_parent_id");
  CREATE INDEX "_articles_v_version_keywords_order_idx" ON "_articles_v_version_keywords" USING btree ("_order");
  CREATE INDEX "_articles_v_version_keywords_parent_id_idx" ON "_articles_v_version_keywords" USING btree ("_parent_id");
  CREATE INDEX "_articles_v_version_faq_order_idx" ON "_articles_v_version_faq" USING btree ("_order");
  CREATE INDEX "_articles_v_version_faq_parent_id_idx" ON "_articles_v_version_faq" USING btree ("_parent_id");
  CREATE INDEX "_articles_v_version_factcheck_order_idx" ON "_articles_v_version_factcheck" USING btree ("_order");
  CREATE INDEX "_articles_v_version_factcheck_parent_id_idx" ON "_articles_v_version_factcheck" USING btree ("_parent_id");
  CREATE INDEX "_articles_v_version_removed_order_idx" ON "_articles_v_version_removed" USING btree ("_order");
  CREATE INDEX "_articles_v_version_removed_parent_id_idx" ON "_articles_v_version_removed" USING btree ("_parent_id");
  CREATE INDEX "_articles_v_parent_idx" ON "_articles_v" USING btree ("parent_id");
  CREATE INDEX "_articles_v_version_version_slug_idx" ON "_articles_v" USING btree ("version_slug");
  CREATE INDEX "_articles_v_version_version_hero_image_idx" ON "_articles_v" USING btree ("version_hero_image_id");
  CREATE INDEX "_articles_v_version_version_updated_at_idx" ON "_articles_v" USING btree ("version_updated_at");
  CREATE INDEX "_articles_v_version_version_created_at_idx" ON "_articles_v" USING btree ("version_created_at");
  CREATE INDEX "_articles_v_version_version__status_idx" ON "_articles_v" USING btree ("version__status");
  CREATE INDEX "_articles_v_created_at_idx" ON "_articles_v" USING btree ("created_at");
  CREATE INDEX "_articles_v_updated_at_idx" ON "_articles_v" USING btree ("updated_at");
  CREATE INDEX "_articles_v_latest_idx" ON "_articles_v" USING btree ("latest");
  CREATE INDEX "_articles_v_rels_order_idx" ON "_articles_v_rels" USING btree ("order");
  CREATE INDEX "_articles_v_rels_parent_idx" ON "_articles_v_rels" USING btree ("parent_id");
  CREATE INDEX "_articles_v_rels_path_idx" ON "_articles_v_rels" USING btree ("path");
  CREATE INDEX "_articles_v_rels_media_id_idx" ON "_articles_v_rels" USING btree ("media_id");
  CREATE INDEX "_articles_v_rels_objects_id_idx" ON "_articles_v_rels" USING btree ("objects_id");
  CREATE INDEX "_articles_v_rels_developers_id_idx" ON "_articles_v_rels" USING btree ("developers_id");
  CREATE INDEX "objects_aliases_order_idx" ON "objects_aliases" USING btree ("_order");
  CREATE INDEX "objects_aliases_parent_id_idx" ON "objects_aliases" USING btree ("_parent_id");
  CREATE INDEX "objects_timeline_order_idx" ON "objects_timeline" USING btree ("_order");
  CREATE INDEX "objects_timeline_parent_id_idx" ON "objects_timeline" USING btree ("_parent_id");
  CREATE INDEX "objects_timeline_image_idx" ON "objects_timeline" USING btree ("image_id");
  CREATE INDEX "objects_neighbors_order_idx" ON "objects_neighbors" USING btree ("_order");
  CREATE INDEX "objects_neighbors_parent_id_idx" ON "objects_neighbors" USING btree ("_parent_id");
  CREATE INDEX "objects_neighbors_object_idx" ON "objects_neighbors" USING btree ("object_id");
  CREATE INDEX "objects_neighbors_image_idx" ON "objects_neighbors" USING btree ("image_id");
  CREATE UNIQUE INDEX "objects_slug_idx" ON "objects" USING btree ("slug");
  CREATE INDEX "objects_developer_idx" ON "objects" USING btree ("developer_id");
  CREATE INDEX "objects_last_event_at_idx" ON "objects" USING btree ("last_event_at");
  CREATE INDEX "objects_updated_at_idx" ON "objects" USING btree ("updated_at");
  CREATE INDEX "objects_created_at_idx" ON "objects" USING btree ("created_at");
  CREATE INDEX "objects_rels_order_idx" ON "objects_rels" USING btree ("order");
  CREATE INDEX "objects_rels_parent_idx" ON "objects_rels" USING btree ("parent_id");
  CREATE INDEX "objects_rels_path_idx" ON "objects_rels" USING btree ("path");
  CREATE INDEX "objects_rels_media_id_idx" ON "objects_rels" USING btree ("media_id");
  CREATE INDEX "objects_rels_developers_id_idx" ON "objects_rels" USING btree ("developers_id");
  CREATE INDEX "developers_legal_names_order_idx" ON "developers_legal_names" USING btree ("_order");
  CREATE INDEX "developers_legal_names_parent_id_idx" ON "developers_legal_names" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "developers_slug_idx" ON "developers" USING btree ("slug");
  CREATE INDEX "developers_updated_at_idx" ON "developers" USING btree ("updated_at");
  CREATE INDEX "developers_created_at_idx" ON "developers" USING btree ("created_at");
  CREATE UNIQUE INDEX "places_key_idx" ON "places" USING btree ("key");
  CREATE UNIQUE INDEX "places_slug_idx" ON "places" USING btree ("slug");
  CREATE INDEX "places_updated_at_idx" ON "places" USING btree ("updated_at");
  CREATE INDEX "places_created_at_idx" ON "places" USING btree ("created_at");
  CREATE INDEX "terms_sources_order_idx" ON "terms_sources" USING btree ("_order");
  CREATE INDEX "terms_sources_parent_id_idx" ON "terms_sources" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "terms_slug_idx" ON "terms" USING btree ("slug");
  CREATE INDEX "terms_updated_at_idx" ON "terms" USING btree ("updated_at");
  CREATE INDEX "terms_created_at_idx" ON "terms" USING btree ("created_at");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_articles_id_idx" ON "payload_locked_documents_rels" USING btree ("articles_id");
  CREATE INDEX "payload_locked_documents_rels_objects_id_idx" ON "payload_locked_documents_rels" USING btree ("objects_id");
  CREATE INDEX "payload_locked_documents_rels_developers_id_idx" ON "payload_locked_documents_rels" USING btree ("developers_id");
  CREATE INDEX "payload_locked_documents_rels_places_id_idx" ON "payload_locked_documents_rels" USING btree ("places_id");
  CREATE INDEX "payload_locked_documents_rels_terms_id_idx" ON "payload_locked_documents_rels" USING btree ("terms_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "articles_topics" CASCADE;
  DROP TABLE "articles_keywords" CASCADE;
  DROP TABLE "articles_faq" CASCADE;
  DROP TABLE "articles_factcheck" CASCADE;
  DROP TABLE "articles_removed" CASCADE;
  DROP TABLE "articles" CASCADE;
  DROP TABLE "articles_rels" CASCADE;
  DROP TABLE "_articles_v_version_topics" CASCADE;
  DROP TABLE "_articles_v_version_keywords" CASCADE;
  DROP TABLE "_articles_v_version_faq" CASCADE;
  DROP TABLE "_articles_v_version_factcheck" CASCADE;
  DROP TABLE "_articles_v_version_removed" CASCADE;
  DROP TABLE "_articles_v" CASCADE;
  DROP TABLE "_articles_v_rels" CASCADE;
  DROP TABLE "objects_aliases" CASCADE;
  DROP TABLE "objects_timeline" CASCADE;
  DROP TABLE "objects_neighbors" CASCADE;
  DROP TABLE "objects" CASCADE;
  DROP TABLE "objects_rels" CASCADE;
  DROP TABLE "developers_legal_names" CASCADE;
  DROP TABLE "developers" CASCADE;
  DROP TABLE "places" CASCADE;
  DROP TABLE "terms_sources" CASCADE;
  DROP TABLE "terms" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TYPE "public"."enum_articles_factcheck_status";
  DROP TYPE "public"."enum_articles_type";
  DROP TYPE "public"."enum_articles_review_status";
  DROP TYPE "public"."enum_articles_status";
  DROP TYPE "public"."enum__articles_v_version_factcheck_status";
  DROP TYPE "public"."enum__articles_v_version_type";
  DROP TYPE "public"."enum__articles_v_version_review_status";
  DROP TYPE "public"."enum__articles_v_version_status";
  DROP TYPE "public"."enum_objects_timeline_kind";
  DROP TYPE "public"."enum_objects_timeline_certainty";
  DROP TYPE "public"."enum_objects_stage";
  DROP TYPE "public"."enum_objects_class";
  DROP TYPE "public"."enum_places_kind";`)
}
