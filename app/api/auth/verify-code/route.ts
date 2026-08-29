import { NextResponse } from "next/server";
import { signIn } from "@/lib/auth/auth";

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { email, code } = body;

		if (!email || typeof email !== "string") {
			return NextResponse.json(
				{ ok: false, error: "Email is required" },
				{ status: 400 },
			);
		}

		if (!code || typeof code !== "string") {
			return NextResponse.json(
				{ ok: false, error: "Code is required" },
				{ status: 400 },
			);
		}

		const result = await signIn("credentials", {
			email,
			code,
			redirect: false,
		});

		if (result?.error) {
			return NextResponse.json(
				{ ok: false, error: "Invalid or expired code" },
				{ status: 401 },
			);
		}

		return NextResponse.json({ ok: true });
	} catch (error) {
		console.error("[verify-code] Error:", error);
		return NextResponse.json(
			{ ok: false, error: "Failed to verify code" },
			{ status: 500 },
		);
	}
}
