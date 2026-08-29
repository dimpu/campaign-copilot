import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getCampaign, updateCampaign } from "@/lib/db/queries";
import type { CampaignConfig } from "@/lib/schemas/campaign-config";
import { CampaignConfigSchema } from "@/lib/schemas/campaign-config";
import { runSimulation } from "@/lib/services/simulator";

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
		let config: CampaignConfig;

		if (body.config) {
			// Use provided config (from request body)
			const parsed = CampaignConfigSchema.safeParse(body.config);
			if (!parsed.success) {
				return NextResponse.json(
					{
						ok: false,
						error: "Invalid config",
						details: parsed.error.flatten(),
					},
					{ status: 400 },
				);
			}
			config = parsed.data;
		} else {
			// Use existing campaign config
			const existingConfig = JSON.parse(campaign.config);
			const parsed = CampaignConfigSchema.safeParse(existingConfig);
			if (!parsed.success) {
				return NextResponse.json(
					{
						ok: false,
						error: "Stored config is invalid",
						details: parsed.error.flatten(),
					},
					{ status: 400 },
				);
			}
			config = parsed.data;
		}

		const result = runSimulation(config);

		// Update campaign with simulation results
		await updateCampaign(id, {
			estimatedReach: result.estimatedReach,
			estimatedCost: result.estimatedCost,
			estimatedCpa: result.estimatedCpa,
			estimatedRoi: result.estimatedRoi,
			eligibleCreatorCount: result.eligibleCreatorCount,
			validationIssues: result.issues,
		});

		return NextResponse.json({
			ok: true,
			estimatedReach: result.estimatedReach,
			estimatedCost: result.estimatedCost,
			estimatedCpa: result.estimatedCpa,
			estimatedRoi: result.estimatedRoi,
			eligibleCreatorCount: result.eligibleCreatorCount,
			estimatedAcceptanceRate: result.estimatedAcceptanceRate,
			actualCreators: result.actualCreators,
			issues: result.issues,
			eligibleSample: result.eligibleSample,
		});
	} catch (error) {
		console.error("[campaigns/:id/simulate] Error:", error);
		return NextResponse.json(
			{ ok: false, error: "Failed to run simulation" },
			{ status: 500 },
		);
	}
}
