"use client";

import { Minimize2, Smartphone } from "lucide-react";
import { CampaignPreviewCard } from "@/components/campaign-preview/campaign-preview-card";
import { PhoneFrame } from "@/components/campaign-preview/phone-frame";
import { Button } from "@/components/ui/button";
import { createDefaultConfig } from "@/lib/schemas/campaign-config";
import { useDraftStore } from "@/lib/store/draft-store";

export function LivePreviewPanel() {
	const config = useDraftStore((s) => s.config) ?? createDefaultConfig();
	const copy = useDraftStore((s) => s.copy);
	const status = useDraftStore((s) => s.status) ?? "draft";
	const estimate = useDraftStore((s) => s.estimate);
	const previewCollapsed = useDraftStore((s) => s.previewCollapsed);
	const togglePreviewCollapsed = useDraftStore((s) => s.togglePreviewCollapsed);

	if (previewCollapsed) return null;

	return (
		<div className="flex flex-col h-full bg-bg-dark border-l border-border">
			{/* Header */}
			<div className="flex items-center justify-between px-3 py-2 border-b border-border shrink-0">
				<span className="text-xs font-semibold text-text-secondary flex items-center gap-1.5">
					<Smartphone className="h-3 w-3" />
					Live Preview
				</span>
				<Button
					variant="ghost"
					size="icon"
					className="h-6 w-6 text-text-muted hover:text-text-primary"
					onClick={togglePreviewCollapsed}
				>
					<Minimize2 className="h-3 w-3" />
				</Button>
			</div>

			{/* Scrollable preview. We render the exact same CampaignPreviewCard as
			    the standalone /campaigns/[id]/preview page so the edit-mode live
			    preview is identical to the published creator-facing page. */}
			<div className="flex-1 overflow-y-auto flex items-start justify-center pt-2">
				<PhoneFrame className="origin-top">
					<CampaignPreviewCard
						config={config}
						status={status}
						campaignName={config.campaignName}
						brandName={config.brandName}
						estimatedReach={estimate?.estimatedReach ?? null}
						eligibleCreatorCount={estimate?.eligibleCreatorCount ?? null}
						estimatedCost={estimate?.estimatedCost ?? null}
						copy={copy ?? undefined}
					/>
				</PhoneFrame>
			</div>
		</div>
	);
}
