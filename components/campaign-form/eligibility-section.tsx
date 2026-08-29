"use client";

import { Users } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CATEGORIES, REGIONS } from "@/lib/constants";
import type { CampaignConfig } from "@/lib/schemas/campaign-config";
import { cn, numberFieldValueAs } from "@/lib/utils";
import { DiffHighlightInput } from "./diff-highlight-input";

export function EligibilitySection() {
	const { register, watch, setValue } = useFormContext<CampaignConfig>();
	const eligibility = watch("eligibility");

	const toggleRegion = (region: string) => {
		const current = eligibility.regions ?? [];
		const next = current.includes(region as never)
			? current.filter((r) => r !== region)
			: [...current, region];
		setValue(
			"eligibility.regions",
			next as CampaignConfig["eligibility"]["regions"],
		);
	};

	const toggleCategory = (cat: string) => {
		const current = eligibility.categories ?? [];
		const next = current.includes(cat)
			? current.filter((c) => c !== cat)
			: [...current, cat];
		setValue("eligibility.categories", next);
	};

	const toggleTier = (tier: string) => {
		const current = eligibility.followerTiers ?? [];
		const next = current.includes(tier as never)
			? current.filter((t) => t !== tier)
			: [...current, tier];
		setValue(
			"eligibility.followerTiers",
			next as CampaignConfig["eligibility"]["followerTiers"],
		);
	};

	const tiers = [
		{ value: "nano", label: "Nano (1K–10K)" },
		{ value: "micro", label: "Micro (10K–50K)" },
		{ value: "mid", label: "Mid (50K–200K)" },
		{ value: "macro", label: "Macro (200K–1M)" },
		{ value: "mega", label: "Mega (1M+)" },
	];

	return (
		<Card className="p-4 space-y-4">
			<div className="flex items-center gap-2 mb-2">
				<Users className="h-4 w-4 text-primary" />
				<h3 className="text-sm font-semibold">Eligibility</h3>
			</div>

			<div className="grid gap-3">
				<DiffHighlightInput fieldName="eligibility.regions">
					<Label>Regions *</Label>
					<div className="flex flex-wrap gap-1.5">
						{REGIONS.map((r) => {
							const active = (eligibility.regions ?? []).includes(
								r.code as never,
							);
							return (
								<button
									key={r.code}
									type="button"
									onClick={() => toggleRegion(r.code)}
									className={cn(
										"px-2.5 py-1 rounded-md text-xs font-medium border transition-colors",
										active
											? "bg-primary/20 border-primary text-primary"
											: "border-border text-text-secondary hover:border-text-muted",
									)}
								>
									{r.flag} {r.code}
								</button>
							);
						})}
					</div>
				</DiffHighlightInput>

				<DiffHighlightInput fieldName="eligibility.categories">
					<Label>Categories *</Label>
					<div className="flex flex-wrap gap-1.5">
						{CATEGORIES.map((cat) => {
							const active = (eligibility.categories ?? []).includes(cat);
							return (
								<button
									key={cat}
									type="button"
									onClick={() => toggleCategory(cat)}
									className={cn(
										"px-2.5 py-1 rounded-md text-xs font-medium border transition-colors capitalize",
										active
											? "bg-primary/20 border-primary text-primary"
											: "border-border text-text-secondary hover:border-text-muted",
									)}
								>
									{cat}
								</button>
							);
						})}
					</div>
				</DiffHighlightInput>

				<DiffHighlightInput fieldName="eligibility.followerTiers">
					<Label>Follower Tiers *</Label>
					<div className="flex flex-wrap gap-1.5">
						{tiers.map((t) => {
							const active = (eligibility.followerTiers ?? []).includes(
								t.value as never,
							);
							return (
								<button
									key={t.value}
									type="button"
									onClick={() => toggleTier(t.value)}
									className={cn(
										"px-2.5 py-1 rounded-md text-xs font-medium border transition-colors",
										active
											? "bg-primary/20 border-primary text-primary"
											: "border-border text-text-secondary hover:border-text-muted",
									)}
								>
									{t.label}
								</button>
							);
						})}
					</div>
				</DiffHighlightInput>

				<div className="grid grid-cols-2 gap-3">
					<DiffHighlightInput fieldName="eligibility.minFollowers">
						<Label htmlFor="minFollowers">Min Followers</Label>
						<Input
							id="minFollowers"
							type="number"
							{...register("eligibility.minFollowers", {
								setValueAs: numberFieldValueAs,
							})}
							placeholder="0"
						/>
					</DiffHighlightInput>
					<DiffHighlightInput fieldName="eligibility.maxFollowers">
						<Label htmlFor="maxFollowers">Max Followers</Label>
						<Input
							id="maxFollowers"
							type="number"
							{...register("eligibility.maxFollowers", {
								setValueAs: numberFieldValueAs,
							})}
							placeholder="No limit"
						/>
					</DiffHighlightInput>
				</div>

				<div className="grid grid-cols-2 gap-3">
					<DiffHighlightInput fieldName="eligibility.minEngagementRate">
						<Label htmlFor="minEngagementRate">Min Engagement Rate</Label>
						<Input
							id="minEngagementRate"
							type="number"
							step="0.01"
							{...register("eligibility.minEngagementRate", {
								setValueAs: numberFieldValueAs,
							})}
							placeholder="0"
						/>
					</DiffHighlightInput>
					<DiffHighlightInput fieldName="eligibility.minGmv90dUsd">
						<Label htmlFor="minGmv90dUsd">Min GMV (90d) $</Label>
						<Input
							id="minGmv90dUsd"
							type="number"
							{...register("eligibility.minGmv90dUsd", {
								setValueAs: numberFieldValueAs,
							})}
							placeholder="0"
						/>
					</DiffHighlightInput>
				</div>

				<div className="flex items-center gap-4">
					<DiffHighlightInput fieldName="eligibility.verifiedOnly">
						<label className="flex items-center gap-2 text-sm cursor-pointer">
							<input
								type="checkbox"
								{...register("eligibility.verifiedOnly")}
								className="rounded border-border bg-bg-dark accent-primary"
							/>
							Verified Only
						</label>
					</DiffHighlightInput>
					<DiffHighlightInput fieldName="eligibility.affiliateOnly">
						<label className="flex items-center gap-2 text-sm cursor-pointer">
							<input
								type="checkbox"
								{...register("eligibility.affiliateOnly")}
								className="rounded border-border bg-bg-dark accent-primary"
							/>
							Affiliate Only
						</label>
					</DiffHighlightInput>
				</div>
			</div>
		</Card>
	);
}
