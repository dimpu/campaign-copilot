import { and, desc, eq, like, sql } from "drizzle-orm";
import type {
	CampaignConfig,
	ValidationIssue,
} from "@/lib/schemas/campaign-config";
import type { CopyRecord } from "@/lib/schemas/copy";
import { generateId, now } from "@/lib/utils";
import { db, schema } from "./index";

const {
	campaigns,
	generatedCopy,
	conversationMessages,
	creatorProfiles,
	auditLog,
} = schema;

// ── Campaigns ──
export async function listCampaigns(params: {
	status?: string;
	q?: string;
	page: number;
	pageSize: number;
	userId?: string;
}) {
	const conditions = [];
	if (params.status)
		conditions.push(
			eq(campaigns.status, params.status as typeof campaigns.status._.data),
		);
	if (params.q) conditions.push(like(campaigns.name, `%${params.q}%`));
	if (params.userId) conditions.push(eq(campaigns.createdBy, params.userId));

	const where = conditions.length > 0 ? and(...conditions) : undefined;

	const items = db
		.select()
		.from(campaigns)
		.where(where)
		.orderBy(desc(campaigns.updatedAt))
		.limit(params.pageSize)
		.offset((params.page - 1) * params.pageSize)
		.all();

	const total =
		db
			.select({ count: sql<number>`count(*)` })
			.from(campaigns)
			.where(where)
			.all()[0]?.count ?? 0;

	return { items, total, page: params.page, pageSize: params.pageSize };
}

export async function getCampaign(id: string) {
	return (
		db.select().from(campaigns).where(eq(campaigns.id, id)).all()[0] ?? null
	);
}

export async function getCampaignBySlug(slug: string) {
	return (
		db.select().from(campaigns).where(eq(campaigns.slug, slug)).all()[0] ?? null
	);
}

export async function createCampaign(params: {
	name: string;
	slug: string;
	description?: string;
	createdBy: string;
	config?: Partial<CampaignConfig>;
}) {
	const id = generateId();
	const ts = now();
	const config = params.config ?? {};
	db.insert(campaigns)
		.values({
			id,
			slug: params.slug,
			name: params.name,
			description: params.description ?? null,
			createdBy: params.createdBy,
			status: "draft",
			config: JSON.stringify(config),
			createdAt: ts,
			updatedAt: ts,
		})
		.run();
	return getCampaign(id);
}

export async function updateCampaign(
	id: string,
	params: {
		name?: string;
		config?: Partial<CampaignConfig>;
		status?: string;
		estimatedReach?: number | null;
		estimatedCost?: number | null;
		estimatedCpa?: number | null;
		estimatedRoi?: number | null;
		eligibleCreatorCount?: number | null;
		validationIssues?: ValidationIssue[] | null;
		reasoningTrace?: unknown[] | null;
		publishedAt?: number | null;
	},
) {
	const existing = await getCampaign(id);
	if (!existing) return null;

	const updates: Record<string, unknown> = { updatedAt: now() };

	if (params.name !== undefined) updates.name = params.name;
	if (params.config !== undefined) {
		const merged = { ...JSON.parse(existing.config), ...params.config };
		updates.config = JSON.stringify(merged);
	}
	if (params.status !== undefined) updates.status = params.status;
	if (params.estimatedReach !== undefined)
		updates.estimatedReach = params.estimatedReach;
	if (params.estimatedCost !== undefined)
		updates.estimatedCost = params.estimatedCost;
	if (params.estimatedCpa !== undefined)
		updates.estimatedCpa = params.estimatedCpa;
	if (params.estimatedRoi !== undefined)
		updates.estimatedRoi = params.estimatedRoi;
	if (params.eligibleCreatorCount !== undefined)
		updates.eligibleCreatorCount = params.eligibleCreatorCount;
	if (params.validationIssues !== undefined)
		updates.validationIssues = JSON.stringify(params.validationIssues);
	if (params.reasoningTrace !== undefined)
		updates.reasoningTrace = JSON.stringify(params.reasoningTrace);
	if (params.publishedAt !== undefined)
		updates.publishedAt = params.publishedAt;

	db.update(campaigns).set(updates).where(eq(campaigns.id, id)).run();
	return getCampaign(id);
}

export async function deleteCampaign(id: string) {
	db.delete(campaigns).where(eq(campaigns.id, id)).run();
}

