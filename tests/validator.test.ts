import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	type CampaignConfig,
	createDefaultConfig,
} from "../lib/schemas/campaign-config";
import { validateCampaign } from "../lib/services/validator";

// Valid baseline config (US beauty, $5k budget, micro-creators)
const validConfig = (): CampaignConfig => ({
	...createDefaultConfig(),
	campaignName: "Summer Glow Affiliate Campaign",
	productCategory: "beauty",
});

describe("validateCampaign", () => {
	it("accepts a well-formed config with no issues", () => {
		const issues = validateCampaign(validConfig());
		expect(issues).toHaveLength(0);
	});

	it("flags a campaign name that is too short", () => {
		const cfg = validConfig();
		cfg.campaignName = "ab";
		const issues = validateCampaign(cfg);
		expect(issues.some((i) => i.code === "NAME_TOO_SHORT")).toBe(true);
	});

	it("flags a missing product category", () => {
		const cfg = validConfig();
		cfg.productCategory = "";
		const issues = validateCampaign(cfg);
		expect(issues.some((i) => i.code === "MISSING_CATEGORY")).toBe(true);
	});

	it("warns when budget is below $50", () => {
		const cfg = validConfig();
		cfg.budget.totalBudgetUsd = 10;
		const issues = validateCampaign(cfg);
		expect(issues.some((i) => i.code === "BUDGET_TOO_SMALL")).toBe(true);
	});

	it("flags insufficient budget to cover flat-fee creator rewards", () => {
		const cfg = validConfig();
		cfg.reward = { type: "flat_fee", flatFeeUsd: 1000 };
		const issues = validateCampaign(cfg);
		expect(issues.some((i) => i.code === "BUDGET_INSUFFICIENT")).toBe(true);
	});

	it("warns when commission rate exceeds 30%", () => {
		const cfg = validConfig();
		cfg.reward.commissionRate = 0.5;
		const issues = validateCampaign(cfg);
		expect(issues.some((i) => i.code === "COMMISSION_HIGH")).toBe(true);
	});

	it("flags application end before application start", () => {
		const cfg = validConfig();
		cfg.timeline.applicationEnd = new Date(
			cfg.timeline.applicationStart.getTime() - 1000,
		);
		const issues = validateCampaign(cfg);
		expect(issues.some((i) => i.code === "TIMELINE_APP_WINDOW")).toBe(true);
	});

	it("flags campaign end before go-live date", () => {
		const cfg = validConfig();
		cfg.timeline.campaignEnd = new Date(
			cfg.timeline.goLiveDate.getTime() - 1000,
		);
		const issues = validateCampaign(cfg);
		expect(issues.some((i) => i.code === "TIMELINE_CAMPAIGN_END")).toBe(true);
	});

	it("warns when content deadline is before application end", () => {
		const cfg = validConfig();
		cfg.timeline.contentDeadline = new Date(
			cfg.timeline.applicationEnd.getTime() - 1000,
		);
		const issues = validateCampaign(cfg);
		expect(issues.some((i) => i.code === "TIMELINE_CONTENT_DEADLINE")).toBe(
			true,
		);
	});

	it("warns when go-live date is before content deadline", () => {
		const cfg = validConfig();
		cfg.timeline.goLiveDate = new Date(
			cfg.timeline.contentDeadline.getTime() - 1000,
		);
		const issues = validateCampaign(cfg);
		expect(issues.some((i) => i.code === "TIMELINE_GO_LIVE")).toBe(true);
	});

	it("flags a region with no matching target locale", () => {
		const cfg = validConfig();
		cfg.eligibility.regions = ["BR"];
		cfg.targetLocales = ["en"];
		const issues = validateCampaign(cfg);
		expect(issues.some((i) => i.code === "REGION_LOCALE_MISMATCH")).toBe(true);
	});
});

// Zustand draft store tests (validates merge behavior without React)
describe("draft store", () => {
	beforeEach(async () => {
		// Reset store module between tests
		vi.resetModules();
	});

	it("merges partial config without overwriting unrelated fields", async () => {
		const { useDraftStore } = await import("../lib/store/draft-store");
		useDraftStore.getState().reset();
		useDraftStore.getState().mergeConfig(
			{
				campaignName: "Test Campaign",
				budget: {
					totalBudgetUsd: 10000,
					targetCreatorCount: 200,
					allocation: "balanced",
					reservePct: 0.1,
				},
			},
			"user",
		);
		useDraftStore
			.getState()
			.mergeConfig({ productCategory: "fashion" }, "user");

		const config = useDraftStore.getState().config;
		expect(config?.campaignName).toBe("Test Campaign");
		expect(config?.productCategory).toBe("fashion");
		expect(config?.budget.totalBudgetUsd).toBe(10000);
	});

	it("resets to default config", async () => {
		const { useDraftStore } = await import("../lib/store/draft-store");
		useDraftStore.getState().mergeConfig({ campaignName: "Dirty" }, "user");
		useDraftStore.getState().reset();
		expect(useDraftStore.getState().config).toBeNull();
	});
});
