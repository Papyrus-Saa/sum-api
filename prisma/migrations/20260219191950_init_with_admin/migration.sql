-- CreateSequence
CREATE SEQUENCE IF NOT EXISTS tire_code_seq START WITH 100 INCREMENT BY 1;

-- CreateTable
CREATE TABLE "tire_sizes" (
    "id" TEXT NOT NULL,
    "sizeRaw" TEXT NOT NULL,
    "sizeNormalized" VARCHAR(11) NOT NULL,
    "width" INTEGER NOT NULL,
    "aspectRatio" INTEGER NOT NULL,
    "rimDiameter" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tire_sizes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tire_codes" (
    "id" TEXT NOT NULL,
    "codePublic" TEXT NOT NULL DEFAULT nextval('tire_code_seq')::text,
    "tireSizeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tire_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tire_variants" (
    "id" TEXT NOT NULL,
    "tireSizeId" TEXT NOT NULL,
    "loadIndex" INTEGER,
    "speedIndex" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tire_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_logs" (
    "id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "queryType" TEXT NOT NULL,
    "resultFound" BOOLEAN NOT NULL,
    "ipHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_refresh_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tire_sizes_sizeNormalized_key" ON "tire_sizes"("sizeNormalized");

-- CreateIndex
CREATE UNIQUE INDEX "tire_codes_codePublic_key" ON "tire_codes"("codePublic");

-- CreateIndex
CREATE UNIQUE INDEX "tire_codes_tireSizeId_key" ON "tire_codes"("tireSizeId");

-- CreateIndex
CREATE UNIQUE INDEX "tire_variants_tireSizeId_loadIndex_speedIndex_key" ON "tire_variants"("tireSizeId", "loadIndex", "speedIndex");

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");

-- CreateIndex
CREATE INDEX "admin_refresh_tokens_userId_idx" ON "admin_refresh_tokens"("userId");

-- CreateIndex
CREATE INDEX "admin_refresh_tokens_tokenHash_idx" ON "admin_refresh_tokens"("tokenHash");

-- AddForeignKey
ALTER TABLE "tire_codes" ADD CONSTRAINT "tire_codes_tireSizeId_fkey" FOREIGN KEY ("tireSizeId") REFERENCES "tire_sizes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tire_variants" ADD CONSTRAINT "tire_variants_tireSizeId_fkey" FOREIGN KEY ("tireSizeId") REFERENCES "tire_sizes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_refresh_tokens" ADD CONSTRAINT "admin_refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
