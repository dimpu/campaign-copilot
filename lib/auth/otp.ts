import { and, eq, gte, isNull } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { generateId, now } from "@/lib/utils";

const { otpCodes } = schema;

export async function generateOtp(
	email: string,
): Promise<{ code: string; devCode?: string }> {
	const code = Math.floor(100000 + Math.random() * 900000).toString();
	const expiresAt = now() + 10 * 60 * 1000; // 10 minutes

	db.insert(otpCodes)
		.values({
			id: generateId(),
			email,
			code,
			expiresAt,
		})
		.run();

	return {
		code,
		devCode: process.env.NODE_ENV === "development" ? code : undefined,
	};
}

export async function verifyOtp(email: string, code: string): Promise<boolean> {
	const ts = now();

	const record = db
		.select()
		.from(otpCodes)
		.where(
			and(
				eq(otpCodes.email, email),
				eq(otpCodes.code, code),
				isNull(otpCodes.consumedAt),
				gte(otpCodes.expiresAt, ts),
			),
		)
		.all()[0];

	if (!record) return false;

	// Mark consumed
	db.update(otpCodes)
		.set({ consumedAt: ts })
		.where(eq(otpCodes.id, record.id))
		.run();

	return true;
}
