import { z } from "zod";

// ── Enums ──
export const LocaleSchema = z.enum([
	"en",
	"id",
	"th",
	"vi",
	"ms",
	"tl",
	"es",
	"pt-BR",
]);
export type Locale = z.infer<typeof LocaleSchema>;

export const RegionSchema = z.enum([
	"US",
	"GB",
	"ID",
	"TH",
	"VN",
	"MY",
	"PH",
	"BR",
	"MX",
	"SG",
]);
export type Region = z.infer<typeof RegionSchema>;

export const TaskTypeSchema = z.enum([
	"open_collab",
	"targeted_invite",
	"free_sample",
	"commission_boost",
	"hashtag_challenge",
	"live_showcase",
	"short_video_review",
]);
export type TaskType = z.infer<typeof TaskTypeSchema>;

export const FollowerTierSchema = z.enum([
	"nano",
	"micro",
	"mid",
	"macro",
	"mega",
]);
export type FollowerTier = z.infer<typeof FollowerTierSchema>;

export const CampaignStatusSchema = z.enum([
	"draft",
	"validating",
	"ready",
	"published",
	"paused",
	"archived",
]);
export type CampaignStatus = z.infer<typeof CampaignStatusSchema>;

// ── Sub-schemas ──
export const RewardSchema = z.object({
	type: z.enum([
		"flat_fee",
		"commission",
		"tiered_commission",
		"free_product",
		"mixed",
	]),
	flatFeeUsd: z.number().min(0).optional(),
	commissionRate: z.number().min(0).max(1).optional(),
	commissionBoostBps: z.number().int().min(0).max(5000).optional(),
	freeProductBudgetUsd: z.number().min(0).optional(),
	performanceBonusUsd: z.number().min(0).optional(),
});
export type Reward = z.infer<typeof RewardSchema>;

export const EligibilitySchema = z.object({
	regions: z.array(RegionSchema).min(1),
	followerTiers: z.array(FollowerTierSchema).min(1),
	categories: z.array(z.string()).min(1),
	minEngagementRate: z.number().min(0).max(1).optional(),
	minGmv90dUsd: z.number().min(0).optional(),
	minFollowers: z.number().int().min(0).optional(),
	maxFollowers: z.number().int().min(0).optional(),
	verifiedOnly: z.boolean().default(false),
	affiliateOnly: z.boolean().default(true),
	excludePastCampaignIds: z.array(z.string()).default([]),
});
export type Eligibility = z.infer<typeof EligibilitySchema>;

export const TimelineSchema = z.object({
	applicationStart: z.coerce.date(),
	applicationEnd: z.coerce.date(),
	contentDeadline: z.coerce.date(),
	goLiveDate: z.coerce.date(),
	campaignEnd: z.coerce.date(),
});
export type Timeline = z.infer<typeof TimelineSchema>;

export const BudgetSchema = z.object({
	totalBudgetUsd: z.number().min(0),
	targetCreatorCount: z.number().int().min(1),
	allocation: z
		.enum(["reward_first", "sample_first", "balanced"])
		.default("balanced"),
	reservePct: z.number().min(0).max(0.5).default(0.1),
});
export type Budget = z.infer<typeof BudgetSchema>;

export const ContentRequirementSchema = z.object({
	formats: z
		.array(z.enum(["short_video", "live", "photo_post", "story"]))
		.min(1),
	minVideoSec: z.number().int().min(5).max(600).optional(),
	requiredHashtags: z.array(z.string()).default([]),
	mustMentionBrand: z.boolean().default(true),
	reviewRequired: z.boolean().default(true),
	productShipRequired: z.boolean().default(false),
});
export type ContentRequirement = z.infer<typeof ContentRequirementSchema>;

// ── Root Campaign Config ──
export const CampaignConfigSchema = z.object({
	campaignName: z.string().min(3).max(120),
	taskType: TaskTypeSchema,
	productCategory: z.string().min(1),
	brandName: z.string().optional(),
	campaignObjective: z.enum([
		"awareness",
		"conversion",
		"gmv_launch",
		"new_product",
		"retention",
	]),

	eligibility: EligibilitySchema,
	reward: RewardSchema,
	budget: BudgetSchema,
	timeline: TimelineSchema,
	contentRequirements: ContentRequirementSchema,

	targetLocales: z.array(LocaleSchema).min(1).default(["en"]),
	tone: z
		.enum(["playful", "professional", "urgent", "luxury", "casual"])
		.default("casual"),

	trackingCode: z.string().optional(),
	internalNotes: z.string().optional(),
});
export type CampaignConfig = z.infer<typeof CampaignConfigSchema>;

