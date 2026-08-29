import { addAuditEntry, getCampaign, updateCampaign } from "@/lib/db/queries";
import type { CampaignConfig } from "@/lib/schemas/campaign-config";
import { validateCampaign } from "./validator";

export async function publishCampaign(campaignId: string, userId: string) {
	const campaign = await getCampaign(campaignId);
	if (!campaign) throw new Error("Campaign not found");

	const config = JSON.parse(campaign.config) as CampaignConfig;
	const issues = validateCampaign(config);
	const hasErrors = issues.some((i) => i.level === "error");

	if (hasErrors) {
		throw new Error(
			`Cannot publish: ${issues
				.filter((i) => i.level === "error")
				.map((i) => i.message)
				.join("; ")}`,
		);
	}

	const published = await updateCampaign(campaignId, {
		status: "published",
		publishedAt: Date.now(),
		validationIssues: issues,
	});

	await addAuditEntry({
		campaignId,
		userId,
		action: "publish",
		delta: { previousStatus: campaign.status },
	});

	return published;
}

export async function archiveCampaign(campaignId: string, userId: string) {
	const campaign = await getCampaign(campaignId);
	if (!campaign) throw new Error("Campaign not found");

	const archived = await updateCampaign(campaignId, { status: "archived" });

	await addAuditEntry({
		campaignId,
		userId,
		action: "archive",
		delta: { previousStatus: campaign.status },
	});

	return archived;
}
