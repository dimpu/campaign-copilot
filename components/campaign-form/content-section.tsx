"use client";

import { Film } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CONTENT_FORMATS } from "@/lib/constants";
import type { CampaignConfig } from "@/lib/schemas/campaign-config";
import { cn } from "@/lib/utils";
import { DiffHighlightInput } from "./diff-highlight-input";

export function ContentSection() {
	const { register, watch, setValue } = useFormContext<CampaignConfig>();
	const content = watch("contentRequirements");

	const toggleFormat = (fmt: string) => {
		const current = content.formats ?? [];
		const next = current.includes(fmt as never)
			? current.filter((f) => f !== fmt)
			: [...current, fmt];
		setValue(
			"contentRequirements.formats",
			next as CampaignConfig["contentRequirements"]["formats"],
		);
	};

	return (
		<Card className="p-4 space-y-4">
			<div className="flex items-center gap-2 mb-2">
				<Film className="h-4 w-4 text-primary" />
				<h3 className="text-sm font-semibold">Content Requirements</h3>
			</div>

			<div className="grid gap-3">
				<DiffHighlightInput fieldName="contentRequirements.formats">
					<Label>Content Formats *</Label>
					<div className="flex flex-wrap gap-1.5">
						{CONTENT_FORMATS.map((f) => {
							const active = (content.formats ?? []).includes(f.value as never);
							return (
								<button
									key={f.value}
									type="button"
									onClick={() => toggleFormat(f.value)}
									className={cn(
										"px-2.5 py-1 rounded-md text-xs font-medium border transition-colors",
										active
											? "bg-primary/20 border-primary text-primary"
											: "border-border text-text-secondary hover:border-text-muted",
									)}
								>
									{f.label}
								</button>
							);
						})}
					</div>
				</DiffHighlightInput>

				{(content.formats ?? []).some((f) => f === "short_video") && (
					<DiffHighlightInput fieldName="contentRequirements.minVideoSec">
						<Label htmlFor="minVideoSec">Min Video Length (seconds)</Label>
						<Input
							id="minVideoSec"
							type="number"
							{...register("contentRequirements.minVideoSec", {
								valueAsNumber: true,
							})}
							placeholder="15"
						/>
					</DiffHighlightInput>
				)}

				<DiffHighlightInput fieldName="contentRequirements.requiredHashtags">
					<Label htmlFor="requiredHashtags">
						Required Hashtags (comma separated)
					</Label>
					<Input
						id="requiredHashtags"
						placeholder="#TikTokShop, #YourBrand"
						onChange={(e) => {
							const tags = e.target.value
								.split(",")
								.map((t) => t.trim())
								.filter(Boolean);
							setValue("contentRequirements.requiredHashtags", tags);
						}}
					/>
				</DiffHighlightInput>

				<div className="flex items-center gap-4">
					<DiffHighlightInput fieldName="contentRequirements.mustMentionBrand">
						<label className="flex items-center gap-2 text-sm cursor-pointer">
							<input
								type="checkbox"
								{...register("contentRequirements.mustMentionBrand")}
								className="rounded border-border bg-bg-dark accent-primary"
							/>
							Must Mention Brand
						</label>
					</DiffHighlightInput>
					<DiffHighlightInput fieldName="contentRequirements.reviewRequired">
						<label className="flex items-center gap-2 text-sm cursor-pointer">
							<input
								type="checkbox"
								{...register("contentRequirements.reviewRequired")}
								className="rounded border-border bg-bg-dark accent-primary"
							/>
							Review Required
						</label>
					</DiffHighlightInput>
					<DiffHighlightInput fieldName="contentRequirements.productShipRequired">
						<label className="flex items-center gap-2 text-sm cursor-pointer">
							<input
								type="checkbox"
								{...register("contentRequirements.productShipRequired")}
								className="rounded border-border bg-bg-dark accent-primary"
							/>
							Ship Product
						</label>
					</DiffHighlightInput>
				</div>
			</div>
		</Card>
	);
}
