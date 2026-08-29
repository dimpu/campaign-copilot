"use client";

import { ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { REGIONS } from "@/lib/constants";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import { StatusBadge } from "./status-badge";

interface CampaignRow {
	id: string;
	slug: string;
	name: string;
	description: string | null;
	status: string;
	config: string;
	estimatedReach: number | null;
	estimatedCost: number | null;
	eligibleCreatorCount: number | null;
	publishedAt: number | null;
	createdAt: number;
	updatedAt: number;
}

interface CampaignsTableProps {
	campaigns: CampaignRow[];
	isLoading?: boolean;
	className?: string;
}

export function CampaignsTable({
	campaigns,
	isLoading = false,
	className,
}: CampaignsTableProps) {
	const router = useRouter();

	function getRegionsFromConfig(configStr: string): string[] {
		try {
			const config = JSON.parse(configStr);
			return config?.eligibility?.regions ?? [];
		} catch {
			return [];
		}
	}

	function getTargetFromConfig(configStr: string): number | null {
		try {
			const config = JSON.parse(configStr);
			return config?.budget?.targetCreatorCount ?? null;
		} catch {
			return null;
		}
	}

	function formatDate(timestamp: number): string {
		const date = new Date(timestamp);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

		if (diffDays === 0) return "Today";
		if (diffDays === 1) return "Yesterday";
		if (diffDays < 7) return `${diffDays}d ago`;
		return date.toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
		});
	}

	if (isLoading) {
		return (
			<div className={cn("space-y-3", className)}>
				{Array.from({ length: 5 }).map((_, i) => (
					<div
						// biome-ignore lint/suspicious/noArrayIndexKey: static skeleton placeholder list
						key={i}
						className="flex items-center gap-4 rounded-lg border border-border bg-bg-card p-4"
					>
						<Skeleton className="h-5 w-40" />
						<Skeleton className="h-5 w-20" />
						<Skeleton className="h-5 w-24" />
						<Skeleton className="h-5 w-16" />
						<Skeleton className="h-5 w-20" />
						<Skeleton className="h-5 w-20" />
						<Skeleton className="h-5 w-16" />
					</div>
				))}
			</div>
		);
	}

	if (campaigns.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-16 text-center">
				<div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-bg-card border border-border">
					<svg
						className="h-8 w-8 text-text-muted"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						role="img"
						aria-label="No campaigns"
						strokeWidth={1.5}
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776"
						/>
					</svg>
				</div>
				<h3 className="text-lg font-semibold text-text-primary">
					No campaigns yet
				</h3>
				<p className="mt-1 text-sm text-text-muted max-w-sm">
					Create your first campaign to get started. Describe your affiliate
					campaign in plain English and let AI do the rest.
				</p>
			</div>
		);
	}

	return (
		<div
			className={cn(
				"overflow-hidden rounded-xl border border-border",
				className,
			)}
		>
			{/* Table */}
			<div className="overflow-x-auto">
				<table className="w-full">
					<thead>
						<tr className="border-b border-border bg-bg-card">
							<th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">
								Name
							</th>
							<th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">
								Status
							</th>
							<th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">
								Regions
							</th>
							<th className="px-4 py-3 text-right text-xs font-semibold text-text-muted uppercase tracking-wider">
								Target
							</th>
							<th className="px-4 py-3 text-right text-xs font-semibold text-text-muted uppercase tracking-wider">
								Est. Reach
							</th>
							<th className="px-4 py-3 text-right text-xs font-semibold text-text-muted uppercase tracking-wider">
								Est. Cost
							</th>
							<th className="px-4 py-3 text-right text-xs font-semibold text-text-muted uppercase tracking-wider">
								Updated
							</th>
							<th className="px-4 py-3 w-10" />
						</tr>
					</thead>
					<tbody>
						{campaigns.map((campaign) => {
							const regions = getRegionsFromConfig(campaign.config);
							const target = getTargetFromConfig(campaign.config);

							return (
								<tr
									key={campaign.id}
									className="border-b border-border bg-bg-dark hover:bg-bg-card-hover cursor-pointer transition-colors group"
									onClick={() => router.push(`/campaigns/${campaign.id}`)}
								>
									{/* Name */}
									<td className="px-4 py-3.5">
										<div className="flex flex-col">
											<span className="text-sm font-medium text-text-primary group-hover:text-primary transition-colors">
												{campaign.name}
											</span>
											{campaign.description && (
												<span className="text-xs text-text-muted truncate max-w-[200px]">
													{campaign.description}
												</span>
											)}
										</div>
									</td>

									{/* Status */}
									<td className="px-4 py-3.5">
										<StatusBadge status={campaign.status} />
									</td>

									{/* Regions */}
									<td className="px-4 py-3.5">
										<div className="flex flex-wrap gap-1">
											{regions.length > 0 ? (
												regions.slice(0, 3).map((region) => (
													<span
														key={region}
														className="inline-flex items-center rounded bg-bg-card px-1.5 py-0.5 text-xs text-text-secondary"
													>
														{REGIONS.find((r) => r.code === region)?.flag}{" "}
														{region}
													</span>
												))
											) : (
												<span className="text-xs text-text-muted">—</span>
											)}
											{regions.length > 3 && (
												<span className="text-xs text-text-muted">
													+{regions.length - 3}
												</span>
											)}
										</div>
									</td>

									{/* Target */}
									<td className="px-4 py-3.5 text-right">
										<span className="text-sm text-text-secondary tabular-nums">
											{target ? formatNumber(target) : "—"}
										</span>
									</td>

									{/* Est. Reach */}
									<td className="px-4 py-3.5 text-right">
										<span className="text-sm text-text-secondary tabular-nums">
											{campaign.estimatedReach != null
												? formatNumber(campaign.estimatedReach)
												: "—"}
										</span>
									</td>

									{/* Est. Cost */}
									<td className="px-4 py-3.5 text-right">
										<span className="text-sm text-text-secondary tabular-nums">
											{campaign.estimatedCost != null
												? formatCurrency(campaign.estimatedCost)
												: "—"}
										</span>
									</td>

									{/* Updated */}
									<td className="px-4 py-3.5 text-right">
										<span className="text-xs text-text-muted">
											{formatDate(campaign.updatedAt)}
										</span>
									</td>

									{/* Chevron */}
									<td className="px-4 py-3.5">
										<ChevronRight className="h-4 w-4 text-text-muted group-hover:text-text-primary transition-colors" />
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>
		</div>
	);
}
