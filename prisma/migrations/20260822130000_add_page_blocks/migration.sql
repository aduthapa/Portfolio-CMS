-- CreateTable
CREATE TABLE `page_blocks` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` ENUM('HEADING', 'TEXT', 'IMAGE', 'GALLERY', 'BUTTON', 'DIVIDER', 'VIDEO') NOT NULL,
    `content` JSON NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `visible` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `page_blocks_sortOrder_idx`(`sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

