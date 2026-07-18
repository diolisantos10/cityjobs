-- Art creation prices lowered ~30% from the market-average tier.
-- 1 art: R$59,90 -> R$41,90 ; 2 arts: R$99,90 -> R$69,90.
-- One-time; admin edits in /admin/art-prices remain authoritative afterwards.
UPDATE "ArtPriceConfig" SET "priceInCents" = 4190, "updatedAt" = NOW() WHERE "designCount" = 1;
UPDATE "ArtPriceConfig" SET "priceInCents" = 6990, "updatedAt" = NOW() WHERE "designCount" = 2;
