CREATE TABLE `products` (
	`id` integer PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`handle` text NOT NULL,
	`vendor` text NOT NULL,
	`start` integer,
	`end` integer
);

CREATE TABLE `products_to_tags` (
	`product_id` integer NOT NULL,
	`tag_id` integer NOT NULL,
	PRIMARY KEY(`product_id`, `tag_id`),
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE no action
);

CREATE TABLE `tags` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text
);

CREATE INDEX `period_idx` ON `products` (`start`,`end`);
CREATE UNIQUE INDEX `name_idx` ON `tags` (`name`);