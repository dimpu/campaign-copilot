"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { CampaignForm } from "@/components/campaign-form/campaign-form";
import { LivePreviewPanel } from "@/components/campaign-preview/live-preview-panel";
import { ChatPanel } from "@/components/chat/chat-panel";
import { Button } from "@/components/ui/button";
import type { CampaignConfig } from "@/lib/schemas/campaign-config";
import { useDraftStore } from "@/lib/store/draft-store";

export default function NewCampaignPage() {
	const router = useRouter();
	const mergeConfig = useDraftStore((s) => s.mergeConfig);

	const handleConfigUpdate = useCallback(
		(patch: Partial<CampaignConfig>) => {
			mergeConfig(patch, "ai");
		},
		[mergeConfig],
	);

	return (
		<div className="h-[calc(100vh-4rem)] flex flex-col">
			{/* Top bar */}
			<div className="flex items-center gap-3 px-4 py-2 border-b border-border">
				<Button
					variant="ghost"
					size="icon"
					onClick={() => router.push("/campaigns")}
				>
					<ArrowLeft className="h-4 w-4" />
				</Button>
				<h1 className="text-sm font-semibold">New Campaign</h1>
				<span className="text-xs text-text-muted">
					Describe your campaign in chat or fill the form directly
				</span>
			</div>

			{/* Three-column split pane: Chat | Form | Live Preview */}
			<PanelGroup direction="horizontal" className="flex-1">
				<Panel defaultSize={35} minSize={25}>
					<ChatPanel campaignId={null} onConfigUpdate={handleConfigUpdate} />
				</Panel>
				<PanelResizeHandle className="w-1 bg-border hover:bg-primary/50 transition-colors cursor-col-resize" />
				<Panel defaultSize={40} minSize={30}>
					<CampaignForm />
				</Panel>
				<PanelResizeHandle className="w-1 bg-border hover:bg-primary/50 transition-colors cursor-col-resize" />
				<Panel defaultSize={25} minSize={10} collapsible>
					<LivePreviewPanel />
				</Panel>
			</PanelGroup>
		</div>
	);
}
