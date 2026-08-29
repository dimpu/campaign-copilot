import { type NextRequest, NextResponse } from "next/server";
import { getMockCopyForLocales } from "@/lib/ai/copy-generator";
import { auth } from "@/lib/auth/auth";
import { getCampaign } from "@/lib/db/queries";
import type { CampaignConfig } from "@/lib/schemas/campaign-config";
import { RegenerateCopyRequestSchema } from "@/lib/schemas/copy";
import { saveCopyVariants } from "@/lib/services/copy";

export async function POST(
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

		const { id } = await params;

		const campaign = await getCampaign(id);
		if (!campaign) {
			return NextResponse.json(
				{ ok: false, error: "Campaign not found" },
				{ status: 404 },
			);
		}

		const body = await request.json();
		const parsed = RegenerateCopyRequestSchema.safeParse(body);
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

		const { locales, tone } = parsed.data;
		const config = JSON.parse(campaign.config) as CampaignConfig;

		// Use mock copy generator for now (in production, this would call generateObject)
		const taskType = config.taskType ?? "open_collab";
		const variants = getMockCopyForLocales(locales, taskType);

		// Apply tone override if provided
		if (tone) {
			for (const v of variants) {
				(v as { tone?: string }).tone = tone;
			}
		}

		const saved = await saveCopyVariants(id, variants);

		return NextResponse.json({
			ok: true,
			copy: saved,
		});
	} catch (error) {
		console.error("[campaigns/:id/copy/regenerate] Error:", error);
		return NextResponse.json(
			{ ok: false, error: "Failed to regenerate copy" },
			{ status: 500 },
		);
	}
}
