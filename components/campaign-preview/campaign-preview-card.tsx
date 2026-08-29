"use client";

import {
	Calendar,
	Clock,
	DollarSign,
	ExternalLink,
	Globe,
	Hash,
	Users,
	Zap,
} from "lucide-react";
import { StatusBadge } from "@/components/campaign-list/status-badge";
import {
	CONTENT_FORMATS,
	LOCALES,
	REGIONS,
	TASK_TYPES,
	TONES,
} from "@/lib/constants";
import type {
	CampaignConfig,
	Locale,
	Region,
} from "@/lib/schemas/campaign-config";
import type { CampaignPreviewCopy } from "@/lib/schemas/copy";
import { formatCurrency, formatNumber } from "@/lib/utils";

interface CampaignPreviewCardProps {
	config: CampaignConfig;
	status: string;
	campaignName: string;
	brandName?: string;
	estimatedReach?: number | null;
	eligibleCreatorCount?: number | null;
	estimatedCost?: number | null;
	copy?: CampaignPreviewCopy[];
}

function getRegionFlag(code: string) {
	return REGIONS.find((r) => r.code === code)?.flag ?? "🌍";
}

function getRegionName(code: string) {
	return REGIONS.find((r) => r.code === code)?.name ?? code;
}

function getLocaleFlag(code: string) {
	return LOCALES.find((l) => l.code === code)?.flag ?? "🌐";
}

function getTaskTypeLabel(value: string) {
	return TASK_TYPES.find((t) => t.value === value)?.label ?? value;
}

function getToneEmoji(value: string) {
	return TONES.find((t) => t.value === value)?.label ?? value;
}

function getFormatLabel(value: string) {
	return CONTENT_FORMATS.find((f) => f.value === value)?.label ?? value;
}

