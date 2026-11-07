CREATE TABLE `tree_pin` (
	`path` text PRIMARY KEY NOT NULL,
	`pinned_by` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`pinned_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
-- Pins used to be per person: what admins had pinned becomes pinned for everyone.
INSERT OR IGNORE INTO `tree_pin` (`path`, `pinned_by`)
SELECT `page_pin`.`path`, MIN(`page_pin`.`user_id`) FROM `page_pin`
JOIN `user` ON `user`.`id` = `page_pin`.`user_id` WHERE `user`.`role` = 'admin'
GROUP BY `page_pin`.`path`;
--> statement-breakpoint
DROP TABLE `page_pin`;