CREATE TABLE `incidents` (
	`description` text,
	`end_time` text,
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`service_id` integer NOT NULL,
	`start_time` text NOT NULL,
	`status` text NOT NULL,
	`title` text NOT NULL,
	FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `incidents_service_status_idx` ON `incidents` (`service_id`,`status`);--> statement-breakpoint
CREATE TABLE `monitoring_results` (
	`error_message` text,
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`response_time` integer,
	`service_id` integer NOT NULL,
	`status` text NOT NULL,
	`status_code` integer,
	`timestamp` text NOT NULL,
	FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `monitoring_results_service_time_idx` ON `monitoring_results` (`service_id`,`timestamp`);--> statement-breakpoint
CREATE INDEX `monitoring_results_time_idx` ON `monitoring_results` (`timestamp`,`service_id`,`status`);--> statement-breakpoint
CREATE TABLE `notification_channels` (
	`created_at` text NOT NULL,
	`credentials` text NOT NULL,
	`enabled` integer NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`provider` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `service_alerts` (
	`alert_threshold` integer NOT NULL,
	`channel_id` text NOT NULL,
	`notify_on_recovery` integer NOT NULL,
	`service_id` integer NOT NULL,
	PRIMARY KEY(`service_id`, `channel_id`),
	FOREIGN KEY (`channel_id`) REFERENCES `notification_channels`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `services` (
	`address` text NOT NULL,
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`port` integer NOT NULL,
	`public` integer DEFAULT true NOT NULL,
	`show_address` integer DEFAULT false NOT NULL,
	`type` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
