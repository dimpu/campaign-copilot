import { ArrowLeft, Pencil } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DashboardTabs } from "@/components/campaign-dashboard/dashboard-tabs";
import { KpiCards } from "@/components/campaign-dashboard/kpi-cards";
import { RegionBar } from "@/components/campaign-dashboard/region-bar";
import { TierDonut } from "@/components/campaign-dashboard/tier-donut";
import { TimelineGantt } from "@/components/campaign-dashboard/timeline-gantt";
import { CampaignQrPopover } from "@/components/campaign-preview/campaign-qr-popover";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth/auth";
import {
	getAuditLogForCampaign,
	getCampaign,
	getCopyForCampaign,
	getMessagesForCampaign,
} from "@/lib/db/queries";
import type { CampaignConfig } from "@/lib/schemas/campaign-config";

export default async function CampaignDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const session = await auth();
	if (!session?.user) redirect("/login");

	const { id } = await params;
	const campaign = await getCampaign(id);
	if (!campaign) {
		return (
			<div className="flex flex-col items-center justify-center h-[60vh] gap-4">
				<h1 className="text-2xl font-bold">Campaign Not Found</h1>
				<p className="text-text-secondary">
					The campaign you&apos;re looking for doesn&apos;t exist.
				</p>
				<Link href="/campaigns">
					<Button>Back to Campaigns</Button>
				</Link>
			</div>
		);
	}

	const config: CampaignConfig = JSON.parse(campaign.config);
	const copy = await getCopyForCampaign(id);
	const _messages = await getMessagesForCampaign(id);
	const audit = await getAuditLogForCampaign(id);

	return (
		<div className="space-y-6 p-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Link href="/campaigns">
						<Button variant="ghost" size="icon">
							<ArrowLeft className="h-4 w-4" />
						</Button>
					</Link>
					<div>
						<h1 className="text-2xl font-bold">{campaign.name}</h1>
						<p className="text-sm text-text-secondary">
							Created {new Date(campaign.createdAt).toLocaleDateString()} ·{" "}
							{campaign.status}
						</p>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<CampaignQrPopover campaignId={id} campaignName={campaign.name} />
					<Link href={`/campaigns/${id}/edit`}>
						<Button variant="outline" size="sm">
							<Pencil className="h-4 w-4" />
							Edit
						</Button>
					</Link>
				</div>
			</div>

			{/* KPI Cards */}
			<KpiCards campaign={campaign} config={config} />

			{/* Charts row */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<TierDonut config={config} />
				<RegionBar config={config} />
				<TimelineGantt config={config} />
			</div>

			{/* Tabs: Copy, Creators, Audit */}
			<DashboardTabs
				campaignId={id}
				config={config}
				copy={copy}
				audit={audit}
			/>
		</div>
	);
}
