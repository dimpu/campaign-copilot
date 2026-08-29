"use client";

import { AlertTriangle, Info, X } from "lucide-react";
import type { ValidationIssue } from "@/lib/schemas/campaign-config";
import { cn } from "@/lib/utils";

interface IssuesCardProps {
	issues: ValidationIssue[];
	className?: string;
}

const LEVEL_CONFIG = {
	error: {
		icon: X,
		wrapperClass: "border-error/30 bg-error/5",
		iconClass: "text-error",
		badgeClass: "bg-error/20 text-error border-error/30",
	},
	warning: {
		icon: AlertTriangle,
		wrapperClass: "border-warning/30 bg-warning/5",
		iconClass: "text-warning",
		badgeClass: "bg-warning/20 text-warning border-warning/30",
	},
	info: {
		icon: Info,
		wrapperClass: "border-info/30 bg-info/5",
		iconClass: "text-info",
		badgeClass: "bg-info/20 text-info border-info/30",
	},
} as const;

export function IssuesCard({ issues, className }: IssuesCardProps) {
	if (!issues || issues.length === 0) return null;

	const errorCount = issues.filter((i) => i.level === "error").length;
	const warningCount = issues.filter((i) => i.level === "warning").length;
	const infoCount = issues.filter((i) => i.level === "info").length;

	return (
		<div
			className={cn(
				"rounded-lg border border-border overflow-hidden",
				className,
			)}
		>
			{/* Header */}
			<div className="flex items-center gap-2 border-b border-border px-3 py-2">
				<AlertTriangle className="h-4 w-4 text-warning" />
				<span className="text-xs font-semibold text-text-primary">
					Validation Issues
				</span>
				<div className="ml-auto flex items-center gap-1.5">
					{errorCount > 0 && (
						<span className="inline-flex items-center rounded-full bg-error/20 px-1.5 py-0.5 text-[10px] font-semibold text-error">
							{errorCount}
						</span>
					)}
					{warningCount > 0 && (
						<span className="inline-flex items-center rounded-full bg-warning/20 px-1.5 py-0.5 text-[10px] font-semibold text-warning">
							{warningCount}
						</span>
					)}
					{infoCount > 0 && (
						<span className="inline-flex items-center rounded-full bg-info/20 px-1.5 py-0.5 text-[10px] font-semibold text-info">
							{infoCount}
						</span>
					)}
				</div>
			</div>

			{/* Issue list */}
			<div className="divide-y divide-border/50">
				{issues.map((issue, idx) => {
					const config = LEVEL_CONFIG[issue.level];
					const Icon = config.icon;

					return (
						<div
							// biome-ignore lint/suspicious/noArrayIndexKey: issues list has no stable id
							key={`${issue.code}-${idx}`}
							className={cn("flex gap-2.5 px-3 py-2.5", config.wrapperClass)}
						>
							<Icon
								className={cn("h-4 w-4 mt-0.5 shrink-0", config.iconClass)}
							/>
							<div className="min-w-0 flex-1">
								<div className="flex items-center gap-2 flex-wrap">
									{issue.field && (
										<code className="rounded bg-bg-dark px-1.5 py-0.5 text-[10px] font-mono text-text-secondary">
											{issue.field}
										</code>
									)}
									<span
										className={cn(
											"inline-flex items-center rounded border px-1 py-0 text-[10px] font-semibold uppercase",
											config.badgeClass,
										)}
									>
										{issue.level}
									</span>
									{issue.code && (
										<span className="text-[10px] font-mono text-text-muted">
											{issue.code}
										</span>
									)}
								</div>
								<p className="mt-0.5 text-xs text-text-primary leading-relaxed">
									{issue.message}
								</p>
								{issue.suggestion && (
									<p className="mt-0.5 text-[11px] text-text-secondary">
										Suggestion: {issue.suggestion}
									</p>
								)}
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
