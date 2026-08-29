"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

const Badge = forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement> & {
		variant?:
			| "default"
			| "secondary"
			| "outline"
			| "success"
			| "warning"
			| "error";
	}
>(({ className, variant = "default", ...props }, ref) => {
	const variants: Record<string, string> = {
		default: "gradient-primary text-white",
		secondary: "bg-bg-card text-text-primary",
		outline: "border border-border text-text-primary",
		success: "bg-success/20 text-success border border-success/30",
		warning: "bg-warning/20 text-warning border border-warning/30",
		error: "bg-error/20 text-error border border-error/30",
	};

	return (
		<div
			ref={ref}
			className={cn(
				"inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
				variants[variant],
				className,
			)}
			{...props}
		/>
	);
});
Badge.displayName = "Badge";

export { Badge };
