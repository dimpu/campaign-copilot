export const APP_NAME = "Campaign Copilot";
export const APP_DESCRIPTION =
	"AI-powered campaign configuration for TikTok Shop affiliate creators";

export const REGIONS = [
	{ code: "US", name: "United States", flag: "🇺🇸" },
	{ code: "GB", name: "United Kingdom", flag: "🇬🇧" },
	{ code: "ID", name: "Indonesia", flag: "🇮🇩" },
	{ code: "TH", name: "Thailand", flag: "🇹🇭" },
	{ code: "VN", name: "Vietnam", flag: "🇻🇳" },
	{ code: "MY", name: "Malaysia", flag: "🇲🇾" },
	{ code: "PH", name: "Philippines", flag: "🇵🇭" },
	{ code: "BR", name: "Brazil", flag: "🇧🇷" },
	{ code: "MX", name: "Mexico", flag: "🇲🇽" },
	{ code: "SG", name: "Singapore", flag: "🇸🇬" },
] as const;

export const LOCALES = [
	{ code: "en", name: "English", flag: "🇺🇸" },
	{ code: "id", name: "Bahasa Indonesia", flag: "🇮🇩" },
	{ code: "th", name: "ภาษาไทย", flag: "🇹🇭" },
	{ code: "vi", name: "Tiếng Việt", flag: "🇻🇳" },
	{ code: "ms", name: "Bahasa Melayu", flag: "🇲🇾" },
	{ code: "tl", name: "Tagalog", flag: "🇵🇭" },
	{ code: "es", name: "Español", flag: "🇲🇽" },
	{ code: "pt-BR", name: "Português (BR)", flag: "🇧🇷" },
] as const;

export const CATEGORIES = [
	"fashion",
	"beauty",
	"tech",
	"food",
	"gaming",
	"home",
	"fitness",
	"parenting",
	"pets",
	"automotive",
] as const;

export const FOLLOWER_TIERS = [
	{ value: "nano", label: "Nano (1K–10K)", min: 1_000, max: 10_000 },
	{ value: "micro", label: "Micro (10K–50K)", min: 10_000, max: 50_000 },
	{ value: "mid", label: "Mid (50K–200K)", min: 50_000, max: 200_000 },
	{ value: "macro", label: "Macro (200K–1M)", min: 200_000, max: 1_000_000 },
	{ value: "mega", label: "Mega (1M+)", min: 1_000_000, max: Infinity },
] as const;

export const TASK_TYPES = [
	{ value: "open_collab", label: "Open Collaboration" },
	{ value: "targeted_invite", label: "Targeted Invitation" },
	{ value: "free_sample", label: "Free Product Sample" },
	{ value: "commission_boost", label: "Commission Rate Boost" },
	{ value: "hashtag_challenge", label: "Hashtag Challenge" },
	{ value: "live_showcase", label: "Live Stream Showcase" },
	{ value: "short_video_review", label: "Short Video Review" },
] as const;

export const CAMPAIGN_OBJECTIVES = [
	{ value: "awareness", label: "Brand Awareness" },
	{ value: "conversion", label: "Conversion" },
	{ value: "gmv_launch", label: "GMV / Launch" },
	{ value: "new_product", label: "New Product" },
	{ value: "retention", label: "Creator Retention" },
] as const;

export const TONES = [
	{ value: "playful", label: "Playful 😄" },
	{ value: "professional", label: "Professional 💼" },
	{ value: "urgent", label: "Urgent ⚡" },
	{ value: "luxury", label: "Luxury ✨" },
	{ value: "casual", label: "Casual 👋" },
] as const;

export const CONTENT_FORMATS = [
	{ value: "short_video", label: "Short Video" },
	{ value: "live", label: "Live Stream" },
	{ value: "photo_post", label: "Photo Post" },
	{ value: "story", label: "Story" },
] as const;

export const CAMPAIGN_STATUSES = [
	"draft",
	"validating",
	"ready",
	"published",
	"paused",
	"archived",
] as const;

export const COLORS = {
	primary: "#6938FF",
	accent: "#FE2C55",
	primaryLight: "#8B6BFF",
	accentLight: "#FF5C7A",
} as const;

export const SIMULATION_DEFAULTS = {
	cpmLow: 5,
	cpmHigh: 25,
	commissionMin: 0.05,
	commissionMax: 0.25,
	conversionRate: 0.008,
	marginRate: 0.15,
	impressionRatio: 0.4,
	acceptanceRates: {
		nano: 0.45,
		micro: 0.35,
		mid: 0.25,
		macro: 0.15,
		mega: 0.05,
	},
} as const;
