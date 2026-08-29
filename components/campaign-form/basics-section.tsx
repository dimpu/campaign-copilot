"use client";

import { FileText } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CAMPAIGN_OBJECTIVES, TASK_TYPES } from "@/lib/constants";
import type { CampaignConfig } from "@/lib/schemas/campaign-config";
import { DiffHighlightInput } from "./diff-highlight-input";

export function BasicsSection() {
	const { register, setValue, watch } = useFormContext<CampaignConfig>();
	const taskType = watch("taskType");
	const objective = watch("campaignObjective");

	return (
		<Card className="p-4 space-y-4">
			<div className="flex items-center gap-2 mb-2">
				<FileText className="h-4 w-4 text-primary" />
				<h3 className="text-sm font-semibold">Basics</h3>
			</div>

			<div className="grid gap-3">
				<DiffHighlightInput fieldName="campaignName">
					<Label htmlFor="campaignName">Campaign Name *</Label>
					<Input
						id="campaignName"
						{...register("campaignName")}
						placeholder="e.g. US Beauty Summer Launch"
					/>
				</DiffHighlightInput>

				<DiffHighlightInput fieldName="taskType">
					<Label>Task Type *</Label>
					<Select
						value={taskType}
						onValueChange={(v) =>
							setValue("taskType", v as CampaignConfig["taskType"])
						}
						options={TASK_TYPES}
					/>
				</DiffHighlightInput>

				<DiffHighlightInput fieldName="productCategory">
					<Label htmlFor="productCategory">Product Category *</Label>
					<Input
						id="productCategory"
						{...register("productCategory")}
						placeholder="e.g. beauty, fashion, electronics"
					/>
				</DiffHighlightInput>

				<DiffHighlightInput fieldName="brandName">
					<Label htmlFor="brandName">Brand Name</Label>
					<Input
						id="brandName"
						{...register("brandName")}
						placeholder="Your brand name"
					/>
				</DiffHighlightInput>

				<DiffHighlightInput fieldName="campaignObjective">
					<Label>Campaign Objective</Label>
					<Select
						value={objective}
						onValueChange={(v) =>
							setValue(
								"campaignObjective",
								v as CampaignConfig["campaignObjective"],
							)
						}
						options={CAMPAIGN_OBJECTIVES}
					/>
				</DiffHighlightInput>

				<DiffHighlightInput fieldName="trackingCode">
					<Label htmlFor="trackingCode">Tracking Code</Label>
					<Input
						id="trackingCode"
						{...register("trackingCode")}
						placeholder="Optional UTM or tracking code"
					/>
				</DiffHighlightInput>

				<DiffHighlightInput fieldName="internalNotes">
					<Label htmlFor="internalNotes">Internal Notes</Label>
					<Textarea
						id="internalNotes"
						{...register("internalNotes")}
						placeholder="Notes for your team (not shown to creators)"
						rows={2}
					/>
				</DiffHighlightInput>
			</div>
		</Card>
	);
}
