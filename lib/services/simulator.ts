import { and, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { SIMULATION_DEFAULTS } from "@/lib/constants";
import { db, schema } from "@/lib/db";
import type {
	CampaignConfig,
	SimulationResult,
	ValidationIssue,
} from "@/lib/schemas/campaign-config";
import { validateCampaign } from "./validator";

const { creatorProfiles } = schema;

export function runSimulation(config: CampaignConfig): SimulationResult {
	const issues: ValidationIssue[] = [];

	// ── Build eligibility query ──
	const e = config.eligibility;
	const conditions = [];

	conditions.push(inArray(creatorProfiles.region, e.regions));
	conditions.push(inArray(creatorProfiles.followerTier, e.followerTiers));

	if (e.categories && e.categories.length > 0) {
		// Check if any category in the creator's categories array matches
		// For simplicity in SQLite, we check primaryCategory
		conditions.push(inArray(creatorProfiles.primaryCategory, e.categories));
	}

	if (e.minFollowers)
		conditions.push(gte(creatorProfiles.followerCount, e.minFollowers));
	if (e.maxFollowers)
		conditions.push(lte(creatorProfiles.followerCount, e.maxFollowers));
	if (e.minEngagementRate)
		conditions.push(gte(creatorProfiles.engagementRate, e.minEngagementRate));
	if (e.minGmv90dUsd)
		conditions.push(gte(creatorProfiles.gmv90d, e.minGmv90dUsd));
	if (e.verifiedOnly) conditions.push(eq(creatorProfiles.isVerified, true));
	if (e.affiliateOnly) conditions.push(eq(creatorProfiles.isAffiliate, true));

	// ── Count eligible ──
	const where = and(...conditions);
	const countResult = db
		.select({ count: sql<number>`count(*)` })
		.from(creatorProfiles)
		.where(where)
		.all();
	const eligibleCreatorCount = countResult[0]?.count ?? 0;

	// ── Sample eligible creators ──
	const eligibleSample = db
		.select({
			id: creatorProfiles.id,
			handle: creatorProfiles.handle,
			displayName: creatorProfiles.displayName,
			region: creatorProfiles.region,
			primaryCategory: creatorProfiles.primaryCategory,
			followerTier: creatorProfiles.followerTier,
			followerCount: creatorProfiles.followerCount,
			engagementRate: creatorProfiles.engagementRate,
			gmv90d: creatorProfiles.gmv90d,
			avatarColor: creatorProfiles.avatarColor,
		})
		.from(creatorProfiles)
		.where(where)
		.orderBy(sql`${creatorProfiles.gmv90d} DESC`)
		.limit(12)
		.all();

	// ── Compute acceptance rate ──
	const acceptanceRates = SIMULATION_DEFAULTS.acceptanceRates;
	let weightedAcceptance = 0;
	let tierCount = 0;
	for (const tier of e.followerTiers) {
		weightedAcceptance +=
			acceptanceRates[tier as keyof typeof acceptanceRates] ?? 0.25;
		tierCount++;
	}
	const estimatedAcceptanceRate =
		tierCount > 0 ? weightedAcceptance / tierCount : 0.3;

	// Modulate by reward size
	const reward = config.reward;
	if (reward.flatFeeUsd && reward.flatFeeUsd > 500) {
		// Boost acceptance for higher flat fees
		const boost = Math.min(0.15, (reward.flatFeeUsd - 500) / 5000);
		weightedAcceptance += boost;
	}

	const actualCreators = Math.min(
		config.budget.targetCreatorCount,
		Math.floor(eligibleCreatorCount * estimatedAcceptanceRate),
	);

	// ── Cost calculation ──
	let rewardCost = 0;
	if (reward.flatFeeUsd) {
		rewardCost = reward.flatFeeUsd * actualCreators;
	}
	if (reward.commissionRate) {
		// Estimate per-creator GMV and commission cost
		const avgGmv =
			eligibleSample.length > 0
				? eligibleSample.reduce((sum, c) => sum + c.gmv90d, 0) /
					eligibleSample.length
				: 5000;
		const projectedGmvPerCreator = avgGmv * 0.1; // ~10% of 90d GMV during campaign
		rewardCost +=
			projectedGmvPerCreator * reward.commissionRate * actualCreators;
	}
	if (reward.freeProductBudgetUsd) {
		rewardCost += reward.freeProductBudgetUsd * actualCreators;
	}
	if (reward.performanceBonusUsd) {
		rewardCost += reward.performanceBonusUsd * (actualCreators * 0.2); // top 20% get bonus
	}

	const reserve = config.budget.totalBudgetUsd * config.budget.reservePct;
	const estimatedCost = rewardCost + reserve;

	// ── Reach calculation ──
	const totalFollowers = eligibleSample.reduce(
		(sum, c) => sum + c.followerCount,
		0,
	);
	const avgFollowers =
		eligibleSample.length > 0 ? totalFollowers / eligibleSample.length : 10000;
	const estimatedReach = Math.floor(
		avgFollowers * actualCreators * SIMULATION_DEFAULTS.impressionRatio,
	);

	// ── CPA & ROI ──
	const projectedConversions =
		estimatedReach * SIMULATION_DEFAULTS.conversionRate;
	const estimatedCpa =
		projectedConversions > 0 ? estimatedCost / projectedConversions : 0;

	const avgOrderValue = 30; // Default AOV
	const projectedGmv = projectedConversions * avgOrderValue;
	const estimatedRoi =
		estimatedCost > 0
			? (projectedGmv * SIMULATION_DEFAULTS.marginRate - estimatedCost) /
				estimatedCost
			: 0;

	// ── Eligibility warnings ──
	if (eligibleCreatorCount < config.budget.targetCreatorCount) {
		issues.push({
			level: "warning",
			code: "ELIGIBILITY_REACH_LOW",
			message: `Only ${eligibleCreatorCount} eligible creators found, but target is ${config.budget.targetCreatorCount}.`,
			field: "budget.targetCreatorCount",
			suggestion: `Reduce target creator count to ${eligibleCreatorCount} or broaden eligibility.`,
		});
	}

	if (estimatedCost > config.budget.totalBudgetUsd) {
		issues.push({
			level: "warning",
			code: "BUDGET_OVERRUN",
			message: `Estimated cost ($${estimatedCost.toFixed(0)}) exceeds budget ($${config.budget.totalBudgetUsd}).`,
			field: "budget.totalBudgetUsd",
			suggestion: `Raise budget to $${Math.ceil(estimatedCost).toLocaleString()} or reduce target creators.`,
		});
	}

	// Run deterministic validation
	const validationIssues = validateCampaign(config);
	issues.push(...validationIssues);

	return {
		estimatedReach,
		estimatedCost: Math.round(estimatedCost * 100) / 100,
		estimatedCpa: Math.round(estimatedCpa * 100) / 100,
		estimatedRoi: Math.round(estimatedRoi * 100) / 100,
		eligibleCreatorCount,
		estimatedAcceptanceRate: Math.round(estimatedAcceptanceRate * 100) / 100,
		actualCreators,
		issues,
		eligibleSample: eligibleSample as SimulationResult["eligibleSample"],
	};
}
