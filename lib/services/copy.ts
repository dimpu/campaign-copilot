import {
	deleteCopyForCampaign,
	getCopyForCampaign,
	upsertCopy,
} from "@/lib/db/queries";
import type { CopyVariant } from "@/lib/schemas/campaign-config";

export async function saveCopyVariants(
	campaignId: string,
	variants: CopyVariant[],
) {
	// Delete existing copy for this campaign
	await deleteCopyForCampaign(campaignId);

	// Insert new variants
	for (let i = 0; i < variants.length; i++) {
		const v = variants[i];
		await upsertCopy({
			campaignId,
			locale: v.locale,
			variant: i,
			subject: v.subject ?? null,
			title: v.title,
			body: v.body,
			ctaText: v.ctaText,
			hashtags: v.hashtags ?? [],
			tone: v.tone ?? null,
			model: v.locale, // echo locale as model for now
		});
	}

	return getCopyForCampaign(campaignId);
}

export async function getCampaignCopy(campaignId: string) {
	return getCopyForCampaign(campaignId);
}
