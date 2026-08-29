"use client";

import type { CampaignStatus } from "@/lib/schemas/campaign-config";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
	status: CampaignStatus | string;
	className?: string;
}

const STATUS_CONFIG: Record<
	string,
	{
		label: string;
		variant: "success" | "warning" | "error" | "default" | "outline";
	}
> = {
	draft: { label: "Draft", variant: "outline" },
	validating: { label: "Validating", variant: "warning" },
	ready: { label: "Ready", variant: "default" },
	published: { label: "Published", variant: "success" },
	paused: { label: "Paused", variant: "warning" },
	archived: { label: "Archived", variant: "error" },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
	const config = STATUS_CONFIG[status] ?? {
		label: status,
		variant: "outline" as const,
	};

	return (
		<span
			className={cn(
				"inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
				{
					"gradient-primary text-white": config.variant === "default",
					"bg-success/20 text-success border border-success/30":
						config.variant === "success",
					"bg-warning/20 text-warning border border-warning/30":
						config.variant === "warning",
					"bg-error/20 text-error border border-error/30":
						config.variant === "error",
					"border border-border text-text-secondary":
						config.variant === "outline",
				},
				className,
			)}
		>
			<span
				className={cn("mr-1.5 h-1.5 w-1.5 rounded-full", {
					"bg-white": config.variant === "default",
					"bg-success": config.variant === "success",
					"bg-warning": config.variant === "warning",
					"bg-error": config.variant === "error",
					"bg-text-muted": config.variant === "outline",
				})}
			/>
			{config.label}
		</span>
	);
}
