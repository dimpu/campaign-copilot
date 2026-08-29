import { CampaignPreviewCard } from "@/components/campaign-preview/campaign-preview-card";
import { PhoneFrame } from "@/components/campaign-preview/phone-frame";
import { getCampaign, getCopyForCampaign } from "@/lib/db/queries";
import type { CampaignConfig } from "@/lib/schemas/campaign-config";

export default async function CampaignPreviewPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const campaign = await getCampaign(id);

	if (!campaign) {
		return (
			<div className="flex flex-col items-center justify-center min-h-screen bg-bg-dark gap-4 px-6">
				<div className="text-5xl">🔍</div>
				<h1 className="text-xl font-bold text-text-primary">
					Campaign Not Found
				</h1>
				<p className="text-sm text-text-secondary text-center max-w-xs">
					This campaign may have been removed or the link is invalid.
				</p>
			</div>
		);
	}

	const config: CampaignConfig = JSON.parse(campaign.config);
	const copyRecords = await getCopyForCampaign(id);

	const copy = copyRecords.map((c) => ({
		locale: c.locale,
		title: c.title,
		body: c.body,
		ctaText: c.ctaText,
		subject: c.subject ?? null,
		hashtags: c.hashtags ?? null,
	}));

	return (
		<div className="min-h-screen bg-bg-dark flex items-start justify-center py-10">
			<PhoneFrame>
				<CampaignPreviewCard
					config={config}
					status={campaign.status}
					campaignName={campaign.name}
					brandName={config.brandName}
					estimatedReach={campaign.estimatedReach}
					eligibleCreatorCount={campaign.eligibleCreatorCount}
					estimatedCost={campaign.estimatedCost}
					copy={copy}
				/>
			</PhoneFrame>
		</div>
	);
}
