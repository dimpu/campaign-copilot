"use client";

import { DollarSign, Eye, Target, TrendingUp, Users } from "lucide-react";
import type { SimulationResult } from "@/lib/schemas/campaign-config";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";

const kpis = [
	{
		key: "eligibleCreatorCount",
		label: "Eligible",
		icon: Users,
		format: formatNumber,
	},
	{
		key: "actualCreators",
		label: "Creators",
		icon: Target,
		format: formatNumber,
	},
	{ key: "estimatedReach", label: "Reach", icon: Eye, format: formatNumber },
	{
		key: "estimatedCost",
		label: "Est. Cost",
		icon: DollarSign,
		format: formatCurrency,
	},
	{
		key: "estimatedCpa",
		label: "CPA",
		icon: TrendingUp,
		format: (v: number) => formatCurrency(v),
	},
	{
		key: "estimatedRoi",
		label: "ROI",
		icon: TrendingUp,
		format: (v: number) => `${v.toFixed(1)}x`,
	},
] as const;

export function EstimateCard({ estimate }: { estimate: SimulationResult }) {
	const values = estimate as unknown as Record<string, number>;

	return (
		<div>
			<h4 className="text-xs font-semibold text-text-muted mb-2">
				LIVE ESTIMATE
			</h4>
			<div className="grid grid-cols-3 gap-2">
				{kpis.map(({ key, label, icon: Icon, format }) => {
					const val = values[key as string];
					const isGood =
						key === "estimatedRoi"
							? val > 1
							: key === "estimatedCpa"
								? val < 20
								: true;
					return (
						<div
							key={key}
							className="flex flex-col items-center p-2 rounded-lg bg-bg-dark"
						>
							<Icon className="h-3 w-3 text-text-muted mb-1" />
							<span
								className={cn(
									"text-sm font-bold",
									isGood ? "text-text-primary" : "text-warning",
								)}
							>
								{val == null ? "—" : format ? format(val) : val}
							</span>
							<span className="text-[10px] text-text-muted">{label}</span>
						</div>
					);
				})}
			</div>

			{estimate.issues && estimate.issues.length > 0 && (
				<div className="mt-2 space-y-1">
					{estimate.issues
						.filter((i) => i.level === "warning")
						.slice(0, 2)
						.map((issue, i) => (
							<div
								// biome-ignore lint/suspicious/noArrayIndexKey: issues list has no stable id
								key={i}
								className="text-[10px] text-warning flex items-center gap-1"
							>
								<span>⚠️</span> {issue.message}
							</div>
						))}
				</div>
			)}
		</div>
	);
}
