CREATE TABLE `illust_tags` (
	`id` integer PRIMARY KEY NOT NULL,
	`illust_id` integer NOT NULL,
	`tag_id` integer NOT NULL,
	FOREIGN KEY (`illust_id`) REFERENCES `illusts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `illust_tags_id_unique` ON `illust_tags` (`id`);--> statement-breakpoint
CREATE INDEX `illust_tag_illust_id_idx` ON `illust_tags` (`illust_id`);--> statement-breakpoint
CREATE INDEX `illust_tag_tag_id_idx` ON `illust_tags` (`tag_id`);--> statement-breakpoint
CREATE INDEX `illust_tag_composite_idx` ON `illust_tags` (`illust_id`,`tag_id`);--> statement-breakpoint
CREATE TABLE `illust_users` (
	`id` integer PRIMARY KEY NOT NULL,
	`illust_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	FOREIGN KEY (`illust_id`) REFERENCES `illusts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `illust_users_id_unique` ON `illust_users` (`id`);--> statement-breakpoint
CREATE INDEX `illust_user_illust_id_idx` ON `illust_users` (`illust_id`);--> statement-breakpoint
CREATE INDEX `illust_user_user_id_idx` ON `illust_users` (`user_id`);--> statement-breakpoint
CREATE INDEX `illust_user_composite_idx` ON `illust_users` (`illust_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `illusts` (
	`id` integer PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`type` text NOT NULL,
	`caption` text NOT NULL,
	`create_date` text NOT NULL,
	`page_count` integer NOT NULL,
	`width` integer NOT NULL,
	`height` integer NOT NULL,
	`sanity_level` integer NOT NULL,
	`total_view` integer NOT NULL,
	`total_bookmarks` integer NOT NULL,
	`is_bookmarked` integer NOT NULL,
	`visible` integer NOT NULL,
	`x_restrict` integer NOT NULL,
	`is_muted` integer NOT NULL,
	`total_comments` integer DEFAULT 0 NOT NULL,
	`illust_ai_type` integer NOT NULL,
	`illust_book_style` integer NOT NULL,
	`restrict` integer NOT NULL,
	`bookmark_private` integer NOT NULL,
	`image_urls` text NOT NULL,
	`meta_single_page` text NOT NULL,
	`meta_pages` text NOT NULL,
	`tools` text NOT NULL,
	`url` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `illusts_id_unique` ON `illusts` (`id`);--> statement-breakpoint
CREATE INDEX `page_count_idx` ON `illusts` (`page_count`);--> statement-breakpoint
CREATE INDEX `width_idx` ON `illusts` (`width`);--> statement-breakpoint
CREATE INDEX `height_idx` ON `illusts` (`height`);--> statement-breakpoint
CREATE INDEX `is_bookmarked_idx` ON `illusts` (`is_bookmarked`);--> statement-breakpoint
CREATE INDEX `visible_idx` ON `illusts` (`visible`);--> statement-breakpoint
CREATE INDEX `x_restrict_idx` ON `illusts` (`x_restrict`);--> statement-breakpoint
CREATE INDEX `create_date_idx` ON `illusts` (`create_date`);--> statement-breakpoint
CREATE INDEX `illust_ai_type_idx` ON `illusts` (`illust_ai_type`);--> statement-breakpoint
CREATE TABLE `tags` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`translated_name` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tags_id_unique` ON `tags` (`id`);--> statement-breakpoint
CREATE UNIQUE INDEX `tags_name_unique` ON `tags` (`name`);--> statement-breakpoint
CREATE INDEX `tag_name_idx` ON `tags` (`name`);--> statement-breakpoint
CREATE INDEX `tag_translated_name_idx` ON `tags` (`translated_name`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`account` text NOT NULL,
	`profile_image_urls` text NOT NULL,
	`is_followed` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_id_unique` ON `users` (`id`);--> statement-breakpoint
CREATE INDEX `user_name_idx` ON `users` (`name`);--> statement-breakpoint
CREATE INDEX `user_account_idx` ON `users` (`account`);