"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CampaignConfig } from "@/lib/schemas/campaign-config";

const COLORS = ["#6938FF", "#8B6BFF", "#FE2C55", "#FF5C7A", "#FFD700"];

const TIER_LABELS: Record<string, string> = {
	nano: "Nano",
	micro: "Micro",
	mid: "Mid",
	macro: "Macro",
	mega: "Mega",
};

export function TierDonut({ config }: { config: CampaignConfig }) {
	const tiers = config.eligibility?.followerTiers ?? [];
	const data = tiers.map((tier) => ({
		name: TIER_LABELS[tier] ?? tier,
		value: 1,
	}));

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-sm">Creator Tiers</CardTitle>
			</CardHeader>
			<CardContent>
				<ResponsiveContainer width="100%" height={200}>
					<PieChart>
						<Pie
							data={data}
							cx="50%"
							cy="50%"
							innerRadius={50}
							outerRadius={80}
							paddingAngle={4}
							dataKey="value"
						>
							{data.map((entry, index) => (
								<Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
							))}
						</Pie>
						<Tooltip
							contentStyle={{
								background: "#14141f",
								border: "1px solid #2a2a3a",
								borderRadius: "8px",
								color: "#fff",
							}}
						/>
					</PieChart>
				</ResponsiveContainer>
				<div className="flex flex-wrap justify-center gap-2 mt-2">
					{tiers.map((tier, i) => (
						<span
							key={tier}
							className="text-xs text-text-secondary flex items-center gap-1"
						>
							<span
								className="w-2 h-2 rounded-full inline-block"
								style={{ backgroundColor: COLORS[i % COLORS.length] }}
							/>
							{TIER_LABELS[tier] ?? tier}
						</span>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
