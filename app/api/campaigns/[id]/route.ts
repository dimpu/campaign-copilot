import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import {
	deleteCampaign,
	getCampaign,
	getCopyForCampaign,
	getMessagesForCampaign,
	updateCampaign,
} from "@/lib/db/queries";
import { UpdateCampaignRequestSchema } from "@/lib/schemas/api";
import { logAudit } from "@/lib/services/audit";
import { validateCampaign } from "@/lib/services/validator";

export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const session = await auth();
		if (!session?.user) {
			return NextResponse.json(
				{ ok: false, error: "Unauthorized" },
				{ status: 401 },
			);
		}

		const { id } = await params;
		const campaign = await getCampaign(id);
		if (!campaign) {
			return NextResponse.json(
				{ ok: false, error: "Campaign not found" },
				{ status: 404 },
			);
		}

		const copy = await getCopyForCampaign(id);
		const messages = await getMessagesForCampaign(id);

		return NextResponse.json({
			ok: true,
			campaign: {
				...campaign,
				config: JSON.parse(campaign.config),
				validationIssues: campaign.validationIssues
					? JSON.parse(campaign.validationIssues)
					: null,
				reasoningTrace: campaign.reasoningTrace
					? JSON.parse(campaign.reasoningTrace)
					: null,
			},
			copy,
			messages,
		});
	} catch (error) {
		console.error("[campaigns/:id] GET error:", error);
		return NextResponse.json(
			{ ok: false, error: "Failed to get campaign" },
			{ status: 500 },
		);
	}
}

export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const session = await auth();
		if (!session?.user) {
			return NextResponse.json(
				{ ok: false, error: "Unauthorized" },
				{ status: 401 },
			);
		}

		const userId = (session.user as { id: string }).id;
		const { id } = await params;

		const existing = await getCampaign(id);
		if (!existing) {
			return NextResponse.json(
				{ ok: false, error: "Campaign not found" },
				{ status: 404 },
			);
		}

		const body = await request.json();
		const parsed = UpdateCampaignRequestSchema.safeParse(body);
		if (!parsed.success) {
			return NextResponse.json(
				{
					ok: false,
					error: "Invalid request body",
					details: parsed.error.flatten(),
				},
				{ status: 400 },
			);
		}

		const { config, name, status } = parsed.data;

		const updated = await updateCampaign(id, { config, name, status });

		if (!updated) {
			return NextResponse.json(
				{ ok: false, error: "Failed to update campaign" },
				{ status: 500 },
			);
		}

		// Run validation if config was updated
		let issues = null;
		if (config) {
			const parsedConfig = JSON.parse(updated.config);
			issues = validateCampaign(parsedConfig);
		}

		// Log audit
		await logAudit({
			campaignId: id,
			userId,
			action: "update",
			delta: parsed.data,
		});

		return NextResponse.json({
			ok: true,
			campaign: {
				...updated,
				config: JSON.parse(updated.config),
				validationIssues: updated.validationIssues
					? JSON.parse(updated.validationIssues)
					: null,
			},
			issues,
		});
	} catch (error) {
		console.error("[campaigns/:id] PATCH error:", error);
		return NextResponse.json(
			{ ok: false, error: "Failed to update campaign" },
			{ status: 500 },
		);
	}
}

export async function DELETE(
	_request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const session = await auth();
		if (!session?.user) {
			return NextResponse.json(
				{ ok: false, error: "Unauthorized" },
				{ status: 401 },
			);
		}

		const { id } = await params;

		const existing = await getCampaign(id);
		if (!existing) {
			return NextResponse.json(
				{ ok: false, error: "Campaign not found" },
				{ status: 404 },
			);
		}

		await deleteCampaign(id);

		return NextResponse.json({ ok: true });
	} catch (error) {
		console.error("[campaigns/:id] DELETE error:", error);
		return NextResponse.json(
			{ ok: false, error: "Failed to delete campaign" },
			{ status: 500 },
		);
	}
}
