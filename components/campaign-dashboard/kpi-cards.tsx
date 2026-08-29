import {
	Activity,
	DollarSign,
	Eye,
	Target,
	TrendingUp,
	Users,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { CampaignConfig } from "@/lib/schemas/campaign-config";
import { formatCurrency, formatNumber } from "@/lib/utils";

export function KpiCards({
	campaign,
	config,
}: {
	campaign: {
		estimatedReach?: number | null;
		estimatedCost?: number | null;
		estimatedCpa?: number | null;
		estimatedRoi?: number | null;
		eligibleCreatorCount?: number | null;
		status: string;
	};
	config: CampaignConfig;
}) {
	const cards = [
		{
			label: "Eligible Creators",
			value: campaign.eligibleCreatorCount ?? "-",
			icon: Users,
			format: (v: number | string) =>
				typeof v === "number" ? formatNumber(v) : String(v),
			color: "text-primary",
		},
		{
			label: "Est. Reach",
			value: campaign.estimatedReach ?? "-",
			icon: Eye,
			format: (v: number | string) =>
				typeof v === "number" ? formatNumber(v) : String(v),
			color: "text-info",
		},
		{
			label: "Est. Cost",
			value: campaign.estimatedCost ?? "-",
			icon: DollarSign,
			format: (v: number | string) =>
				typeof v === "number" ? formatCurrency(v) : String(v),
			color: "text-warning",
		},
		{
			label: "CPA",
			value: campaign.estimatedCpa ?? "-",
			icon: Target,
			format: (v: number | string) =>
				typeof v === "number" ? formatCurrency(v) : String(v),
			color: "text-success",
		},
		{
			label: "ROI",
			value: campaign.estimatedRoi ?? "-",
			icon: TrendingUp,
			format: (v: number | string) =>
				typeof v === "number" ? `${v.toFixed(1)}x` : String(v),
			color: "text-accent",
		},
		{
			label: "Budget",
			value: config.budget.totalBudgetUsd,
			icon: Activity,
			format: (v: number | string) =>
				typeof v === "number" ? formatCurrency(v) : String(v),
			color: "text-text-primary",
		},
	];

	return (
		<div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
			{cards.map((card) => (
				<Card key={card.label} className="bg-bg-card border-border">
					<CardContent className="p-4 flex flex-col items-center gap-2">
						<card.icon className={`h-4 w-4 ${card.color}`} />
						<span className="text-lg font-bold">{card.format(card.value)}</span>
						<span className="text-xs text-text-muted">{card.label}</span>
					</CardContent>
				</Card>
			))}
		</div>
	);
}
