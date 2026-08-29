"use client";

import { Maximize2, Minimize2 } from "lucide-react";
import { useState } from "react";
import { CampaignPreviewCard } from "@/components/campaign-preview/campaign-preview-card";
import { Button } from "@/components/ui/button";
import { createDefaultConfig } from "@/lib/schemas/campaign-config";
import { useDraftStore } from "@/lib/store/draft-store";

export function LivePreviewPanel() {
	const config = useDraftStore((s) => s.config) ?? createDefaultConfig();
	const copy = useDraftStore((s) => s.copy);
	const status = useDraftStore((s) => s.status) ?? "draft";
	const estimate = useDraftStore((s) => s.estimate);
	const [collapsed, setCollapsed] = useState(false);

	if (collapsed) {
		return (
			<div className="flex flex-col items-center justify-center h-full bg-bg-card border-l border-border py-6 gap-3">
				<Button
					variant="ghost"
					size="sm"
					className="text-text-muted hover:text-text-primary"
					onClick={() => setCollapsed(false)}
				>
					<Maximize2 className="h-4 w-4" />
				</Button>
				<span
					className="text-xs text-text-muted"
					style={{ writingMode: "vertical-rl" }}
				>
					Preview
				</span>
			</div>
		);
	}

	return (
		<div className="flex flex-col h-full bg-bg-dark border-l border-border">
			{/* Header */}
			<div className="flex items-center justify-between px-3 py-2 border-b border-border shrink-0">
				<span className="text-xs font-semibold text-text-secondary">
					Live Preview
				</span>
				<Button
					variant="ghost"
					size="icon"
					className="h-6 w-6 text-text-muted hover:text-text-primary"
					onClick={() => setCollapsed(true)}
				>
					<Minimize2 className="h-3 w-3" />
				</Button>
			</div>

			{/* Scrollable preview. We render the exact same CampaignPreviewCard as
			    the standalone /campaigns/[id]/preview page so the edit-mode live
			    preview is identical to the published creator-facing page. */}
			<div className="flex-1 overflow-y-auto">
				<div className="mx-auto max-w-sm">
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
				</div>
			</div>
		</div>
	);
}
