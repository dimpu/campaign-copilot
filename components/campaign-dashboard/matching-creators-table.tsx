"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { CampaignConfig } from "@/lib/schemas/campaign-config";
import { formatCurrency, formatNumber } from "@/lib/utils";

interface Creator {
	id: string;
	handle: string;
	displayName: string;
	region: string;
	primaryCategory: string;
	followerTier: string;
	followerCount: number;
	engagementRate: number;
	gmv90d: number;
	avatarColor?: string;
}

export function MatchingCreatorsTable({ config }: { config: CampaignConfig }) {
	const [creators, setCreators] = useState<Creator[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchCreators = async () => {
			setLoading(true);
			try {
				const params = new URLSearchParams();
				if (config.eligibility?.regions?.[0]) {
					params.set("region", config.eligibility.regions[0]);
				}
				if (config.eligibility?.categories?.[0]) {
					params.set("category", config.eligibility.categories[0]);
				}
				params.set("pageSize", "20");

				const res = await fetch(`/api/creators/search?${params}`);
				if (res.ok) {
					const data = await res.json();
					setCreators(data.creators ?? []);
				}
			} catch {
				// Silent fail
			} finally {
				setLoading(false);
			}
		};
		fetchCreators();
	}, [config]);

	if (loading) {
		return (
			<Card className="p-4 space-y-3">
				{Array.from({ length: 5 }).map((_, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: static skeleton placeholder list
					<Skeleton key={i} className="h-10 w-full" />
				))}
			</Card>
		);
	}

	return (
		<Card>
			<div className="overflow-x-auto">
				<table className="w-full text-sm">
					<thead>
						<tr className="border-b border-border">
							<th className="text-left p-3 text-text-muted font-medium">
								Creator
							</th>
							<th className="text-left p-3 text-text-muted font-medium">
								Region
							</th>
							<th className="text-left p-3 text-text-muted font-medium">
								Category
							</th>
							<th className="text-left p-3 text-text-muted font-medium">
								Tier
							</th>
							<th className="text-right p-3 text-text-muted font-medium">
								Followers
							</th>
							<th className="text-right p-3 text-text-muted font-medium">
								Eng. Rate
							</th>
							<th className="text-right p-3 text-text-muted font-medium">
								GMV (90d)
							</th>
						</tr>
					</thead>
					<tbody>
						{creators.map((c) => (
							<tr
								key={c.id}
								className="border-b border-border hover:bg-bg-card-hover transition-colors"
							>
								<td className="p-3">
									<div className="flex items-center gap-2">
										<Avatar className="h-7 w-7">
											<AvatarFallback
												style={{ backgroundColor: c.avatarColor ?? "#6938FF" }}
												className="text-xs text-white"
											>
												{c.displayName.slice(0, 2).toUpperCase()}
											</AvatarFallback>
										</Avatar>
										<div>
											<p className="font-medium text-xs">{c.displayName}</p>
											<p className="text-text-muted text-xs">{c.handle}</p>
										</div>
									</div>
								</td>
								<td className="p-3 text-text-secondary text-xs">{c.region}</td>
								<td className="p-3 text-text-secondary text-xs capitalize">
									{c.primaryCategory}
								</td>
								<td className="p-3 text-text-secondary text-xs capitalize">
									{c.followerTier}
								</td>
								<td className="p-3 text-right text-xs">
									{formatNumber(c.followerCount)}
								</td>
								<td className="p-3 text-right text-xs">
									{(c.engagementRate * 100).toFixed(1)}%
								</td>
								<td className="p-3 text-right text-xs">
									{formatCurrency(c.gmv90d)}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</Card>
	);
}
