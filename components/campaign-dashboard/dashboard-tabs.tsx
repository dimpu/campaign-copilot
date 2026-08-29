"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CampaignConfig } from "@/lib/schemas/campaign-config";
import type { CopyRecord } from "@/lib/schemas/copy";
import { AuditTimeline } from "./audit-timeline";
import { CopyTab } from "./copy-tab";
import { MatchingCreatorsTable } from "./matching-creators-table";

export function DashboardTabs({
	campaignId,
	config,
	copy,
	audit,
}: {
	campaignId: string;
	config: CampaignConfig;
	copy: CopyRecord[];
	audit: Array<{
		id: string;
		campaignId: string;
		userId: string;
		action: string;
		delta?: string | null;
		createdAt: number;
	}>;
}) {
	return (
		<Tabs defaultValue="copy" className="w-full">
			<TabsList>
				<TabsTrigger value="copy">Copy ({copy.length})</TabsTrigger>
				<TabsTrigger value="creators">Matching Creators</TabsTrigger>
				<TabsTrigger value="audit">Audit Log</TabsTrigger>
			</TabsList>
			<TabsContent value="copy">
				<CopyTab copy={copy} campaignId={campaignId} config={config} />
			</TabsContent>
			<TabsContent value="creators">
				<MatchingCreatorsTable config={config} />
			</TabsContent>
			<TabsContent value="audit">
				<AuditTimeline audit={audit} />
			</TabsContent>
		</Tabs>
	);
}
