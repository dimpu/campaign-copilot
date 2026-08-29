import { NextResponse } from "next/server";
import { generateOtp } from "@/lib/auth/otp";

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { email } = body;

		if (!email || typeof email !== "string") {
			return NextResponse.json(
				{ ok: false, error: "Email is required" },
				{ status: 400 },
			);
		}

		const { devCode } = await generateOtp(email);

		return NextResponse.json({
			ok: true,
			...(devCode ? { devCode } : {}),
		});
	} catch (error) {
		console.error("[request-code] Error:", error);
		return NextResponse.json(
			{ ok: false, error: "Failed to generate OTP" },
			{ status: 500 },
		);
	}
}
