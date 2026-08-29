"use client";

import { Gift } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { CampaignConfig } from "@/lib/schemas/campaign-config";
import { numberFieldValueAs } from "@/lib/utils";
import { DiffHighlightInput } from "./diff-highlight-input";

const REWARD_TYPES = [
	{ value: "flat_fee", label: "Flat Fee" },
	{ value: "commission", label: "Commission" },
	{ value: "tiered_commission", label: "Tiered Commission" },
	{ value: "free_product", label: "Free Product" },
	{ value: "mixed", label: "Mixed" },
];

export function RewardSection() {
	const { register, watch, setValue } = useFormContext<CampaignConfig>();
	const reward = watch("reward");

	return (
		<Card className="p-4 space-y-4">
			<div className="flex items-center gap-2 mb-2">
				<Gift className="h-4 w-4 text-primary" />
				<h3 className="text-sm font-semibold">Reward</h3>
			</div>

			<div className="grid gap-3">
				<DiffHighlightInput fieldName="reward.type">
					<Label>Reward Type *</Label>
					<Select
						value={reward.type}
						onValueChange={(v) =>
							setValue("reward.type", v as CampaignConfig["reward"]["type"])
						}
						options={REWARD_TYPES}
					/>
				</DiffHighlightInput>

				{(reward.type === "flat_fee" || reward.type === "mixed") && (
					<DiffHighlightInput fieldName="reward.flatFeeUsd">
						<Label htmlFor="flatFeeUsd">Flat Fee (USD)</Label>
						<Input
							id="flatFeeUsd"
							type="number"
							step="0.01"
							{...register("reward.flatFeeUsd", {
								setValueAs: numberFieldValueAs,
							})}
							placeholder="200"
						/>
					</DiffHighlightInput>
				)}

				{(reward.type === "commission" ||
					reward.type === "tiered_commission" ||
					reward.type === "mixed") && (
					<>
						<DiffHighlightInput fieldName="reward.commissionRate">
							<Label htmlFor="commissionRate">Commission Rate (0–1)</Label>
							<Input
								id="commissionRate"
								type="number"
								step="0.01"
								{...register("reward.commissionRate", {
									setValueAs: numberFieldValueAs,
								})}
								placeholder="0.15"
							/>
						</DiffHighlightInput>
						{reward.type === "tiered_commission" && (
							<DiffHighlightInput fieldName="reward.commissionBoostBps">
								<Label htmlFor="commissionBoostBps">
									Commission Boost (bps)
								</Label>
								<Input
									id="commissionBoostBps"
									type="number"
									{...register("reward.commissionBoostBps", {
										setValueAs: numberFieldValueAs,
									})}
									placeholder="500"
								/>
							</DiffHighlightInput>
						)}
					</>
				)}

				{(reward.type === "free_product" || reward.type === "mixed") && (
					<DiffHighlightInput fieldName="reward.freeProductBudgetUsd">
						<Label htmlFor="freeProductBudgetUsd">
							Free Product Budget (USD)
						</Label>
						<Input
							id="freeProductBudgetUsd"
							type="number"
							step="0.01"
							{...register("reward.freeProductBudgetUsd", {
								setValueAs: numberFieldValueAs,
							})}
							placeholder="15"
						/>
					</DiffHighlightInput>
				)}

				<DiffHighlightInput fieldName="reward.performanceBonusUsd">
					<Label htmlFor="performanceBonusUsd">Performance Bonus (USD)</Label>
					<Input
						id="performanceBonusUsd"
						type="number"
						step="0.01"
						{...register("reward.performanceBonusUsd", {
							setValueAs: numberFieldValueAs,
						})}
						placeholder="50"
					/>
				</DiffHighlightInput>
			</div>
		</Card>
	);
}