function formatDate(d: Date | string) {
	const date = typeof d === "string" ? new Date(d) : d;
	return date.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

function formatTimelineRange(start: Date | string, end: Date | string) {
	const s = typeof start === "string" ? new Date(start) : start;
	const e = typeof end === "string" ? new Date(end) : end;
	const sameYear = s.getFullYear() === e.getFullYear();
	if (sameYear) {
		return `${s.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${e.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
	}
	return `${formatDate(s)} – ${formatDate(e)}`;
}

export function CampaignPreviewCard({
	config,
	status,
	campaignName,
	brandName,
	estimatedReach,
	eligibleCreatorCount,
	estimatedCost,
	copy,
}: CampaignPreviewCardProps) {
	const primaryCopy = copy?.[0];
	const regions = config.eligibility.regions as Region[];
	const locales = config.targetLocales as Locale[];
	const timeline = config.timeline;
	const budget = config.budget;
	const reward = config.reward;
	const eligibility = config.eligibility;
	const contentReqs = config.contentRequirements;

	const daysUntilEnd = Math.max(
		0,
		Math.ceil(
			(new Date(timeline.campaignEnd).getTime() - Date.now()) /
				(1000 * 60 * 60 * 24),
		),
	);

	return (
		<div className="flex flex-col min-h-screen bg-bg-dark">
			{/* Hero Header */}
			<div className="relative overflow-hidden">
				{/* Gradient Background */}
				<div className="absolute inset-0 gradient-primary opacity-20" />
				<div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-bg-dark" />

				<div className="relative px-5 pt-8 pb-6 space-y-4">
					{/* Brand + Status */}
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							{brandName && (
								<span className="text-xs font-semibold text-primary-light uppercase tracking-wider">
									{brandName}
								</span>
							)}
						</div>
						<StatusBadge status={status} />
					</div>

					{/* Campaign Name */}
					<h1 className="text-2xl font-bold leading-tight text-text-primary">
						{campaignName || "Untitled Campaign"}
					</h1>

					{/* Tagline from copy */}
					{primaryCopy?.subject && (
						<p className="text-sm text-text-secondary leading-relaxed">
							{primaryCopy.subject}
						</p>
					)}

					{/* Quick Stats Row */}
					<div className="flex items-center gap-4 pt-1">
						{estimatedReach != null && (
							<div className="flex items-center gap-1.5">
								<Zap className="h-3.5 w-3.5 text-accent" />
								<span className="text-sm font-semibold">
									{formatNumber(estimatedReach)}
								</span>
								<span className="text-xs text-text-muted">reach</span>
							</div>
						)}
						{eligibleCreatorCount != null && (
							<div className="flex items-center gap-1.5">
								<Users className="h-3.5 w-3.5 text-primary-light" />
								<span className="text-sm font-semibold">
									{formatNumber(eligibleCreatorCount)}
								</span>
								<span className="text-xs text-text-muted">creators</span>
							</div>
						)}
						{estimatedCost != null && (
							<div className="flex items-center gap-1.5">
								<DollarSign className="h-3.5 w-3.5 text-success" />
								<span className="text-sm font-semibold">
									{formatCurrency(estimatedCost)}
								</span>
								<span className="text-xs text-text-muted">est. cost</span>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Content Sections */}
			<div className="flex-1 px-5 pb-8 space-y-5">
				{/* CTA Button */}
				{primaryCopy?.ctaText && (
					<button
						type="button"
						className="w-full gradient-primary text-white font-semibold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-[0.98] transition-transform"
					>
						<ExternalLink className="h-4 w-4" />
						{primaryCopy.ctaText}
					</button>
				)}

				{/* Campaign Copy Card */}
				{primaryCopy && (
					<section className="bg-bg-card rounded-xl p-4 space-y-3 border border-border">
						<h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
							Campaign Details
						</h2>
						{primaryCopy.title && (
							<h3 className="text-base font-semibold text-text-primary">
								{primaryCopy.title}
							</h3>
						)}
						<p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
							{primaryCopy.body}
						</p>
						{primaryCopy.hashtags && (
							<div className="flex items-center gap-1.5 pt-1">
								<Hash className="h-3.5 w-3.5 text-primary-light" />
								<span className="text-xs text-primary-light font-medium">
									{primaryCopy.hashtags}
								</span>
							</div>
						)}
					</section>
				)}

				{/* Reward & Budget */}
				<section className="bg-bg-card rounded-xl p-4 space-y-3 border border-border">
					<h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
						Reward & Budget
					</h2>
					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-1">
							<span className="text-xs text-text-muted">Total Budget</span>
							<p className="text-lg font-bold gradient-primary-text">
								{formatCurrency(budget.totalBudgetUsd)}
							</p>
						</div>
						<div className="space-y-1">
							<span className="text-xs text-text-muted">Target Creators</span>
							<p className="text-lg font-bold text-text-primary">
								{budget.targetCreatorCount}
							</p>
						</div>
					</div>
					<div className="h-px bg-border" />
					<div className="space-y-2">
						<div className="flex items-center justify-between text-sm">
							<span className="text-text-secondary">Reward Type</span>
							<span className="font-medium capitalize">
								{reward.type.replace(/_/g, " ")}
							</span>
						</div>
						{reward.commissionRate != null && (
							<div className="flex items-center justify-between text-sm">
								<span className="text-text-secondary">Commission Rate</span>
								<span className="font-medium text-success">
									{(reward.commissionRate * 100).toFixed(0)}%
								</span>
							</div>
						)}
						{reward.flatFeeUsd != null && (
							<div className="flex items-center justify-between text-sm">
								<span className="text-text-secondary">Flat Fee</span>
								<span className="font-medium">
									{formatCurrency(reward.flatFeeUsd)}
								</span>
							</div>
						)}
						{reward.commissionBoostBps != null && (
							<div className="flex items-center justify-between text-sm">
								<span className="text-text-secondary">Commission Boost</span>
								<span className="font-medium text-accent">
									+{(reward.commissionBoostBps / 100).toFixed(0)}%
								</span>
							</div>
						)}
						{reward.freeProductBudgetUsd != null && (
							<div className="flex items-center justify-between text-sm">
								<span className="text-text-secondary">Free Product Budget</span>
								<span className="font-medium">
									{formatCurrency(reward.freeProductBudgetUsd)}
								</span>
							</div>
						)}
					</div>
				</section>

				{/* Timeline */}
				<section className="bg-bg-card rounded-xl p-4 space-y-3 border border-border">
					<h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
						Timeline
					</h2>
					{daysUntilEnd > 0 && (
						<div className="flex items-center gap-2 bg-primary/10 rounded-lg px-3 py-2">
							<Clock className="h-4 w-4 text-primary-light" />
							<span className="text-sm font-medium text-primary-light">
								{daysUntilEnd} days remaining
							</span>
						</div>
					)}
					<div className="space-y-2.5">
						<TimelineRow
							icon={<Calendar className="h-3.5 w-3.5" />}
							label="Application Period"
							value={formatTimelineRange(
								timeline.applicationStart,
								timeline.applicationEnd,
							)}
						/>
						<TimelineRow
							icon={<Calendar className="h-3.5 w-3.5" />}
							label="Content Deadline"
							value={formatDate(timeline.contentDeadline)}
						/>
						<TimelineRow
							icon={<Calendar className="h-3.5 w-3.5" />}
							label="Go Live"
							value={formatDate(timeline.goLiveDate)}
						/>
						<TimelineRow
							icon={<Calendar className="h-3.5 w-3.5" />}
							label="Campaign End"
							value={formatDate(timeline.campaignEnd)}
						/>
					</div>
				</section>

				{/* Eligibility */}
				<section className="bg-bg-card rounded-xl p-4 space-y-3 border border-border">
					<h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
						Eligibility
					</h2>

					{/* Regions */}
					<div className="space-y-1.5">
						<span className="text-xs text-text-muted">Regions</span>
						<div className="flex flex-wrap gap-1.5">
							{regions.map((r) => (
								<span
									key={r}
									className="inline-flex items-center gap-1 rounded-md bg-bg-card-hover px-2 py-1 text-xs font-medium"
								>
									{getRegionFlag(r)} {getRegionName(r)}
								</span>
							))}
						</div>
					</div>

					{/* Follower Tiers */}
					<div className="space-y-1.5">
						<span className="text-xs text-text-muted">Follower Tiers</span>
						<div className="flex flex-wrap gap-1.5">
							{eligibility.followerTiers.map((t) => (
								<span
									key={t}
									className="inline-flex items-center rounded-full bg-primary/15 text-primary-light px-2.5 py-0.5 text-xs font-semibold capitalize"
								>
									{t}
								</span>
							))}
						</div>
					</div>

					{/* Categories */}
					<div className="space-y-1.5">
						<span className="text-xs text-text-muted">Categories</span>
						<div className="flex flex-wrap gap-1.5">
							{eligibility.categories.map((c) => (
								<span
									key={c}
									className="inline-flex items-center rounded-md bg-bg-card-hover px-2 py-1 text-xs font-medium capitalize"
								>
									{c}
								</span>
							))}
						</div>
					</div>

					{/* Min engagement rate, verified, affiliate flags */}
					{(eligibility.minEngagementRate ||
						eligibility.verifiedOnly ||
						eligibility.affiliateOnly) && (
						<div className="space-y-1.5 pt-1">
							{eligibility.minEngagementRate != null && (
								<div className="flex items-center justify-between text-sm">
									<span className="text-text-secondary">
										Min Engagement Rate
									</span>
									<span className="font-medium">
										{(eligibility.minEngagementRate * 100).toFixed(1)}%
									</span>
								</div>
							)}
							{eligibility.verifiedOnly && (
								<div className="flex items-center justify-between text-sm">
									<span className="text-text-secondary">Verified Only</span>
									<span className="text-xs font-semibold text-primary-light">
										✓ Required
									</span>
								</div>
							)}
							{eligibility.affiliateOnly && (
								<div className="flex items-center justify-between text-sm">
									<span className="text-text-secondary">Affiliate Only</span>
									<span className="text-xs font-semibold text-primary-light">
										✓ Required
									</span>
								</div>
							)}
						</div>
					)}
				</section>

				{/* Content Requirements */}
				<section className="bg-bg-card rounded-xl p-4 space-y-3 border border-border">
					<h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
						Content Requirements
					</h2>
					<div className="flex flex-wrap gap-1.5">
						{contentReqs.formats.map((f) => (
							<span
								key={f}
								className="inline-flex items-center gap-1.5 rounded-lg bg-accent/10 text-accent-light px-2.5 py-1 text-xs font-medium"
							>
								{getFormatLabel(f)}
							</span>
						))}
					</div>
					{contentReqs.requiredHashtags.length > 0 && (
						<div className="space-y-1.5">
							<span className="text-xs text-text-muted">Required Hashtags</span>
							<div className="flex flex-wrap gap-1.5">
								{contentReqs.requiredHashtags.map((h) => (
									<span
										key={h}
										className="inline-flex items-center gap-1 rounded-md bg-bg-card-hover px-2 py-1 text-xs font-medium text-primary-light"
									>
										<Hash className="h-3 w-3" />
										{h}
									</span>
								))}
							</div>
						</div>
					)}
					<div className="space-y-1.5">
						{contentReqs.mustMentionBrand && (
							<div className="flex items-center gap-2 text-sm">
								<span className="h-1.5 w-1.5 rounded-full bg-primary-light" />
								<span className="text-text-secondary">Must mention brand</span>
							</div>
						)}
						{contentReqs.reviewRequired && (
							<div className="flex items-center gap-2 text-sm">
								<span className="h-1.5 w-1.5 rounded-full bg-warning" />
								<span className="text-text-secondary">
									Review required before posting
								</span>
							</div>
						)}
						{contentReqs.productShipRequired && (
							<div className="flex items-center gap-2 text-sm">
								<span className="h-1.5 w-1.5 rounded-full bg-success" />
								<span className="text-text-secondary">
									Product shipment required
								</span>
							</div>
						)}
					</div>
				</section>

				{/* Locales */}
				{locales.length > 0 && (
					<section className="bg-bg-card rounded-xl p-4 space-y-3 border border-border">
						<div className="flex items-center gap-2">
							<Globe className="h-3.5 w-3.5 text-text-muted" />
							<h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
								Target Languages
							</h2>
						</div>
						<div className="flex flex-wrap gap-2">
							{locales.map((l) => (
								<span
									key={l}
									className="inline-flex items-center gap-1.5 rounded-md bg-bg-card-hover px-2.5 py-1 text-sm font-medium"
								>
									{getLocaleFlag(l)}{" "}
									{LOCALES.find((loc) => loc.code === l)?.name ?? l}
								</span>
							))}
						</div>
					</section>
				)}

				{/* Campaign Meta */}
				<section className="bg-bg-card rounded-xl p-4 space-y-2 border border-border">
					<h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
						Details
					</h2>
					<div className="space-y-1.5 text-sm">
						<div className="flex items-center justify-between">
							<span className="text-text-secondary">Task Type</span>
							<span className="font-medium">
								{getTaskTypeLabel(config.taskType)}
							</span>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-text-secondary">Tone</span>
							<span className="font-medium">{getToneEmoji(config.tone)}</span>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-text-secondary">Category</span>
							<span className="font-medium capitalize">
								{config.productCategory}
							</span>
						</div>
					</div>
				</section>

				{/* Multi-language Copy Accordion */}
				{copy && copy.length > 1 && (
					<section className="bg-bg-card rounded-xl border border-border overflow-hidden">
						<h2 className="px-4 pt-4 pb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
							Other Languages
						</h2>
						{copy.slice(1).map((c) => (
							<div
								key={c.locale}
								className="border-t border-border px-4 py-3 space-y-2"
							>
								<div className="flex items-center gap-2">
									<span className="text-sm">{getLocaleFlag(c.locale)}</span>
									<span className="text-sm font-medium">
										{LOCALES.find((l) => l.code === c.locale)?.name ?? c.locale}
									</span>
								</div>
								{c.title && (
									<h4 className="text-sm font-semibold">{c.title}</h4>
								)}
								<p className="text-xs text-text-secondary leading-relaxed line-clamp-3">
									{c.body}
								</p>
							</div>
						))}
					</section>
				)}

				{/* Footer */}
				<div className="pt-4 pb-2 text-center">
					<p className="text-xs text-text-muted">
						Powered by{" "}
						<span className="gradient-primary-text font-semibold">
							Campaign Copilot
						</span>
					</p>
				</div>
			</div>
		</div>
	);
}

function TimelineRow({
	icon,
	label,
	value,
}: {
	icon: React.ReactNode;
	label: string;
	value: string;
}) {
	return (
		<div className="flex items-start gap-2.5 text-sm">
			<span className="mt-0.5 text-text-muted">{icon}</span>
			<div className="flex-1">
				<span className="text-text-muted text-xs">{label}</span>
				<p className="font-medium text-text-primary">{value}</p>
			</div>
		</div>
	);
}
