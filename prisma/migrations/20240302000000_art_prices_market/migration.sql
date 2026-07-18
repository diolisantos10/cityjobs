-- One-time update of art creation prices to the market average
-- (single social-media art ~R$50-200; accessible add-on tier chosen).
-- Runs once; future admin edits in /admin/art-prices are preserved.
UPDATE "ArtPriceConfig" SET "priceInCents" = 5990, "updatedAt" = NOW() WHERE "designCount" = 1;
UPDATE "ArtPriceConfig" SET "priceInCents" = 9990, "updatedAt" = NOW() WHERE "designCount" = 2;
