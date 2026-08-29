"use client";

import { Calendar } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { CampaignConfig } from "@/lib/schemas/campaign-config";
import { numberFieldValueAs } from "@/lib/utils";
import { DiffHighlightInput } from "./diff-highlight-input";

const ALLOCATIONS = [
	{ value: "reward_first", label: "Reward First" },
	{ value: "sample_first", label: "Sample First" },
	{ value: "balanced", label: "Balanced" },
];

export function BudgetTimelineSection() {
	const { register, watch, setValue } = useFormContext<CampaignConfig>();
	const budget = watch("budget");
	const timeline = watch("timeline");

	const formatDate = (d: Date | string | undefined) => {
		if (!d) return "";
		const date = d instanceof Date ? d : new Date(d);
		return date.toISOString().slice(0, 16);
	};

	return (
		<Card className="p-4 space-y-4">
			<div className="flex items-center gap-2 mb-2">
				<Calendar className="h-4 w-4 text-primary" />
				<h3 className="text-sm font-semibold">Budget &amp; Timeline</h3>
			</div>

			<div className="grid gap-3">
				<DiffHighlightInput fieldName="budget.totalBudgetUsd">
					<Label htmlFor="totalBudgetUsd">Total Budget (USD) *</Label>
					<Input
						id="totalBudgetUsd"
						type="number"
						step="0.01"
						{...register("budget.totalBudgetUsd", {
							setValueAs: numberFieldValueAs,
						})}
						placeholder="5000"
					/>
				</DiffHighlightInput>

				<DiffHighlightInput fieldName="budget.targetCreatorCount">
					<Label htmlFor="targetCreatorCount">Target Creator Count *</Label>
					<Input
						id="targetCreatorCount"
						type="number"
						{...register("budget.targetCreatorCount", {
							setValueAs: numberFieldValueAs,
						})}
						placeholder="100"
					/>
				</DiffHighlightInput>

				<DiffHighlightInput fieldName="budget.allocation">
					<Label>Allocation Strategy</Label>
					<Select
						value={budget.allocation}
						onValueChange={(v) =>
							setValue(
								"budget.allocation",
								v as CampaignConfig["budget"]["allocation"],
							)
						}
						options={ALLOCATIONS}
					/>
				</DiffHighlightInput>

				<DiffHighlightInput fieldName="budget.reservePct">
					<Label htmlFor="reservePct">Reserve % (0–0.5)</Label>
					<Input
						id="reservePct"
						type="number"
						step="0.01"
						{...register("budget.reservePct", {
							setValueAs: numberFieldValueAs,
						})}
						placeholder="0.1"
					/>
				</DiffHighlightInput>

				<div className="border-t border-border pt-3 mt-2">
					<Label className="text-xs text-text-muted mb-2 block">Timeline</Label>
					<div className="grid grid-cols-2 gap-3">
						<DiffHighlightInput fieldName="timeline.applicationStart">
							<Label htmlFor="applicationStart">Application Start</Label>
							<Input
								id="applicationStart"
								type="datetime-local"
								value={formatDate(timeline.applicationStart)}
								onChange={(e) =>
									setValue(
										"timeline.applicationStart",
										new Date(e.target.value),
									)
								}
							/>
						</DiffHighlightInput>
						<DiffHighlightInput fieldName="timeline.applicationEnd">
							<Label htmlFor="applicationEnd">Application End</Label>
							<Input
								id="applicationEnd"
								type="datetime-local"
								value={formatDate(timeline.applicationEnd)}
								onChange={(e) =>
									setValue("timeline.applicationEnd", new Date(e.target.value))
								}
							/>
						</DiffHighlightInput>
						<DiffHighlightInput fieldName="timeline.contentDeadline">
							<Label htmlFor="contentDeadline">Content Deadline</Label>
							<Input
								id="contentDeadline"
								type="datetime-local"
								value={formatDate(timeline.contentDeadline)}
								onChange={(e) =>
									setValue("timeline.contentDeadline", new Date(e.target.value))
								}
							/>
						</DiffHighlightInput>
						<DiffHighlightInput fieldName="timeline.goLiveDate">
							<Label htmlFor="goLiveDate">Go-Live Date</Label>
							<Input
								id="goLiveDate"
								type="datetime-local"
								value={formatDate(timeline.goLiveDate)}
								onChange={(e) =>
									setValue("timeline.goLiveDate", new Date(e.target.value))
								}
							/>
						</DiffHighlightInput>
						<DiffHighlightInput fieldName="timeline.campaignEnd">
							<Label htmlFor="campaignEnd">Campaign End</Label>
							<Input
								id="campaignEnd"
								type="datetime-local"
								value={formatDate(timeline.campaignEnd)}
								onChange={(e) =>
									setValue("timeline.campaignEnd", new Date(e.target.value))
								}
							/>
						</DiffHighlightInput>
					</div>
				</div>
			</div>
		</Card>
	);
}
