-- Add missing columns to packages table
ALTER TABLE "packages" ADD COLUMN IF NOT EXISTS "image_url" TEXT;

ALTER TABLE "packages" ADD COLUMN IF NOT EXISTS "download_url" TEXT;

ALTER TABLE "packages"
ADD COLUMN IF NOT EXISTS "file_type" VARCHAR(50);

-- Add missing columns to orders table
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "payment_proof" TEXT;

-- Update categories icon column type from VARCHAR(50) to TEXT
ALTER TABLE "categories" ALTER COLUMN "icon" TYPE TEXT;