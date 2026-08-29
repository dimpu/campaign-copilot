"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CampaignConfig } from "@/lib/schemas/campaign-config";

export function TimelineGantt({ config }: { config: CampaignConfig }) {
	const t = config.timeline;
	if (!t) return null;

	const phases = [
		{
			label: "Applications",
			start: new Date(t.applicationStart),
			end: new Date(t.applicationEnd),
			color: "bg-primary",
		},
		{
			label: "Content Creation",
			start: new Date(t.applicationEnd),
			end: new Date(t.contentDeadline),
			color: "bg-info",
		},
		{
			label: "Review",
			start: new Date(t.contentDeadline),
			end: new Date(t.goLiveDate),
			color: "bg-warning",
		},
		{
			label: "Live",
			start: new Date(t.goLiveDate),
			end: new Date(t.campaignEnd),
			color: "bg-success",
		},
	];

	const allDates = phases.flatMap((p) => [p.start, p.end]);
	const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())));
	const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())));
	const _totalDays = Math.max(
		1,
		(maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24),
	);

	const getPct = (date: Date) => {
		const pct =
			((date.getTime() - minDate.getTime()) /
				(maxDate.getTime() - minDate.getTime())) *
			100;
		return Math.max(0, Math.min(100, pct));
	};

	const formatDate = (d: Date) =>
		d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-sm">Timeline</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="space-y-3">
					{phases.map((phase) => (
						<div key={phase.label} className="space-y-1">
							<div className="flex justify-between text-xs text-text-secondary">
								<span>{phase.label}</span>
								<span>
									{formatDate(phase.start)} → {formatDate(phase.end)}
								</span>
							</div>
							<div className="relative h-5 rounded-full bg-bg-dark overflow-hidden">
								<div
									className={`absolute top-0 h-full rounded-full ${phase.color}`}
									style={{
										left: `${getPct(phase.start)}%`,
										width: `${getPct(phase.end) - getPct(phase.start)}%`,
									}}
								/>
							</div>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
