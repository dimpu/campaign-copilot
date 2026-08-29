import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { createCampaign, listCampaigns } from "@/lib/db/queries";
import { CreateCampaignRequestSchema } from "@/lib/schemas/api";
import { CampaignListQuerySchema } from "@/lib/schemas/campaign-config";
import { validateCampaign } from "@/lib/services/validator";
import { generateId, slugify } from "@/lib/utils";

export async function GET(request: NextRequest) {
	try {
		const session = await auth();
		if (!session?.user) {
			return NextResponse.json(
				{ ok: false, error: "Unauthorized" },
				{ status: 401 },
			);
		}

		const searchParams = Object.fromEntries(
			request.nextUrl.searchParams.entries(),
		);
		const parsed = CampaignListQuerySchema.safeParse(searchParams);
		if (!parsed.success) {
			return NextResponse.json(
				{
					ok: false,
					error: "Invalid query parameters",
					details: parsed.error.flatten(),
				},
				{ status: 400 },
			);
		}

		const result = await listCampaigns({
			...parsed.data,
			userId: (session.user as { id: string }).id,
		});

		return NextResponse.json({ ok: true, ...result });
	} catch (error) {
		console.error("[campaigns] GET error:", error);
		return NextResponse.json(
			{ ok: false, error: "Failed to list campaigns" },
			{ status: 500 },
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		const session = await auth();
		if (!session?.user) {
			return NextResponse.json(
				{ ok: false, error: "Unauthorized" },
				{ status: 401 },
			);
		}

		const userId = (session.user as { id: string }).id;

		const body = await request.json();
		const parsed = CreateCampaignRequestSchema.safeParse(body);
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

		const { description, config } = parsed.data;

		// Derive name from description or config
		let name = config?.campaignName ?? "New Campaign";
		if (description && !config?.campaignName) {
			name = description.slice(0, 80);
		}

		const slug = `${slugify(name)}-${generateId().slice(0, 6)}`;

		const campaign = await createCampaign({
			name,
			slug,
			description: description ?? undefined,
			createdBy: userId,
			config: config ?? {},
		});

		if (!campaign) {
			return NextResponse.json(
				{ ok: false, error: "Failed to create campaign" },
				{ status: 500 },
			);
		}

		// Run initial validation
		const parsedConfig = JSON.parse(campaign.config);
		const issues = validateCampaign(parsedConfig);

		return NextResponse.json(
			{
				ok: true,
				id: campaign.id,
				status: campaign.status,
				config: parsedConfig,
				issues,
			},
			{ status: 201 },
		);
	} catch (error) {
		console.error("[campaigns] POST error:", error);
		return NextResponse.json(
			{ ok: false, error: "Failed to create campaign" },
			{ status: 500 },
		);
	}
}