// ── Validation Issue ──
export const ValidationIssueSchema = z.object({
	level: z.enum(["error", "warning", "info"]),
	code: z.string(),
	message: z.string(),
	field: z.string().optional(),
	suggestion: z.string().optional(),
});
export type ValidationIssue = z.infer<typeof ValidationIssueSchema>;

// ── Simulation Result ──
export const SimulationResultSchema = z.object({
	estimatedReach: z.number().int(),
	estimatedCost: z.number(),
	estimatedCpa: z.number(),
	estimatedRoi: z.number(),
	eligibleCreatorCount: z.number().int(),
	estimatedAcceptanceRate: z.number(),
	actualCreators: z.number().int(),
	issues: z.array(ValidationIssueSchema),
	eligibleSample: z.array(
		z.object({
			id: z.string(),
			handle: z.string(),
			displayName: z.string(),
			region: RegionSchema,
			primaryCategory: z.string(),
			followerTier: FollowerTierSchema,
			followerCount: z.number().int(),
			gmv90d: z.number(),
			engagementRate: z.number(),
			avatarColor: z.string().optional(),
		}),
	),
});
export type SimulationResult = z.infer<typeof SimulationResultSchema>;

// ── Copy Variant ──
export const CopyVariantSchema = z.object({
	locale: LocaleSchema,
	subject: z.string().max(80),
	title: z.string().max(60),
	body: z.string().max(800),
	ctaText: z.string().max(20),
	hashtags: z.array(z.string().max(30)).max(5),
	smsVariant: z.string().max(120).optional(),
	tone: z.string().optional(),
});
export type CopyVariant = z.infer<typeof CopyVariantSchema>;

export const MultiLangCopySchema = z.object({
	variants: z.record(LocaleSchema, CopyVariantSchema),
	toneRationale: z.string().max(200),
});
export type MultiLangCopy = z.infer<typeof MultiLangCopySchema>;

// ── API Schemas ──
export const ChatMessageSchema = z.object({
	role: z.enum(["user", "assistant", "system", "tool"]),
	content: z.string(),
});

export const ChatRequestSchema = z.object({
	campaignId: z.string().nullable().optional(),
	messages: z.array(ChatMessageSchema),
	// The form is a work-in-progress snapshot: it may carry empty strings or
	// null/omitted numbers. Strip those to `undefined` and accept the result as
	// an untyped partial; the server normalizes it over the defaults before use.
	currentConfig: z
		.preprocess((v) => (v == null ? v : stripEmptyValues(v)), z.unknown())
		.optional()
		.nullable(),
});

// Recursively replace "" and null with undefined so empty form fields don't
// fail schema validation. Arrays/objects are rebuilt so the shape is preserved.
function stripEmptyValues<T>(value: T): unknown {
	if (value === "" || value === null) return undefined;
	if (Array.isArray(value)) return value.map((item) => stripEmptyValues(item));
	if (value && typeof value === "object") {
		const out: Record<string, unknown> = {};
		for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
			out[key] = stripEmptyValues(val);
		}
		return out;
	}
	return value;
}

export const PaginationSchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const CampaignListQuerySchema = PaginationSchema.extend({
	status: z.string().optional(),
	q: z.string().optional(),
});

export const CreatorSearchQuerySchema = PaginationSchema.extend({
	region: z.string().optional(),
	category: z.string().optional(),
	tier: z.string().optional(),
	q: z.string().optional(),
});

// ── Helpers ──
export function createDefaultConfig(): CampaignConfig {
	const now = new Date();
	const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
	const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
	const threeWeeksFromNow = new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000);
	const fourWeeksFromNow = new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000);

	return {
		campaignName: "",
		taskType: "open_collab",
		productCategory: "",
		brandName: "",
		campaignObjective: "awareness",
		eligibility: {
			regions: ["US"],
			followerTiers: ["micro"],
			categories: ["beauty"],
			verifiedOnly: false,
			affiliateOnly: true,
			excludePastCampaignIds: [],
		},
		reward: {
			type: "commission",
			commissionRate: 0.1,
		},
		budget: {
			totalBudgetUsd: 5000,
			targetCreatorCount: 100,
			allocation: "balanced",
			reservePct: 0.1,
		},
		timeline: {
			applicationStart: now,
			applicationEnd: weekFromNow,
			contentDeadline: twoWeeksFromNow,
			goLiveDate: threeWeeksFromNow,
			campaignEnd: fourWeeksFromNow,
		},
		contentRequirements: {
			formats: ["short_video"],
			mustMentionBrand: true,
			reviewRequired: true,
			productShipRequired: false,
			requiredHashtags: [],
		},
		targetLocales: ["en"],
		tone: "casual",
	};
}
