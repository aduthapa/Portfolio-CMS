-- AlterTable
ALTER TABLE `portfolio_items` MODIFY `mediaUrl` TEXT NOT NULL,
    MODIFY `thumbnailUrl` TEXT NULL;

-- AlterTable
ALTER TABLE `profiles` MODIFY `avatarUrl` TEXT NULL,
    MODIFY `coverImageUrl` TEXT NULL;

-- AlterTable
ALTER TABLE `site_settings` MODIFY `logoUrl` TEXT NULL,
    MODIFY `faviconUrl` TEXT NULL;
