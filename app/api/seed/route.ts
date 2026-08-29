import { execSync } from "node:child_process";
import { NextResponse } from "next/server";

export async function POST() {
	// Only allow in development
	if (process.env.NODE_ENV !== "development") {
		return NextResponse.json(
			{ ok: false, error: "Seed endpoint only available in development mode" },
			{ status: 403 },
		);
	}

	try {
		console.log("[seed] Running seed script...");
		execSync("npx tsx scripts/seed.ts", {
			cwd: process.cwd(),
			stdio: "inherit",
			timeout: 60_000,
		});

		return NextResponse.json({
			ok: true,
			message:
				"Database seeded successfully with 20,000 creators and demo user",
		});
	} catch (error) {
		console.error("[seed] Error:", error);
		const message = error instanceof Error ? error.message : "Unknown error";
		return NextResponse.json(
			{ ok: false, error: `Seed failed: ${message}` },
			{ status: 500 },
		);
	}
}
