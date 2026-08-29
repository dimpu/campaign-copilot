import { z } from "zod";
import { LocaleSchema } from "./campaign-config";

export const CopyRecordSchema = z.object({
	id: z.string(),
	campaignId: z.string(),
	locale: LocaleSchema,
	variant: z.number().int().default(0),
	subject: z.string().nullable().optional(),
	title: z.string(),
	body: z.string(),
	ctaText: z.string(),
	hashtags: z.string().nullable().optional(),
	tone: z.string().nullable().optional(),
	model: z.string().nullable().optional(),
	createdAt: z.number(),
});
export type CopyRecord = z.infer<typeof CopyRecordSchema>;

// Shape consumed by the creator-facing preview card (edit-page live preview and
// the standalone /campaigns/[id]/preview page) so both render identically.
export interface CampaignPreviewCopy {
	locale: string;
	title: string;
	body: string;
	ctaText: string;
	subject?: string | null;
	hashtags?: string | null;
}

export const RegenerateCopyRequestSchema = z.object({
	locales: z.array(LocaleSchema).min(1),
	tone: z.string().optional(),
});
