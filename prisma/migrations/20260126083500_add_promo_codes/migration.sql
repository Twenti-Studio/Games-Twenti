-- Add promo code fields to orders table
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "original_price" DECIMAL(15, 2);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "discount_amount" DECIMAL(15, 2);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "promo_code" VARCHAR(100);

-- CreateTable for promo_codes
CREATE TABLE IF NOT EXISTS "promo_codes" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "discount_type" VARCHAR(20) NOT NULL,
    "discount_value" DECIMAL(15, 2) NOT NULL,
    "min_purchase" DECIMAL(15, 2),
    "max_discount" DECIMAL(15, 2),
    "usage_limit" INTEGER,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promo_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "promo_codes_code_key" ON "promo_codes"("code");
