"use client";

import type { Message } from "ai/react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { CampaignForm } from "@/components/campaign-form/campaign-form";
import { LivePreviewPanel } from "@/components/campaign-preview/live-preview-panel";
import { ChatPanel } from "@/components/chat/chat-panel";
import { Button } from "@/components/ui/button";
import type {
	CampaignConfig,
	SimulationResult,
	ValidationIssue,
} from "@/lib/schemas/campaign-config";
import { createDefaultConfig } from "@/lib/schemas/campaign-config";
import { deepMergeConfig, useDraftStore } from "@/lib/store/draft-store";

interface CampaignRow {
	id: string;
	name: string;
	status: string;
	config: CampaignConfig;
	validationIssues: ValidationIssue[] | null;
	reasoningTrace: unknown | null;
	estimatedReach: number | null;
	estimatedCost: number | null;
	estimatedCpa: number | null;
	estimatedRoi: number | null;
	eligibleCreatorCount: number | null;
}

interface StoredMessage {
	id: string;
	role: "user" | "assistant" | "system" | "tool";
	content: string;
}

export default function EditCampaignPage() {
	const router = useRouter();
	const params = useParams<{ id: string }>();
	const id = params.id;

	const mergeConfig = useDraftStore((s) => s.mergeConfig);
	const setCampaignId = useDraftStore((s) => s.setCampaignId);
	const setConfig = useDraftStore((s) => s.setConfig);
	const setIssues = useDraftStore((s) => s.setIssues);
	const setEstimate = useDraftStore((s) => s.setEstimate);
	const setCopy = useDraftStore((s) => s.setCopy);
	const setStatus = useDraftStore((s) => s.setStatus);

	const [history, setHistory] = useState<Message[] | null>(null);
	const [loadError, setLoadError] = useState<string | null>(null);

	const handleConfigUpdate = useCallback(
		(patch: Partial<CampaignConfig>) => {
			mergeConfig(patch, "ai");
		},
		[mergeConfig],
	);

	useEffect(() => {
		if (!id) return;
		let cancelled = false;

		async function load() {
			try {
				const res = await fetch(`/api/campaigns/${id}`, {
					cache: "no-store",
				});
				if (!res.ok) throw new Error(`Failed to load campaign (${res.status})`);
				const data = await res.json();
				if (!data?.ok || !data.campaign) {
					throw new Error(data?.error ?? "Campaign not found");
				}
				if (cancelled) return;

				const c = data.campaign as CampaignRow;

				// Pin this campaign in the store so chat/API calls target it.
				setCampaignId(id);
				setStatus(c.status);

				// Restore creator-facing copy so the live preview matches the
				// standalone /campaigns/[id]/preview page exactly.
				const copyRecords = (data.copy ?? []) as Array<{
					locale: string;
					title: string;
					body: string;
					ctaText: string;
					subject?: string | null;
					hashtags?: string | null;
				}>;
				setCopy(
					copyRecords.map((rec) => ({
						locale: rec.locale,
						title: rec.title,
						body: rec.body,
						ctaText: rec.ctaText,
						subject: rec.subject ?? null,
						hashtags:
							rec.hashtags != null
								? Array.isArray(rec.hashtags)
									? rec.hashtags.join(", ")
									: String(rec.hashtags)
								: null,
					})),
				);

				// Pre-populate the form: merge the stored config over defaults so
				// every required field is present even if older rows are partial.
				const config = deepMergeConfig(
					createDefaultConfig(),
					(c.config ?? {}) as Partial<CampaignConfig>,
				);
				setConfig(config);

				const issues = c.validationIssues ?? [];
				setIssues(issues);

				// Restore the live estimate card if the campaign was simulated.
				const hasEstimate =
					c.estimatedReach != null ||
					c.estimatedCost != null ||
					c.estimatedCpa != null ||
					c.estimatedRoi != null ||
					c.eligibleCreatorCount != null;
				if (hasEstimate) {
					const estimate: SimulationResult = {
						estimatedReach: c.estimatedReach ?? 0,
						estimatedCost: c.estimatedCost ?? 0,
						estimatedCpa: c.estimatedCpa ?? 0,
						estimatedRoi: c.estimatedRoi ?? 0,
						eligibleCreatorCount: c.eligibleCreatorCount ?? 0,
						estimatedAcceptanceRate: 0,
						actualCreators: c.eligibleCreatorCount ?? 0,
						issues,
						eligibleSample: [],
					};
					setEstimate(estimate);
				}

				// Restore chat history for the panel.
				const messages = (data.messages ?? []) as StoredMessage[];
				const restored: Message[] = messages
					.filter((m) => m.role === "user" || m.role === "assistant")
					.map((m) => ({
						id: m.id,
						role: (m.role === "user" ? "user" : "assistant") as Message["role"],
						content: m.content,
					}));
				setHistory(restored);
			} catch (err) {
				if (!cancelled) {
					setLoadError(
						err instanceof Error ? err.message : "Failed to load campaign",
					);
				}
			}
		}

		load();
		return () => {
			cancelled = true;
		};
	}, [
		id,
		setCampaignId,
		setConfig,
		setIssues,
		setEstimate,
		setCopy,
		setStatus,
	]);

	if (loadError) {
		return (
			<div className="h-[calc(100vh-4rem)] flex flex-col items-center justify-center gap-3">
				<p className="text-sm text-destructive">{loadError}</p>
				<Button variant="outline" onClick={() => router.push("/campaigns")}>
					Back to campaigns
				</Button>
			</div>
		);
	}

	if (!history) {
		return (
			<div className="h-[calc(100vh-4rem)] flex flex-col items-center justify-center gap-3 text-text-muted">
				<Loader2 className="h-6 w-6 animate-spin text-primary" />
				<span className="text-sm">Loading campaign…</span>
			</div>
		);
	}

	return (
		<div className="h-[calc(100vh-4rem)] flex flex-col">
			<div className="flex items-center gap-3 px-4 py-2 border-b border-border">
				<Button
					variant="ghost"
					size="icon"
					onClick={() => router.push(`/campaigns/${id}`)}
				>
					<ArrowLeft className="h-4 w-4" />
				</Button>
				<h1 className="text-sm font-semibold">Edit Campaign</h1>
			</div>

			{/* Three-column split pane: Chat | Form | Live Preview */}
			<PanelGroup direction="horizontal" className="flex-1">
				<Panel defaultSize={35} minSize={25}>
					<ChatPanel
						campaignId={id}
						initialMessages={history}
						onConfigUpdate={handleConfigUpdate}
					/>
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
