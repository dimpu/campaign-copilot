import { create } from "zustand";
import type {
	CampaignConfig,
	SimulationResult,
	ValidationIssue,
} from "@/lib/schemas/campaign-config";
import { createDefaultConfig } from "@/lib/schemas/campaign-config";
import type { CampaignPreviewCopy } from "@/lib/schemas/copy";

export type DraftStage =
	| "idle"
	| "parsing"
	| "config-filling"
	| "validating"
	| "copy-gen"
	| "estimating"
	| "done"
	| "error";

interface DraftState {
	campaignId: string | null;
	config: CampaignConfig | null;
	issues: ValidationIssue[];
	estimate: SimulationResult | null;
	// Creator-facing copy + lifecycle status, used by the live preview panel so it
	// matches the standalone /campaigns/[id]/preview page exactly.
	copy: CampaignPreviewCopy[] | null;
	status: string | null;
	stage: DraftStage;
	lastAiPatchAt: Record<string, number>;
	isLoading: boolean;
	previewCollapsed: boolean;

	// Actions
	setCampaignId: (id: string | null) => void;
	setConfig: (config: CampaignConfig | null) => void;
	mergeConfig: (patch: Partial<CampaignConfig>, source: "ai" | "user") => void;
	setIssues: (issues: ValidationIssue[]) => void;
	setEstimate: (e: SimulationResult | null) => void;
	setCopy: (copy: CampaignPreviewCopy[] | null) => void;
	setStatus: (status: string | null) => void;
	setStage: (s: DraftStage) => void;
	setLoading: (l: boolean) => void;
	togglePreviewCollapsed: () => void;
	setPreviewCollapsed: (collapsed: boolean) => void;
	reset: () => void;
}

export const useDraftStore = create<DraftState>((set, get) => ({
	campaignId: null,
	config: null,
	issues: [],
	estimate: null,
	copy: null,
	status: null,
	stage: "idle",
	lastAiPatchAt: {},
	isLoading: false,
	previewCollapsed: true,

	setCampaignId: (id) => set({ campaignId: id }),
	setConfig: (config) => set({ config }),
	mergeConfig: (patch, source) => {
		const current = get().config;
		// Detect whether the form was "empty" before this patch
		const wasEmpty =
			!current ||
			(current.campaignName === "" && current.brandName === "");

		// Always merge on top of a complete base config so that form components
		// and downstream code can safely read required fields (reward, budget, etc.)
		// even on the very first AI patch.
		const base: CampaignConfig = current ?? createDefaultConfig();
		const merged = deepMergeConfig(base, patch);

		// Auto-expand live preview when config first gets meaningful data
		if (
			wasEmpty &&
			get().previewCollapsed &&
			(merged.campaignName !== "" || merged.brandName !== "")
		) {
			set({ previewCollapsed: false });
		}

		const patchAt: Record<string, number> = {};

		if (source === "ai") {
			// Record a timestamp for every dotted leaf path the AI touched so the
			// form's DiffHighlightInput fields (keyed by e.g. "budget.totalBudgetUsd")
			// can flash individually as they are filled.
			for (const path of collectLeafPaths(patch as Record<string, unknown>)) {
				patchAt[path] = Date.now();
			}
		}

		set({
			config: merged,
			lastAiPatchAt:
				source === "ai"
					? { ...get().lastAiPatchAt, ...patchAt }
					: get().lastAiPatchAt,
		});
	},
	setIssues: (issues) => set({ issues }),
	setEstimate: (estimate) => set({ estimate }),
	setCopy: (copy) => set({ copy }),
	setStatus: (status) => set({ status }),
	setStage: (stage) => set({ stage }),
	setLoading: (isLoading) => set({ isLoading }),
	togglePreviewCollapsed: () => set((s) => ({ previewCollapsed: !s.previewCollapsed })),
	setPreviewCollapsed: (collapsed) => set({ previewCollapsed: collapsed }),
	reset: () =>
		set({
			campaignId: null,
			config: null,
			issues: [],
			estimate: null,
			copy: null,
			status: null,
			stage: "idle",
			lastAiPatchAt: {},
			isLoading: false,
			previewCollapsed: true,
		}),
}));

// Top-level keys that hold a discriminated union: when the patch changes
// the discriminator (`type`), we REPLACE the object instead of deep-merging,
// so that stale fields from the previous variant don't leak through.
const DISCRIMINATED_UNION_KEYS = new Set(["reward"]);

// Collect dotted leaf paths of an object (arrays/dates are treated as leaves),
// e.g. { budget: { totalBudgetUsd: 5000 } } -> ["budget.totalBudgetUsd"].
function collectLeafPaths(
	obj: Record<string, unknown>,
	prefix = "",
	out: string[] = [],
): string[] {
	for (const [key, value] of Object.entries(obj)) {
		const path = prefix ? `${prefix}.${key}` : key;
		if (
			value !== null &&
			typeof value === "object" &&
			!Array.isArray(value) &&
			!(value instanceof Date)
		) {
			collectLeafPaths(value as Record<string, unknown>, path, out);
		} else {
			out.push(path);
		}
	}
	return out;
}

export function deepMergeConfig(
	current: CampaignConfig,
	patch: Partial<CampaignConfig>,
): CampaignConfig {
	const merged = { ...current };

	for (const [key, value] of Object.entries(patch)) {
		if (value === undefined) {
			// Explicit undefined means "don't update" — skip it to avoid wiping fields.
			continue;
		}
		if (
			value !== null &&
			typeof value === "object" &&
			!Array.isArray(value) &&
			!(value instanceof Date)
		) {
			const isDiscriminated =
				DISCRIMINATED_UNION_KEYS.has(key) &&
				typeof (value as Record<string, unknown>).type === "string";
			if (isDiscriminated) {
				// Replace the whole union object — don't merge fields across variants.
				(merged as Record<string, unknown>)[key] = value;
			} else {
				const existing = (current as Record<string, unknown>)[key];
				// Drop undefined values so an empty/omitted form field doesn't
				// clobber the corresponding default during the nested merge.
				const definedValue = Object.fromEntries(
					Object.entries(value as Record<string, unknown>).filter(
						([, v]) => v !== undefined,
					),
				);
				(merged as Record<string, unknown>)[key] = {
					...(existing &&
					typeof existing === "object" &&
					!Array.isArray(existing)
						? (existing as Record<string, unknown>)
						: {}),
					...definedValue,
				};
			}
		} else {
			(merged as Record<string, unknown>)[key] = value;
		}
	}

	return merged;
}
