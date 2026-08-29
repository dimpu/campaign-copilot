import { addAuditEntry, getAuditLogForCampaign } from "@/lib/db/queries";

export async function logAudit(params: {
	campaignId: string;
	userId: string;
	action: string;
	delta?: unknown;
}) {
	return addAuditEntry(params);
}

export async function getAuditTrail(campaignId: string) {
	return getAuditLogForCampaign(campaignId);
}
