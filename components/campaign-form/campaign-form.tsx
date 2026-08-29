"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Sparkles } from "lucide-react";
import { useEffect, useRef } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { Card } from "@/components/ui/card";
import type { CampaignConfig } from "@/lib/schemas/campaign-config";
import {
	CampaignConfigSchema,
	createDefaultConfig,
} from "@/lib/schemas/campaign-config";
import { useDraftStore } from "@/lib/store/draft-store";
import { ActionBar } from "./action-bar";
import { BasicsSection } from "./basics-section";
import { BudgetTimelineSection } from "./budget-timeline-section";
import { ContentSection } from "./content-section";
import { CopySection } from "./copy-section";
import { EligibilitySection } from "./eligibility-section";
import { EstimateCard } from "./estimate-card";
import { RewardSection } from "./reward-section";

export function CampaignForm() {
	const config = useDraftStore((s) => s.config);
	const mergeConfig = useDraftStore((s) => s.mergeConfig);
	const estimate = useDraftStore((s) => s.estimate);

	const form = useForm<CampaignConfig>({
		resolver: zodResolver(CampaignConfigSchema) as never,
		defaultValues: config ?? createDefaultConfig(),
		mode: "onTouched",
	});

	// Tracks the serialized config we last pushed into the form (or mirrored out
	// of it). Both directions of the form <-> store sync compare against this so
	// that a store update produced by our own watch subscription does not
	// re-trigger a form reset, which would otherwise ping-pong forever:
	//   watch -> mergeConfig -> config change -> reset -> watch -> ...
	const lastSyncedRef = useRef<string>(
		JSON.stringify(config ?? createDefaultConfig()),
	);

	// Seed the store with the form's default values on first mount.
	useEffect(() => {
		if (config === null) {
			mergeConfig(form.getValues(), "user");
		}
	}, [config, form, mergeConfig]);

	// Push external config changes (e.g. AI patches) into the form, but only
	// when the values actually differ from what we last synced.
	useEffect(() => {
		if (!config) return;
		const serialized = JSON.stringify(config);
		if (serialized === lastSyncedRef.current) return;
		lastSyncedRef.current = serialized;
		form.reset(config, { keepDefaultValues: false });
	}, [config, form]);

	// Mirror user edits back into the store (used for the chat request payload).
	useEffect(() => {
		const subscription = form.watch((values) => {
			const serialized = JSON.stringify(values);
			if (serialized === lastSyncedRef.current) return;
			lastSyncedRef.current = serialized;
			mergeConfig(values as CampaignConfig, "user");
		});
		return () => subscription.unsubscribe();
	}, [form, mergeConfig]);

	return (
		<FormProvider {...form}>
			<div className="flex flex-col h-full overflow-hidden">
				<div className="flex items-center justify-between p-4 border-b border-border">
					<div className="flex items-center gap-2">
						<Sparkles className="h-4 w-4 text-primary" />
						<h2 className="text-sm font-semibold">Campaign Configuration</h2>
					</div>
				</div>

				<div className="flex-1 overflow-y-auto p-4 space-y-6">
					<BasicsSection />
					<EligibilitySection />
					<RewardSection />
					<BudgetTimelineSection />
					<ContentSection />
					<CopySection />

					{estimate && (
						<Card className="p-4">
							<EstimateCard estimate={estimate} />
						</Card>
					)}
				</div>

				<ActionBar />
			</div>
		</FormProvider>
	);
}
