import { z } from "zod";
import {
	CampaignConfigSchema,
	PaginationSchema,
	ValidationIssueSchema,
} from "./campaign-config";

export const CreateCampaignRequestSchema = z.object({
	description: z.string().min(3).max(2000).optional(),
	config: CampaignConfigSchema.partial().optional(),
});

export const UpdateCampaignRequestSchema = z.object({
	config: CampaignConfigSchema.partial().optional(),
	name: z.string().min(3).max(120).optional(),
	status: z
		.enum(["draft", "validating", "ready", "published", "paused", "archived"])
		.optional(),
});

export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(
	itemSchema: T,
) =>
	z.object({
		items: z.array(itemSchema),
		total: z.number().int(),
		page: z.number().int(),
		pageSize: z.number().int(),
	});

export const CampaignSummarySchema = z.object({
	id: z.string(),
	slug: z.string(),
	name: z.string(),
	status: z.string(),
	config: CampaignConfigSchema,
	estimatedReach: z.number().int().nullable().optional(),
	estimatedCost: z.number().nullable().optional(),
	eligibleCreatorCount: z.number().int().nullable().optional(),
	createdBy: z.string(),
	createdAt: z.number(),
	updatedAt: z.number(),
});

export const CampaignDetailSchema = z.object({
	campaign: CampaignSummarySchema,
	copy: z.array(z.unknown()).default([]),
	messages: z.array(z.unknown()).default([]),
});

export { CampaignConfigSchema, PaginationSchema, ValidationIssueSchema };
