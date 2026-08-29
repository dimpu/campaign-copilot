import type {
	CampaignConfig,
	ValidationIssue,
} from "@/lib/schemas/campaign-config";

export function validateCampaign(config: CampaignConfig): ValidationIssue[] {
	const issues: ValidationIssue[] = [];

	// ── Timeline sanity ──
	const t = config.timeline;
	if (t) {
		if (t.applicationEnd <= t.applicationStart) {
			issues.push({
				level: "error",
				code: "TIMELINE_APP_WINDOW",
				message: "Application end must be after application start.",
				field: "timeline.applicationEnd",
				suggestion: "Set application end at least 3 days after start.",
			});
		}
		if (t.contentDeadline < t.applicationEnd) {
			issues.push({
				level: "warning",
				code: "TIMELINE_CONTENT_DEADLINE",
				message:
					"Content deadline is before application end — creators won't have time to submit.",
				field: "timeline.contentDeadline",
				suggestion:
					"Move content deadline to at least 3 days after application end.",
			});
		}
		if (t.campaignEnd <= t.goLiveDate) {
			issues.push({
				level: "error",
				code: "TIMELINE_CAMPAIGN_END",
				message: "Campaign end must be after go-live date.",
				field: "timeline.campaignEnd",
				suggestion: "Set campaign end at least 1 week after go-live.",
			});
		}
		if (t.goLiveDate <= t.contentDeadline) {
			issues.push({
				level: "warning",
				code: "TIMELINE_GO_LIVE",
				message: "Go-live date should be after content deadline for review.",
				field: "timeline.goLiveDate",
			});
		}
	}

	// ── Budget vs. reward ──
	const budget = config.budget;
	const reward = config.reward;
	if (budget && reward) {
		const minReward = reward.flatFeeUsd ?? reward.freeProductBudgetUsd ?? 0;
		const effectiveBudget = budget.totalBudgetUsd * (1 - budget.reservePct);

		if (
			minReward > 0 &&
			minReward * budget.targetCreatorCount > effectiveBudget
		) {
			issues.push({
				level: "error",
				code: "BUDGET_INSUFFICIENT",
				message: `Budget ($${effectiveBudget.toLocaleString()} after reserve) cannot cover ${budget.targetCreatorCount} creators at minimum reward of $${minReward}.`,
				field: "budget.totalBudgetUsd",
				suggestion: `Either reduce target to ${Math.floor(effectiveBudget / minReward)} creators or raise budget to $${Math.ceil((minReward * budget.targetCreatorCount) / (1 - budget.reservePct)).toLocaleString()}.`,
			});
		}
	}

	if (budget && budget.totalBudgetUsd < 50) {
		issues.push({
			level: "warning",
			code: "BUDGET_TOO_SMALL",
			message: `Budget of $${budget.totalBudgetUsd} is very small. Most campaigns need at least $500.`,
			field: "budget.totalBudgetUsd",
			suggestion: "Consider raising budget to at least $500.",
		});
	}

	// ── Commission rate ──
	if (reward?.commissionRate && reward.commissionRate > 0.3) {
		issues.push({
			level: "warning",
			code: "COMMISSION_HIGH",
			message: `Commission rate of ${(reward.commissionRate * 100).toFixed(0)}% is above the typical 5–25% range.`,
			field: "reward.commissionRate",
			suggestion: "Consider 10–25% for a competitive but sustainable rate.",
		});
	}

	// ── Region-language mismatch ──
	if (config.eligibility && config.targetLocales) {
		const regionLocaleMap: Record<string, string[]> = {
			US: ["en"],
			GB: ["en"],
			ID: ["id"],
			TH: ["th"],
			VN: ["vi"],
			MY: ["ms", "en"],
			PH: ["tl", "en"],
			BR: ["pt-BR"],
			MX: ["es"],
			SG: ["en"],
		};

		for (const region of config.eligibility.regions ?? []) {
			const expectedLocales = regionLocaleMap[region] ?? [];
			const hasMatch = expectedLocales.some((l) =>
				config.targetLocales?.includes(l as never),
			);
			if (!hasMatch) {
				issues.push({
					level: "info",
					code: "REGION_LOCALE_MISMATCH",
					message: `Region ${region} has no matching target locale. Expected: ${expectedLocales.join(", ")}.`,
					field: "targetLocales",
					suggestion: `Add ${expectedLocales[0]} to target locales.`,
				});
			}
		}
	}

	// ── Campaign name ──
	if (!config.campaignName || config.campaignName.length < 3) {
		issues.push({
			level: "error",
			code: "NAME_TOO_SHORT",
			message: "Campaign name must be at least 3 characters.",
			field: "campaignName",
		});
	}

	// ── Product category ──
	if (!config.productCategory) {
		issues.push({
			level: "error",
			code: "MISSING_CATEGORY",
			message: "Product category is required.",
			field: "productCategory",
		});
	}

	return issues;
}
