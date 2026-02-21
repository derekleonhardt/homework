-- CreateTable
CREATE TABLE "items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'article',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "description" TEXT DEFAULT '',
    "image_url" TEXT,
    "image_width" INTEGER,
    "image_height" INTEGER,
    "favicon_url" TEXT,
    "site_name" TEXT,
    "author" TEXT,
    "published_at" DATETIME,
    "word_count" INTEGER,
    "reading_time" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'inbox',
    "metadata_status" TEXT NOT NULL DEFAULT 'pending',
    "enrichment_source" TEXT,
    "raw_input" TEXT NOT NULL,
    "page_count" INTEGER
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6b7280',
    "is_auto_generated" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "item_tags" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "item_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,
    "is_auto_generated" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "item_tags_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "item_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "items_url_key" ON "items"("url");

-- CreateIndex
CREATE INDEX "items_created_at_idx" ON "items"("created_at");

-- CreateIndex
CREATE INDEX "items_status_created_at_idx" ON "items"("status", "created_at");

-- CreateIndex
CREATE INDEX "items_type_created_at_idx" ON "items"("type", "created_at");

-- CreateIndex
CREATE INDEX "items_published_at_idx" ON "items"("published_at");

-- CreateIndex
CREATE INDEX "items_reading_time_idx" ON "items"("reading_time");

-- CreateIndex
CREATE UNIQUE INDEX "items_type_raw_input_key" ON "items"("type", "raw_input");

-- CreateIndex
CREATE UNIQUE INDEX "tags_slug_key" ON "tags"("slug");

-- CreateIndex
CREATE INDEX "item_tags_tag_id_idx" ON "item_tags"("tag_id");

-- CreateIndex
CREATE UNIQUE INDEX "item_tags_item_id_tag_id_key" ON "item_tags"("item_id", "tag_id");


