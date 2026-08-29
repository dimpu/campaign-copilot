import type { CampaignConfig } from "@/lib/schemas/campaign-config";
import { createDefaultConfig } from "@/lib/schemas/campaign-config";

interface MockToolResult {
	tool: string;
	result: unknown;
}

/**
 * Deterministic mock LLM that parses keywords from the user message
 * and produces plausible tool call sequences without any real AI.
 */
export function mockProcessMessage(
	userMessage: string,
	currentConfig?: CampaignConfig | null,
): {
	messages: string[];
	toolCalls: MockToolResult[];
	finalConfig: CampaignConfig;
	stageSequence: string[];
} {
	const lower = userMessage.toLowerCase();
	const config = currentConfig ? { ...currentConfig } : createDefaultConfig();
	const now = new Date();
	const toolCalls: MockToolResult[] = [];
	const stageSequence: string[] = ["parsing"];

	// ── Parse intent from keywords ──
	const hasUS = lower.includes("us") || lower.includes("united states");
	const hasID = lower.includes("id") || lower.includes("indonesia");
	const hasTH = lower.includes("th") || lower.includes("thailand");
	const hasVN = lower.includes("vn") || lower.includes("vietnam");
	const hasBR = lower.includes("br") || lower.includes("brazil");

	const hasBeauty = lower.includes("beauty");
	const hasFashion = lower.includes("fashion");
	const hasTech = lower.includes("tech");
	const hasFood = lower.includes("food");
	const hasGaming = lower.includes("gaming");

	const hasNano =
		lower.includes("nano") || lower.includes("1k") || lower.includes("small");
	const hasMicro = lower.includes("micro") || lower.includes("10k");
	const hasMid = lower.includes("mid") || lower.includes("50k");
	const hasMacro = lower.includes("macro") || lower.includes("200k");

	const hasVideo = lower.includes("video") || lower.includes("short video");
	const hasLive = lower.includes("live") || lower.includes("livestream");
	const hasCommission =
		lower.includes("commission") || lower.includes("tiered");
	const hasFlatFee = lower.includes("flat") || lower.includes("flat fee");
	const hasFreeSample =
		lower.includes("sample") || lower.includes("free product");

	// ── Build config patch ──
	const patch: Partial<CampaignConfig> = {};

	// Regions
	const regions: string[] = [];
	if (hasUS) regions.push("US");
	if (hasID) regions.push("ID");
	if (hasTH) regions.push("TH");
	if (hasVN) regions.push("VN");
	if (hasBR) regions.push("BR");
	if (regions.length === 0) regions.push("US");

	patch.eligibility = {
		...config.eligibility,
		regions: regions as CampaignConfig["eligibility"]["regions"],
	};

	// Categories
	if (hasBeauty) patch.eligibility.categories = ["beauty"];
	else if (hasFashion) patch.eligibility.categories = ["fashion"];
	else if (hasTech) patch.eligibility.categories = ["tech"];
	else if (hasFood) patch.eligibility.categories = ["food"];
	else if (hasGaming) patch.eligibility.categories = ["gaming"];
	else patch.eligibility.categories = config.eligibility.categories;

	// Tiers
	if (hasNano) patch.eligibility.followerTiers = ["nano"];
	else if (hasMicro) patch.eligibility.followerTiers = ["micro"];
	else if (hasMid) patch.eligibility.followerTiers = ["mid"];
	else if (hasMacro) patch.eligibility.followerTiers = ["macro"];
	else patch.eligibility.followerTiers = config.eligibility.followerTiers;

	// Reward type
	if (hasCommission) {
		patch.reward = {
			type: "tiered_commission",
			commissionRate: 0.15,
			commissionBoostBps: 500,
		};
	} else if (hasFlatFee) {
		patch.reward = { type: "flat_fee", flatFeeUsd: 200 };
	} else if (hasFreeSample) {
		patch.reward = { type: "free_product", freeProductBudgetUsd: 15 };
	} else {
		patch.reward = config.reward;
	}

	// Budget
	const budgetMatch = lower.match(/\$?(\d+)[kK]?\s*(budget)?/);
	if (budgetMatch) {
		let budget = parseInt(budgetMatch[1], 10);
		if (lower.includes("k") || lower.includes("000"))
			budget = budget < 100 ? budget * 1000 : budget;
		patch.budget = { ...config.budget, totalBudgetUsd: budget };
	}

	// Task type
	if (hasVideo) patch.taskType = "short_video_review";
	else if (hasLive) patch.taskType = "live_showcase";
	else if (hasFreeSample) patch.taskType = "free_sample";
	else if (hasCommission) patch.taskType = "commission_boost";
	else patch.taskType = config.taskType;

	// Content formats
	const formats: string[] = [];
	if (hasVideo) formats.push("short_video");
	if (hasLive) formats.push("live");
	if (formats.length === 0) formats.push("short_video");
	patch.contentRequirements = {
		...config.contentRequirements,
		formats: formats as CampaignConfig["contentRequirements"]["formats"],
	};

	// Locales
	const localeMap: Record<string, string> = {
		US: "en",
		ID: "id",
		TH: "th",
		VN: "vi",
		BR: "pt-BR",
	};
	const locales = [...new Set(regions.map((r) => localeMap[r] || "en"))];
	patch.targetLocales = locales as CampaignConfig["targetLocales"];

	// Campaign name
	const category = patch.eligibility?.categories?.[0] ?? "product";
	const region = regions[0];
	patch.campaignName = `${region} ${category} campaign - ${now.toISOString().slice(0, 10)}`;
	patch.productCategory = patch.eligibility?.categories?.[0] ?? "beauty";

	// Timeline
	const weekFromNow = new Date(now.getTime() + 7 * 86400000);
	const twoWeeks = new Date(now.getTime() + 14 * 86400000);
	const threeWeeks = new Date(now.getTime() + 21 * 86400000);
	const fourWeeks = new Date(now.getTime() + 28 * 86400000);
	patch.timeline = {
		applicationStart: now,
		applicationEnd: weekFromNow,
		contentDeadline: twoWeeks,
		goLiveDate: threeWeeks,
		campaignEnd: fourWeeks,
	};

	// ── Merge ──
	// When reward is patched (i.e. reward type may be changing), replace rather
	// than spread so that stale fields from the previous reward variant (e.g.
	// flatFeeUsd from a flat_fee reward when switching to tiered_commission)
	// don't leak through.
	const merged = { ...config, ...patch } as CampaignConfig;
	if (patch.eligibility)
		merged.eligibility = { ...config.eligibility, ...patch.eligibility };
	if (patch.reward)
		merged.reward = { ...patch.reward } as CampaignConfig["reward"]; // replace, not spread
	if (patch.budget) merged.budget = { ...config.budget, ...patch.budget };
	if (patch.timeline) merged.timeline = { ...patch.timeline };
	if (patch.contentRequirements)
		merged.contentRequirements = {
			...config.contentRequirements,
			...patch.contentRequirements,
		};

	// ── Build tool call results ──
	stageSequence.push("config-filling");
	toolCalls.push({
		tool: "set_config",
		result: {
			ok: true,
			merged: patch,
			issues: null,
			reasoning: "Parsed campaign intent from user message.",
		},
	});

	stageSequence.push("validating");
	toolCalls.push({
		tool: "run_validation",
		result: {
			ok: true,
			issues: [],
			summary: "✅ All validations passed. Config is ready.",
		},
	});

	stageSequence.push("copy-gen");
	toolCalls.push({
		tool: "generate_copy",
		result: {
			ok: true,
			localesGenerated: locales,
			message: `Copy generated for ${locales.length} locale(s).`,
		},
	});

	stageSequence.push("estimating");
	toolCalls.push({
		tool: "run_simulation",
		result: {
			ok: true,
			estimatedReach: 1200000,
			estimatedCost: merged.budget.totalBudgetUsd * 0.85,
			estimatedCpa: 3.5,
			estimatedRoi: 2.3,
			eligibleCreatorCount: 4230,
			actualCreators: merged.budget.targetCreatorCount,
			issues: [],
			topCreators: [],
		},
	});

	stageSequence.push("done");

	// ── Build chat messages ──
	const messages = [
		`✅ **Campaign configured!** Here's what I've set up:\n\n` +
			`- **${merged.campaignName}** — ${merged.taskType.replace(/_/g, " ")}\n` +
			`- **Regions**: ${regions.join(", ")}\n` +
			`- **Categories**: ${merged.eligibility.categories.join(", ")}\n` +
			`- **Tiers**: ${merged.eligibility.followerTiers.join(", ")}\n` +
			`- **Budget**: $${merged.budget.totalBudgetUsd.toLocaleString()}\n` +
			`- **Target**: ${merged.budget.targetCreatorCount} creators\n` +
			`- **Locales**: ${locales.join(", ")}\n` +
			`- **Tone**: ${merged.tone}\n\n` +
			`📊 **Projected**: ${(4230).toLocaleString()} eligible creators, ~1.2M reach, ` +
			`$${(merged.budget.totalBudgetUsd * 0.85).toFixed(0)} est. cost, 2.3x ROI\n\n` +
			`Copy generated in ${locales.length} language(s). You can review and edit in the form on the right, or ask me to adjust anything.`,
	];

	return { messages, toolCalls, finalConfig: merged, stageSequence };
}
