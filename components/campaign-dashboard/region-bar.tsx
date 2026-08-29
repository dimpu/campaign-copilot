"use client";

import {
	Bar,
	BarChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { REGIONS } from "@/lib/constants";
import type { CampaignConfig } from "@/lib/schemas/campaign-config";

export function RegionBar({ config }: { config: CampaignConfig }) {
	const regions = config.eligibility?.regions ?? [];
	const data = regions.map((r) => {
		const regionInfo = REGIONS.find((ri) => ri.code === r);
		return {
			name: regionInfo?.flag ? `${regionInfo.flag} ${r}` : r,
			code: r,
			value: 1,
		};
	});

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-sm">Target Regions</CardTitle>
			</CardHeader>
			<CardContent>
				<ResponsiveContainer width="100%" height={200}>
					<BarChart data={data}>
						<CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
						<XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 10 }} />
						<YAxis tick={{ fill: "#9ca3af", fontSize: 10 }} />
						<Tooltip
							contentStyle={{
								background: "#14141f",
								border: "1px solid #2a2a3a",
								borderRadius: "8px",
								color: "#fff",
							}}
						/>
						<Bar dataKey="value" fill="#6938FF" radius={[4, 4, 0, 0]} />
					</BarChart>
				</ResponsiveContainer>
			</CardContent>
		</Card>
	);
}
