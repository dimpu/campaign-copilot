import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getCampaign } from "@/lib/db/queries";
import { publishCampaign } from "@/lib/services/campaigns";

export async function POST(
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

		const userId = (session.user as { id: string }).id;
		const { id } = await params;

		const existing = await getCampaign(id);
		if (!existing) {
			return NextResponse.json(
				{ ok: false, error: "Campaign not found" },
				{ status: 404 },
			);
		}

		const published = await publishCampaign(id, userId);

		return NextResponse.json({
			ok: true,
			publishedAt: published?.publishedAt ?? Date.now(),
		});
	} catch (error) {
		console.error("[campaigns/:id/publish] Error:", error);
		const message =
			error instanceof Error ? error.message : "Failed to publish campaign";
		const status = message.includes("Cannot publish") ? 400 : 500;
		return NextResponse.json({ ok: false, error: message }, { status });
	}
}
