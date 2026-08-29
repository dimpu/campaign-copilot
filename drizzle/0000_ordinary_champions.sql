CREATE TABLE `audit_log` (
	`id` text PRIMARY KEY NOT NULL,
	`campaign_id` text NOT NULL,
	`user_id` text NOT NULL,
	`action` text NOT NULL,
	`delta` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_audit_log_campaign_id` ON `audit_log` (`campaign_id`);--> statement-breakpoint
CREATE TABLE `campaigns` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`created_by` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`config` text NOT NULL,
	`estimated_reach` integer,
	`estimated_cost` real,
	`estimated_cpa` real,
	`estimated_roi` real,
	`eligible_creator_count` integer,
	`validation_issues` text,
	`reasoning_trace` text,
	`published_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `campaigns_slug_unique` ON `campaigns` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_campaigns_created_by` ON `campaigns` (`created_by`);--> statement-breakpoint
CREATE INDEX `idx_campaigns_status` ON `campaigns` (`status`);--> statement-breakpoint
CREATE TABLE `conversation_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`campaign_id` text NOT NULL,
	`role` text NOT NULL,
	`content` text NOT NULL,
	`payload` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_conversation_messages_campaign_id` ON `conversation_messages` (`campaign_id`);--> statement-breakpoint
CREATE TABLE `creator_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`handle` text NOT NULL,
	`display_name` text NOT NULL,
	`avatar_color` text,
	`region` text NOT NULL,
	`primary_category` text NOT NULL,
	`categories` text NOT NULL,
	`follower_tier` text NOT NULL,
	`follower_count` integer NOT NULL,
	`avg_views` integer NOT NULL,
	`engagement_rate` real NOT NULL,
	`gmv_90d` real NOT NULL,
	`avg_order_value` real NOT NULL,
	`past_campaign_count` integer DEFAULT 0 NOT NULL,
	`last_campaign_at` integer,
	`preferred_languages` text NOT NULL,
	`is_verified` integer DEFAULT false NOT NULL,
	`is_affiliate` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `creator_profiles_handle_unique` ON `creator_profiles` (`handle`);--> statement-breakpoint
CREATE INDEX `idx_creator_profiles_region_category_tier` ON `creator_profiles` (`region`,`primary_category`,`follower_tier`);--> statement-breakpoint
CREATE INDEX `idx_creator_profiles_follower_count` ON `creator_profiles` (`follower_count`);--> statement-breakpoint
CREATE INDEX `idx_creator_profiles_gmv_90d` ON `creator_profiles` (`gmv_90d`);--> statement-breakpoint
CREATE TABLE `generated_copy` (
	`id` text PRIMARY KEY NOT NULL,
	`campaign_id` text NOT NULL,
	`locale` text NOT NULL,
	`variant` integer DEFAULT 0 NOT NULL,
	`subject` text,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`cta_text` text NOT NULL,
	`hashtags` text,
	`tone` text,
	`model` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_generated_copy_campaign_id` ON `generated_copy` (`campaign_id`);--> statement-breakpoint
CREATE TABLE `otp_codes` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`code` text NOT NULL,
	`expires_at` integer NOT NULL,
	`consumed_at` integer
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`avatar_url` text,
	`role` text DEFAULT 'ops' NOT NULL,
	`created_at` integer NOT NULL,
	`last_login_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);