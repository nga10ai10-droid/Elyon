CREATE TABLE `addresses` (
	`user_id` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	`updated` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `bag_lines` (
	`bag_id` text NOT NULL,
	`sku` text NOT NULL,
	`quantity` integer NOT NULL,
	FOREIGN KEY (`bag_id`) REFERENCES `bags`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`sku`) REFERENCES `inventory`(`sku`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "bag_quantity" CHECK("bag_lines"."quantity" BETWEEN 1 AND 10)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bag_sku` ON `bag_lines` (`bag_id`,`sku`);--> statement-breakpoint
CREATE TABLE `bags` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`updated` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `bags_user` ON `bags` (`user_id`);--> statement-breakpoint
CREATE TABLE `catalog` (
	`id` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	`updated` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `inventory` (
	`sku` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`color` text NOT NULL,
	`size` text NOT NULL,
	`stock` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `catalog`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "stock_nonnegative" CHECK("inventory"."stock" >= 0)
);
--> statement-breakpoint
CREATE TABLE `rate_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`topic` text NOT NULL,
	`message` text NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `order_lines` (
	`order_id` text NOT NULL,
	`sku` text NOT NULL,
	`name` text NOT NULL,
	`quantity` integer NOT NULL,
	`unit_price` integer NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`sku`) REFERENCES `inventory`(`sku`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `order_sku` ON `order_lines` (`order_id`,`sku`);--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`bag_id` text NOT NULL,
	`user_id` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`total` integer NOT NULL,
	`shipping` integer NOT NULL,
	`session_id` text,
	`email` text,
	`address` text,
	`tracking` text,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `orders_user` ON `orders` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `orders_session` ON `orders` (`session_id`);--> statement-breakpoint
CREATE TABLE `outbox` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`kind` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `subscribers` (
	`email` text PRIMARY KEY NOT NULL,
	`consent_version` text NOT NULL,
	`created` integer NOT NULL
);
