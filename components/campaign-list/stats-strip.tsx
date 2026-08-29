"use client";

import { BarChart3, CheckCircle, FileText, Rocket } from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";

interface StatsStripProps {
	totalCampaigns: number;
	draftCount: number;
	publishedCount: number;
	activeCount: number;
	className?: string;
}

const STATS = [
	{
		key: "total",
		label: "Total Campaigns",
		icon: Rocket,
		gradient: "from-primary to-primary-light",
	},
	{
		key: "draft",
		label: "Drafts",
		icon: FileText,
		gradient: "from-text-muted to-text-secondary",
	},
	{
		key: "published",
		label: "Published",
		icon: CheckCircle,
		gradient: "from-success to-emerald-400",
	},
	{
		key: "active",
		label: "Active",
		icon: BarChart3,
		gradient: "from-accent to-accent-light",
	},
] as const;

export function StatsStrip({
	totalCampaigns,
	draftCount,
	publishedCount,
	activeCount,
	className,
}: StatsStripProps) {
	const counts: Record<string, number> = {
		total: totalCampaigns,
		draft: draftCount,
		published: publishedCount,
		active: activeCount,
	};

	return (
		<div className={cn("grid grid-cols-2 gap-3 sm:grid-cols-4", className)}>
			{STATS.map((stat) => {
				const Icon = stat.icon;
				const count = counts[stat.key];

				return (
					<div
						key={stat.key}
						className="relative overflow-hidden rounded-xl border border-border bg-bg-card p-4 transition-all hover:border-primary/30 hover:bg-bg-card-hover"
					>
						<div className="flex items-center justify-between">
							<div className="space-y-1">
								<p className="text-xs font-medium text-text-muted">
									{stat.label}
								</p>
								<p className="text-2xl font-bold text-text-primary tabular-nums">
									{formatNumber(count)}
								</p>
							</div>
							<div
								className={cn(
									"flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br",
									stat.gradient,
								)}
							>
								<Icon className="h-5 w-5 text-white" />
							</div>
						</div>
					</div>
				);
			})}
		</div>
	);
}
