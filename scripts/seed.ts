import { faker } from "@faker-js/faker";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "../lib/db/schema";
import { generateId, now } from "../lib/utils";

const DB_PATH = process.env.DATABASE_URL?.replace("file:", "") || "local.db";

function main() {
	console.log("🌱 Seeding Campaign Copilot database...");

	const sqlite = new Database(DB_PATH);
	sqlite.pragma("journal_mode = WAL");
	sqlite.pragma("foreign_keys = ON");
	const db = drizzle(sqlite, { schema });

	// Set seed for deterministic output
	faker.seed(42);

	// ── Wipe existing data ──
	console.log("  Clearing existing data...");
	db.delete(schema.auditLog).run();
	db.delete(schema.conversationMessages).run();
	db.delete(schema.generatedCopy).run();
	db.delete(schema.campaigns).run();
	db.delete(schema.creatorProfiles).run();
	db.delete(schema.otpCodes).run();
	db.delete(schema.users).run();

	// ── Create demo user ──
	console.log("  Creating demo user...");
	const ts = now();
	db.insert(schema.users)
		.values({
			id: generateId(),
			email: "demo@bytedance.com",
			name: "Demo User",
			role: "ops",
			createdAt: ts,
			lastLoginAt: ts,
		})
		.run();

	// ── Create 20,000 creators ──
	console.log("  Generating 20,000 creator profiles...");

	const regionDistribution: [string, number][] = [
		["ID", 0.25],
		["US", 0.15],
		["TH", 0.12],
		["VN", 0.12],
		["BR", 0.1],
		["MX", 0.08],
		["MY", 0.06],
		["PH", 0.06],
		["GB", 0.04],
		["SG", 0.02],
	];

	const tierDistribution: [string, number, number, number][] = [
		["nano", 0.5, 1_000, 10_000],
		["micro", 0.28, 10_000, 50_000],
		["mid", 0.14, 50_000, 200_000],
		["macro", 0.06, 200_000, 1_000_000],
		["mega", 0.02, 1_000_000, 5_000_000],
	];

	const categoryDistribution: [string, number][] = [
		["fashion", 0.22],
		["beauty", 0.18],
		["food", 0.13],
		["tech", 0.1],
		["home", 0.09],
		["fitness", 0.08],
		["parenting", 0.07],
		["gaming", 0.06],
		["pets", 0.04],
		["automotive", 0.03],
	];

	const regionLanguages: Record<string, string[]> = {
		US: ["en"],
		GB: ["en"],
		ID: ["id", "en"],
		TH: ["th"],
		VN: ["vi"],
		MY: ["ms", "en"],
		PH: ["tl", "en"],
		BR: ["pt-BR"],
		MX: ["es"],
		SG: ["en"],
	};

	function pickWeighted<T>(items: [T, number][]): T {
		const r = faker.number.float({ min: 0, max: 1, fractionDigits: 4 });
		let cumulative = 0;
		for (const [item, weight] of items) {
			cumulative += weight;
			if (r <= cumulative) return item;
		}
		return items[items.length - 1][0];
	}

	function pickTier(): [string, number, number] {
		const r = faker.number.float({ min: 0, max: 1, fractionDigits: 4 });
		let cumulative = 0;
		for (const [tier, weight, min, max] of tierDistribution) {
			cumulative += weight;
			if (r <= cumulative) return [tier, min, max];
		}
		return tierDistribution[tierDistribution.length - 1].slice(0, 3) as [
			string,
			number,
			number,
		];
	}

	const engagementRateByTier: Record<string, [number, number]> = {
		nano: [0.03, 0.1],
		micro: [0.02, 0.07],
		mid: [0.015, 0.05],
		macro: [0.01, 0.03],
		mega: [0.005, 0.02],
	};

	const gmvByTier: Record<string, [number, number]> = {
		nano: [50, 500],
		micro: [200, 3_000],
		mid: [1_000, 15_000],
		macro: [5_000, 50_000],
		mega: [20_000, 200_000],
	};

	// Batch insert in chunks of 1000
	const BATCH_SIZE = 1000;
	const TOTAL = 20_000;

	for (let batch = 0; batch < TOTAL; batch += BATCH_SIZE) {
		const batchEnd = Math.min(batch + BATCH_SIZE, TOTAL);
		const values = [];

		for (let i = batch; i < batchEnd; i++) {
			const region = pickWeighted(regionDistribution);
			const [tier, tierMin, tierMax] = pickTier();
			const primaryCategory = pickWeighted(categoryDistribution);
			const subscriberCount = faker.number.int({ min: tierMin, max: tierMax });

			// Secondary categories (1-2 additional)
			const numExtra = faker.number.int({ min: 0, max: 2 });
			const otherCategories = categoryDistribution
				.filter(([c]) => c !== primaryCategory)
				.map(([c]) => c);
			const extraCategories = faker.helpers.arrayElements(
				otherCategories,
				numExtra,
			);
			const categories = [primaryCategory, ...extraCategories];

			// Engagement rate inversely correlated with followers
			const [engMin, engMax] = engagementRateByTier[tier];
			const engagementRate = faker.number.float({
				min: engMin,
				max: engMax,
				fractionDigits: 4,
			});

			// GMV log-normal, scaled by tier
			const [gmvMin, gmvMax] = gmvByTier[tier];
			const gmv90d =
				Math.round(
					faker.number.float({ min: gmvMin, max: gmvMax, fractionDigits: 2 }) *
						100,
				) / 100;

			// Avg views
			const avgViews = Math.round(
				subscriberCount *
					faker.number.float({ min: 0.05, max: 0.4, fractionDigits: 2 }),
			);

			// AOV
			const avgOrderValue =
				Math.round(
					faker.number.float({ min: 8, max: 80, fractionDigits: 2 }) * 100,
				) / 100;

			// Languages
			const possibleLanguages = regionLanguages[region] ?? ["en"];
			const numLanguages = faker.number.int({
				min: 1,
				max: Math.min(2, possibleLanguages.length),
			});
			const preferredLanguages = possibleLanguages.slice(0, numLanguages);

			values.push({
				id: `cr_${String(i).padStart(8, "0")}`,
				handle: `@${faker.internet.username().toLowerCase().slice(0, 14)}_${String(i).padStart(5, "0")}`,
				displayName: faker.person.fullName(),
				avatarColor: faker.color.rgb({ format: "hex" }),
				region,
				primaryCategory,
				categories: JSON.stringify(categories),
				followerTier: tier,
				followerCount: subscriberCount,
				avgViews,
				engagementRate,
				gmv90d,
				avgOrderValue,
				pastCampaignCount: faker.number.int({ min: 0, max: 15 }),
				lastCampaignAt:
					faker.number.int({ min: 0, max: 1 }) > 0.7
						? faker.date.past().getTime()
						: null,
				preferredLanguages: JSON.stringify(preferredLanguages),
				isVerified: faker.number.int({ min: 0, max: 1 }) > 0.85,
				isAffiliate: faker.number.int({ min: 0, max: 1 }) > 0.1,
				createdAt: faker.date.past({ years: 2 }).getTime(),
			});
		}

		db.insert(schema.creatorProfiles)
			.values(values as never[])
			.run();
		console.log(
			`    ... ${batchEnd.toLocaleString()}/${TOTAL.toLocaleString()} creators`,
		);
	}

	console.log(
		`✅ Seed complete! Created ${TOTAL.toLocaleString()} creators + 1 demo user.`,
	);
	console.log(
		`   Demo login: demo@bytedance.com (OTP shown on screen in dev mode)`,
	);
}

main();
