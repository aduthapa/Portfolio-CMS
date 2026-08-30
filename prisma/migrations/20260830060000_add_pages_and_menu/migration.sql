-- CreateTable
CREATE TABLE `pages` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(190) NOT NULL,
    `title` VARCHAR(190) NOT NULL,
    `isHome` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `pages_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Seed the Home page every existing block gets attached to below, so the
-- current single fixed-page block list becomes that page's content.
INSERT INTO `pages` (`slug`, `title`, `isHome`, `updatedAt`) VALUES ('home', 'Home', true, CURRENT_TIMESTAMP(3));

-- AlterTable
ALTER TABLE `page_blocks` ADD COLUMN `pageId` INTEGER NULL;
UPDATE `page_blocks` SET `pageId` = (SELECT `id` FROM `pages` WHERE `slug` = 'home' LIMIT 1);
ALTER TABLE `page_blocks` MODIFY COLUMN `pageId` INTEGER NOT NULL;

-- DropIndex / CreateIndex (sortOrder index is now scoped per page)
DROP INDEX `page_blocks_sortOrder_idx` ON `page_blocks`;
CREATE INDEX `page_blocks_pageId_sortOrder_idx` ON `page_blocks`(`pageId`, `sortOrder`);

-- AddForeignKey
ALTER TABLE `page_blocks` ADD CONSTRAINT `page_blocks_pageId_fkey` FOREIGN KEY (`pageId`) REFERENCES `pages`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE `menu_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `label` VARCHAR(60) NOT NULL,
    `url` VARCHAR(500) NULL,
    `pageId` INTEGER NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `menu_items_sortOrder_idx`(`sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `menu_items` ADD CONSTRAINT `menu_items_pageId_fkey` FOREIGN KEY (`pageId`) REFERENCES `pages`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed the default nav: Home (linked to the Home page, so renaming/
-- moving it stays in sync) + Contact (a raw URL, since /contact is a
-- fixed form rather than a block-based page).
INSERT INTO `menu_items` (`label`, `pageId`, `sortOrder`, `updatedAt`)
  VALUES ('Home', (SELECT `id` FROM `pages` WHERE `slug` = 'home' LIMIT 1), 0, CURRENT_TIMESTAMP(3));
INSERT INTO `menu_items` (`label`, `url`, `sortOrder`, `updatedAt`)
  VALUES ('Contact', '/contact', 1, CURRENT_TIMESTAMP(3));
