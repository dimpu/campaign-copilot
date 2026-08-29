"use client";

import { Activity, Archive, Edit, FileText, Rocket } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface AuditEntry {
	id: string;
	campaignId: string;
	userId: string;
	action: string;
	delta?: string | null;
	createdAt: number;
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
	create: <FileText className="h-3 w-3" />,
	update: <Edit className="h-3 w-3" />,
	publish: <Rocket className="h-3 w-3" />,
	archive: <Archive className="h-3 w-3" />,
};

const ACTION_LABELS: Record<string, string> = {
	create: "Created",
	update: "Updated",
	publish: "Published",
	regenerate_copy: "Copy Regenerated",
	chat_followup: "Chat Follow-up",
	archive: "Archived",
};

export function AuditTimeline({ audit }: { audit: AuditEntry[] }) {
	if (audit.length === 0) {
		return (
			<Card className="p-6 text-center text-text-muted text-sm">
				No audit entries yet.
			</Card>
		);
	}

	return (
		<Card className="p-4">
			<div className="space-y-4">
				{audit.map((entry, i) => (
					<div key={entry.id} className="flex gap-3">
						<div className="flex flex-col items-center">
							<div className="w-7 h-7 rounded-full bg-bg-dark border border-border flex items-center justify-center">
								{ACTION_ICONS[entry.action] ?? <Activity className="h-3 w-3" />}
							</div>
							{i < audit.length - 1 && (
								<div className="w-px flex-1 bg-border mt-1" />
							)}
						</div>
						<div className="flex-1 pb-4">
							<div className="flex items-center gap-2">
								<Badge variant="secondary" className="text-xs">
									{ACTION_LABELS[entry.action] ?? entry.action}
								</Badge>
								<span className="text-xs text-text-muted">
									{new Date(entry.createdAt).toLocaleString()}
								</span>
							</div>
							{entry.delta && (
								<p className="text-xs text-text-secondary mt-1 font-mono">
									{entry.delta.slice(0, 200)}
								</p>
							)}
						</div>
					</div>
				))}
			</div>
		</Card>
	);
}
