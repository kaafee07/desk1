-- AlterTable
ALTER TABLE `offices` ADD COLUMN `previousPricePerDay` DECIMAL(10, 2) NULL,
    ADD COLUMN `previousPricePerHour` DECIMAL(10, 2) NULL,
    ADD COLUMN `previousPricePerMonth` DECIMAL(10, 2) NULL,
    ADD COLUMN `previousRenewalPricePerDay` DECIMAL(10, 2) NULL,
    ADD COLUMN `previousRenewalPricePerHour` DECIMAL(10, 2) NULL,
    ADD COLUMN `previousRenewalPricePerMonth` DECIMAL(10, 2) NULL;
