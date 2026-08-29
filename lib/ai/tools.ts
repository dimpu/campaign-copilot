import { tool } from "ai";
import { z } from "zod";
import { CampaignConfigSchema } from "@/lib/schemas/campaign-config";
import { runSimulation } from "@/lib/services/simulator";
import { validateCampaign } from "@/lib/services/validator";

// ── set_config ──
//
// NOTE: set_config accepts a PARTIAL patch (the tool's purpose is to merge fields,
// not validate the full config). Do NOT call validateCampaign() here — it expects a
// complete CampaignConfig and will crash on partial input. Full-validation is the
// responsibility of the run_validation tool, which the model is instructed to call
// after set_config.
export const setConfigTool = tool({
	description:
		"Create or update the campaign configuration. Always merge partially — only send fields you want to set or change. Do NOT send the entire config every time.",
	parameters: CampaignConfigSchema.partial().extend({
		reasoning: z
			.string()
			.describe("Brief explanation of what you changed and why")
			.optional(),
	}),
	execute: async (args) => {
		const { reasoning, ...patch } = args;
		return {
			ok: true,
			merged: patch,
			issues: null,
			reasoning: reasoning ?? "Configuration updated.",
		};
	},
});

// ── run_validation ──
export const runValidationTool = tool({
	description:
		"Validate the current campaign configuration against business rules. Call this after every set_config.",
	parameters: z.object({
		config: CampaignConfigSchema,
	}),
	execute: async ({ config }) => {
		const issues = validateCampaign(config);
		return {
			ok: issues.filter((i) => i.level === "error").length === 0,
			issues,
			summary:
				issues.length === 0
					? "✅ All validations passed. Config is ready."
					: `Found ${issues.length} issue(s): ${issues.map((i) => `[${i.level}] ${i.message}`).join("; ")}`,
		};
	},
});

// ── generate_copy ──
export const generateCopyTool = tool({
	description:
		"Generate multi-locale creator-facing marketing copy. Call this after the config is valid. Produces title, body, CTA, and hashtags for each target locale.",
	parameters: z.object({
		campaignName: z.string(),
		taskType: z.string(),
		productCategory: z.string(),
		brandName: z.string().optional(),
		tone: z.string(),
		locales: z.array(z.string()),
		regions: z.array(z.string()).optional(),
	}),
	execute: async (args) => {
		// In production, this would call generateObject with MultiLangCopySchema
		// For now, return a structured result that the route handler can process
		return {
			ok: true,
			localesGenerated: args.locales,
			message: `Copy generated for ${args.locales.length} locale(s).`,
			// The actual copy generation happens in the route handler via generateObject
			_requiresRealLLM: true,
			_params: args,
		};
	},
});

// ── run_simulation ──
export const runSimulationTool = tool({
	description:
		"Run a deterministic budget/reach/ROI simulation against the creator database. Call this as the final step.",
	parameters: z.object({
		config: CampaignConfigSchema,
	}),
	execute: async ({ config }) => {
		const result = runSimulation(config);
		return {
			ok: true,
			estimatedReach: result.estimatedReach,
			estimatedCost: result.estimatedCost,
			estimatedCpa: result.estimatedCpa,
			estimatedRoi: result.estimatedRoi,
			eligibleCreatorCount: result.eligibleCreatorCount,
			actualCreators: result.actualCreators,
			issues: result.issues,
			topCreators: result.eligibleSample.slice(0, 5).map((c) => ({
				handle: c.handle,
				displayName: c.displayName,
				followerCount: c.followerCount,
				gmv90d: c.gmv90d,
			})),
		};
	},
});

// ── ask_user ──
export const askUserTool = tool({
	description:
		"Ask the user a clarifying question when critical information is missing. Use this sparingly — only when a required field cannot be reasonably defaulted.",
	parameters: z.object({
		question: z.string().describe("A focused, single question"),
		missingFields: z
			.array(z.string())
			.describe("Fields that need clarification"),
	}),
	execute: async (args) => {
		return {
			ok: true,
			question: args.question,
			missingFields: args.missingFields,
		};
	},
});

// ── All tools ──
export const copilotTools = {
	set_config: setConfigTool,
	run_validation: runValidationTool,
	generate_copy: generateCopyTool,
	run_simulation: runSimulationTool,
	ask_user: askUserTool,
};
