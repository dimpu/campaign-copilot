"use client";

import confetti from "canvas-confetti";
import { CheckCircle, Loader2, Rocket, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { type FieldErrors, useFormContext } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type {
	CampaignConfig,
	ValidationIssue,
} from "@/lib/schemas/campaign-config";
import { useDraftStore } from "@/lib/store/draft-store";

// Flatten react-hook-form's nested FieldErrors into a flat list of
// { field, message } entries for toasts / the issues store.
function flattenFormErrors(
	errors: FieldErrors<CampaignConfig>,
): { field: string; message: string }[] {
	const out: { field: string; message: string }[] = [];
	const walk = (node: unknown, path: string) => {
		if (!node || typeof node !== "object") return;
		const e = node as Record<string, unknown>;
		if (typeof e.message === "string") {
			out.push({ field: path, message: e.message });
			return;
		}
		for (const [k, v] of Object.entries(e)) {
			if (k === "ref") continue;
			walk(v, path ? `${path}.${k}` : k);
		}
	};
	walk(errors, "");
	return out;
}

export function ActionBar() {
	const [isSaving, setIsSaving] = useState(false);
	const [isPublishing, setIsPublishing] = useState(false);
	const config = useDraftStore((s) => s.config);
	const form = useFormContext<CampaignConfig>();

	// Validate the form against CampaignConfigSchema (the form's zodResolver)
	// before any save/validate/publish call, so we never POST an invalid config.
	const ensureValid = async (): Promise<boolean> => {
		const ok = await form.trigger();
		if (ok) return true;
		const errs = flattenFormErrors(form.formState.errors);
		const issues: ValidationIssue[] = errs.map((e) => ({
			level: "error",
			code: "FORM_INVALID",
			message: e.message,
			field: e.field,
		}));
		useDraftStore.getState().setIssues(issues);
		// Errors are now rendered inline under each field (DiffHighlightInput),
		// so just surface a short hint instead of dumping raw messages.
		toast.error("Please fix the highlighted fields below.");
		return false;
	};
	const campaignId = useDraftStore((s) => s.campaignId);
	const issues = useDraftStore((s) => s.issues);
	const router = useRouter();

	const handleSaveDraft = async () => {
		if (!(await ensureValid())) return;
		setIsSaving(true);
		try {
			const res = await fetch(`/api/campaigns/${campaignId || ""}`, {
				method: campaignId ? "PATCH" : "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ config }),
			});
			if (res.ok) {
				const data = await res.json();
				if (data.id) {
					useDraftStore.getState().setCampaignId(data.id);
				}
				toast.success("Draft saved!");
			} else {
				toast.error("Failed to save draft");
			}
		} catch {
			toast.error("Failed to save draft");
		} finally {
			setIsSaving(false);
		}
	};

	const handleValidate = async () => {
		if (!(await ensureValid())) return;
		try {
			// Ensure a campaign exists so we never POST to /api/campaigns/null/simulate.
			let id = useDraftStore.getState().campaignId;
			if (!id) {
				await handleSaveDraft();
				id = useDraftStore.getState().campaignId;
			}
			if (!id) {
				toast.error("Could not create campaign");
				return;
			}
			const res = await fetch(`/api/campaigns/${id}/simulate`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ config }),
			});
			if (res.ok) {
				const data = await res.json();
				useDraftStore.getState().setEstimate(data);
				useDraftStore.getState().setIssues(data.issues ?? []);
				const errors = (data.issues ?? []).filter(
					(i: { level: string }) => i.level === "error",
				);
				if (errors.length === 0) {
					toast.success("Validation passed!");
				} else {
					toast.error(`${errors.length} issue(s) found`);
				}
			}
		} catch {
			toast.error("Validation failed");
		}
	};

	const handlePublish = async () => {
		if (!(await ensureValid())) return;
		setIsPublishing(true);
		try {
			let id = useDraftStore.getState().campaignId;
			if (!id) {
				await handleSaveDraft();
				id = useDraftStore.getState().campaignId;
			}
			if (!id) {
				toast.error("Could not create campaign");
				return;
			}
			const res = await fetch(`/api/campaigns/${id}/publish`, {
				method: "POST",
			});
			if (res.ok) {
				confetti({
					particleCount: 150,
					spread: 70,
					origin: { y: 0.6 },
					colors: ["#6938FF", "#FE2C55", "#FFD700"],
				});
				toast.success("Campaign published! 🎉");
				setTimeout(() => router.push(`/campaigns/${campaignId}`), 1000);
			} else {
				const err = await res.json();
				toast.error(err.error || "Failed to publish");
			}
		} catch {
			toast.error("Failed to publish");
		} finally {
			setIsPublishing(false);
		}
	};

	const hasErrors = issues.some((i) => i.level === "error");

	return (
		<div className="flex items-center gap-2 p-4 border-t border-border bg-bg-dark">
			<Button
				type="button"
				variant="secondary"
				size="sm"
				onClick={handleSaveDraft}
				disabled={isSaving}
			>
				{isSaving ? (
					<Loader2 className="h-4 w-4 animate-spin" />
				) : (
					<Save className="h-4 w-4" />
				)}
				Save Draft
			</Button>
			<Button
				type="button"
				variant="outline"
				size="sm"
				onClick={handleValidate}
			>
				<CheckCircle className="h-4 w-4" />
				Validate
			</Button>
			<div className="flex-1" />
			<Button
				type="button"
				size="sm"
				onClick={handlePublish}
				disabled={isPublishing || hasErrors}
			>
				{isPublishing ? (
					<Loader2 className="h-4 w-4 animate-spin" />
				) : (
					<Rocket className="h-4 w-4" />
				)}
				Publish
			</Button>
		</div>
	);
}