// ── Copy ──
export async function getCopyForCampaign(
	campaignId: string,
): Promise<CopyRecord[]> {
	const rows = db
		.select()
		.from(generatedCopy)
		.where(eq(generatedCopy.campaignId, campaignId))
		.all();
	return rows.map((r) => ({
		...r,
		hashtags: r.hashtags ? JSON.parse(r.hashtags) : null,
	})) as unknown as CopyRecord[];
}

export async function upsertCopy(params: {
	id?: string;
	campaignId: string;
	locale: string;
	variant: number;
	subject?: string | null;
	title: string;
	body: string;
	ctaText: string;
	hashtags?: string[];
	tone?: string | null;
	model?: string | null;
}) {
	const ts = now();
	const hashtagsJson = params.hashtags ? JSON.stringify(params.hashtags) : null;

	if (params.id) {
		db.update(generatedCopy)
			.set({
				locale: params.locale,
				variant: params.variant,
				subject: params.subject ?? null,
				title: params.title,
				body: params.body,
				ctaText: params.ctaText,
				hashtags: hashtagsJson,
				tone: params.tone ?? null,
				model: params.model ?? null,
			})
			.where(eq(generatedCopy.id, params.id))
			.run();
	} else {
		const id = params.id ?? generateId();
		db.insert(generatedCopy)
			.values({
				id,
				campaignId: params.campaignId,
				locale: params.locale,
				variant: params.variant,
				subject: params.subject ?? null,
				title: params.title,
				body: params.body,
				ctaText: params.ctaText,
				hashtags: hashtagsJson,
				tone: params.tone ?? null,
				model: params.model ?? null,
				createdAt: ts,
			})
			.run();
	}
}

export async function deleteCopyForCampaign(campaignId: string) {
	db.delete(generatedCopy)
		.where(eq(generatedCopy.campaignId, campaignId))
		.run();
}

// ── Messages ──
export async function getMessagesForCampaign(campaignId: string) {
	return db
		.select()
		.from(conversationMessages)
		.where(eq(conversationMessages.campaignId, campaignId))
		.orderBy(conversationMessages.createdAt)
		.all();
}

export async function addMessage(params: {
	campaignId: string;
	role: "user" | "assistant" | "system" | "tool";
	content: string;
	payload?: unknown;
}) {
	const id = generateId();
	db.insert(conversationMessages)
		.values({
			id,
			campaignId: params.campaignId,
			role: params.role,
			content: params.content,
			payload: params.payload ? JSON.stringify(params.payload) : null,
			createdAt: now(),
		})
		.run();
	return id;
}

// ── Creators ──
export async function searchCreators(params: {
	region?: string;
	category?: string;
	tier?: string;
	q?: string;
	page: number;
	pageSize: number;
}) {
	const conditions = [];
	if (params.region)
		conditions.push(eq(creatorProfiles.region, params.region as never));
	if (params.category)
		conditions.push(
			eq(creatorProfiles.primaryCategory, params.category as never),
		);
	if (params.tier)
		conditions.push(eq(creatorProfiles.followerTier, params.tier as never));
	if (params.q)
		conditions.push(like(creatorProfiles.displayName, `%${params.q}%`));

	const where = conditions.length > 0 ? and(...conditions) : undefined;

	const items = db
		.select()
		.from(creatorProfiles)
		.where(where)
		.limit(params.pageSize)
		.offset((params.page - 1) * params.pageSize)
		.all();

	const total =
		db
			.select({ count: sql<number>`count(*)` })
			.from(creatorProfiles)
			.where(where)
			.all()[0]?.count ?? 0;

	return { items, total, page: params.page, pageSize: params.pageSize };
}

// ── Audit ──
export async function addAuditEntry(params: {
	campaignId: string;
	userId: string;
	action: string;
	delta?: unknown;
}) {
	db.insert(auditLog)
		.values({
			id: generateId(),
			campaignId: params.campaignId,
			userId: params.userId,
			action: params.action,
			delta: params.delta ? JSON.stringify(params.delta) : null,
			createdAt: now(),
		})
		.run();
}

export async function getAuditLogForCampaign(campaignId: string) {
	return db
		.select()
		.from(auditLog)
		.where(eq(auditLog.campaignId, campaignId))
		.orderBy(desc(auditLog.createdAt))
		.all();
}
