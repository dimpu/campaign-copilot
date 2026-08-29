import {
	index,
	integer,
	real,
	sqliteTable,
	text,
} from "drizzle-orm/sqlite-core";

// ── Users ──
export const users = sqliteTable("users", {
	id: text("id").primaryKey(),
	email: text("email").notNull().unique(),
	name: text("name").notNull(),
	avatarUrl: text("avatar_url"),
	role: text("role", { enum: ["ops", "admin"] })
		.notNull()
		.default("ops"),
	createdAt: integer("created_at").notNull(),
	lastLoginAt: integer("last_login_at"),
});

// ── OTP Codes ──
export const otpCodes = sqliteTable("otp_codes", {
	id: text("id").primaryKey(),
	email: text("email").notNull(),
	code: text("code").notNull(),
	expiresAt: integer("expires_at").notNull(),
	consumedAt: integer("consumed_at"),
});

// ── Campaigns ──
export const campaigns = sqliteTable(
	"campaigns",
	{
		id: text("id").primaryKey(),
		slug: text("slug").notNull().unique(),
		name: text("name").notNull(),
		description: text("description"),
		createdBy: text("created_by")
			.notNull()
			.references(() => users.id),
		status: text("status", {
			enum: ["draft", "validating", "ready", "published", "paused", "archived"],
		})
			.notNull()
			.default("draft"),
		config: text("config").notNull(), // JSON string — CampaignConfig
		estimatedReach: integer("estimated_reach"),
		estimatedCost: real("estimated_cost"),
		estimatedCpa: real("estimated_cpa"),
		estimatedRoi: real("estimated_roi"),
		eligibleCreatorCount: integer("eligible_creator_count"),
		validationIssues: text("validation_issues"), // JSON — ValidationIssue[]
		reasoningTrace: text("reasoning_trace"), // JSON — {step, input, output, ts}[]
		publishedAt: integer("published_at"),
		createdAt: integer("created_at").notNull(),
		updatedAt: integer("updated_at").notNull(),
	},
	(table) => [
		index("idx_campaigns_created_by").on(table.createdBy),
		index("idx_campaigns_status").on(table.status),
	],
);

// ── Generated Copy ──
export const generatedCopy = sqliteTable(
	"generated_copy",
	{
		id: text("id").primaryKey(),
		campaignId: text("campaign_id")
			.notNull()
			.references(() => campaigns.id, { onDelete: "cascade" }),
		locale: text("locale").notNull(),
		variant: integer("variant").notNull().default(0),
		subject: text("subject"),
		title: text("title").notNull(),
		body: text("body").notNull(),
		ctaText: text("cta_text").notNull(),
		hashtags: text("hashtags"), // JSON string[]
		tone: text("tone"),
		model: text("model"),
		createdAt: integer("created_at").notNull(),
	},
	(table) => [index("idx_generated_copy_campaign_id").on(table.campaignId)],
);

// ── Conversation Messages ──
export const conversationMessages = sqliteTable(
	"conversation_messages",
	{
		id: text("id").primaryKey(),
		campaignId: text("campaign_id")
			.notNull()
			.references(() => campaigns.id, { onDelete: "cascade" }),
		role: text("role", {
			enum: ["user", "assistant", "system", "tool"],
		}).notNull(),
		content: text("content").notNull(),
		payload: text("payload"), // JSON — {configPatch?, copyDelta?, stage?}
		createdAt: integer("created_at").notNull(),
	},
	(table) => [
		index("idx_conversation_messages_campaign_id").on(table.campaignId),
	],
);

// ── Creator Profiles ──
export const creatorProfiles = sqliteTable(
	"creator_profiles",
	{
		id: text("id").primaryKey(),
		handle: text("handle").notNull().unique(),
		displayName: text("display_name").notNull(),
		avatarColor: text("avatar_color"),
		region: text("region").notNull(),
		primaryCategory: text("primary_category").notNull(),
		categories: text("categories").notNull(), // JSON string[]
		followerTier: text("follower_tier", {
			enum: ["nano", "micro", "mid", "macro", "mega"],
		}).notNull(),
		followerCount: integer("follower_count").notNull(),
		avgViews: integer("avg_views").notNull(),
		engagementRate: real("engagement_rate").notNull(),
		gmv90d: real("gmv_90d").notNull(),
		avgOrderValue: real("avg_order_value").notNull(),
		pastCampaignCount: integer("past_campaign_count").notNull().default(0),
		lastCampaignAt: integer("last_campaign_at"),
		preferredLanguages: text("preferred_languages").notNull(), // JSON string[]
		isVerified: integer("is_verified", { mode: "boolean" })
			.notNull()
			.default(false),
		isAffiliate: integer("is_affiliate", { mode: "boolean" })
			.notNull()
			.default(true),
		createdAt: integer("created_at").notNull(),
	},
	(table) => [
		index("idx_creator_profiles_region_category_tier").on(
			table.region,
			table.primaryCategory,
			table.followerTier,
		),
		index("idx_creator_profiles_follower_count").on(table.followerCount),
		index("idx_creator_profiles_gmv_90d").on(table.gmv90d),
	],
);

// ── Audit Log ──
export const auditLog = sqliteTable(
	"audit_log",
	{
		id: text("id").primaryKey(),
		campaignId: text("campaign_id")
			.notNull()
			.references(() => campaigns.id, { onDelete: "cascade" }),
		userId: text("user_id")
			.notNull()
			.references(() => users.id),
		action: text("action").notNull(),
		delta: text("delta"), // JSON
		createdAt: integer("created_at").notNull(),
	},
	(table) => [index("idx_audit_log_campaign_id").on(table.campaignId)],
);
