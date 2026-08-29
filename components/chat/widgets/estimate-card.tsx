"use client";

import {
	DollarSign,
	Eye,
	Percent,
	TrendingDown,
	TrendingUp,
	Users,
} from "lucide-react";
import type { SimulationResult } from "@/lib/schemas/campaign-config";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";

interface EstimateCardProps {
	estimate: SimulationResult;
	className?: string;
}

export function EstimateCard({ estimate, className }: EstimateCardProps) {
	if (!estimate) return null;

	const kpis = [
		{
			label: "Eligible Creators",
			value: formatNumber(estimate.eligibleCreatorCount),
			icon: Users,
			subtext: `${estimate.actualCreators} estimated to accept`,
			trend: "neutral",
		},
		{
			label: "Est. Reach",
			value: formatNumber(estimate.estimatedReach),
			icon: Eye,
			subtext: "impressions",
			trend: "neutral",
		},
		{
			label: "Est. Cost",
			value: formatCurrency(estimate.estimatedCost),
			icon: DollarSign,
			subtext: "total spend",
			trend: estimate.estimatedCost > 5000 ? "down" : "neutral",
		},
		{
			label: "CPA",
			value: formatCurrency(estimate.estimatedCpa),
			icon: TrendingUp,
			subtext: "per acquisition",
			trend:
				estimate.estimatedCpa < 10
					? "up"
					: estimate.estimatedCpa > 30
						? "down"
						: "neutral",
		},
		{
			label: "ROI",
			value: `${estimate.estimatedRoi.toFixed(1)}x`,
			icon: Percent,
			subtext: "projected return",
			trend:
				estimate.estimatedRoi >= 2
					? "up"
					: estimate.estimatedRoi < 1
						? "down"
						: "neutral",
		},
	];

	return (
		<div
			className={cn(
				"rounded-lg border border-border overflow-hidden",
				className,
			)}
		>
			{/* Header */}
			<div className="flex items-center gap-2 border-b border-border px-3 py-2">
				<Eye className="h-4 w-4 text-primary-light" />
				<span className="text-xs font-semibold text-text-primary">
					Simulation Estimate
				</span>
				<span className="ml-auto text-[10px] text-text-muted">projected</span>
			</div>

			{/* KPI grid */}
			<div className="grid grid-cols-2 gap-px bg-border">
				{kpis.map((kpi) => {
					const Icon = kpi.icon;
					const trendColor =
						kpi.trend === "up"
							? "text-success"
							: kpi.trend === "down"
								? "text-error"
								: "text-text-secondary";

					return (
						<div key={kpi.label} className="bg-bg-card p-2.5">
							<div className="flex items-center gap-1.5">
								<Icon className={cn("h-3.5 w-3.5 text-text-muted shrink-0")} />
								<span className="text-[10px] font-medium text-text-muted uppercase tracking-wide">
									{kpi.label}
								</span>
							</div>
							<div className="mt-1 flex items-baseline gap-1.5">
								<span className={cn("text-sm font-bold", trendColor)}>
									{kpi.value}
								</span>
								{kpi.trend === "up" && (
									<TrendingUp className="h-3 w-3 text-success" />
								)}
								{kpi.trend === "down" && (
									<TrendingDown className="h-3 w-3 text-error" />
								)}
							</div>
							<p className="mt-0.5 text-[10px] text-text-muted">
								{kpi.subtext}
							</p>
						</div>
					);
				})}
			</div>

			{/* Summary row */}
			<div className="border-t border-border px-3 py-2">
				<p className="text-[10px] text-text-muted">
					Acceptance rate: {(estimate.estimatedAcceptanceRate * 100).toFixed(0)}
					% &middot; Based on {formatNumber(estimate.eligibleCreatorCount)}{" "}
					eligible creators across {estimate.eligibleSample?.length ?? 0}+
					candidates
				</p>
			</div>
		</div>
	);
}
