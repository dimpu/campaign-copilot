import { eq } from "drizzle-orm";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db, schema } from "@/lib/db";
import { generateId, now } from "@/lib/utils";
import { verifyOtp } from "./otp";

const { users } = schema;

export const { handlers, signIn, signOut, auth } = NextAuth({
	providers: [
		Credentials({
			name: "OTP",
			credentials: {
				email: { label: "Email", type: "email" },
				code: { label: "Code", type: "text" },
			},
			async authorize(credentials) {
				if (!credentials?.email || !credentials?.code) return null;

				const email = credentials.email as string;
				const code = credentials.code as string;

				const isValid = await verifyOtp(email, code);
				if (!isValid) return null;

				// Find or create user
				let row = db
					.select()
					.from(users)
					.where(eq(users.email, email))
					.all()[0];

				if (!row) {
					const id = generateId();
					const ts = now();
					db.insert(users)
						.values({
							id,
							email,
							name: email.split("@")[0],
							role: "ops",
							createdAt: ts,
							lastLoginAt: ts,
						})
						.run();
					row = {
						id,
						email,
						name: email.split("@")[0],
						role: "ops",
					} as typeof row;
				} else {
					db.update(users)
						.set({ lastLoginAt: now() })
						.where(eq(users.id, row.id))
						.run();
				}

				return {
					id: row.id,
					email: row.email,
					name: row.name,
					role: row.role,
				};
			},
		}),
	],
	pages: {
		signIn: "/login",
	},
	callbacks: {
		async jwt({ token, user }) {
			if (user) {
				token.id = user.id;
				token.role = (user as Record<string, unknown>).role;
			}
			return token;
		},
		async session({ session, token }) {
			if (session.user) {
				(session.user as unknown as Record<string, unknown>).id =
					token.id as string;
				(session.user as unknown as Record<string, unknown>).role =
					(token.role as string) ?? "ops";
			}
			return session;
		},
	},
	session: {
		strategy: "jwt",
	},
});
