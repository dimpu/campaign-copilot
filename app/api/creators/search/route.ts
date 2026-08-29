import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { searchCreators } from "@/lib/db/queries";
import { CreatorSearchQuerySchema } from "@/lib/schemas/campaign-config";

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
		const parsed = CreatorSearchQuerySchema.safeParse(searchParams);
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

		const result = await searchCreators(parsed.data);

		// Parse JSON fields for each creator
		const items = result.items.map((c) => ({
			...c,
			categories: c.categories ? JSON.parse(c.categories as string) : [],
			preferredLanguages: c.preferredLanguages
				? JSON.parse(c.preferredLanguages as string)
				: [],
		}));

		return NextResponse.json({
			ok: true,
			creators: items,
			total: result.total,
			page: result.page,
			pageSize: result.pageSize,
		});
	} catch (error) {
		console.error("[creators/search] Error:", error);
		return NextResponse.json(
			{ ok: false, error: "Failed to search creators" },
			{ status: 500 },
		);
	}
}
