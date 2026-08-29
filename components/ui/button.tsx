"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

const Button = forwardRef<
	HTMLButtonElement,
	React.ButtonHTMLAttributes<HTMLButtonElement> & {
		variant?:
			| "default"
			| "outline"
			| "ghost"
			| "destructive"
			| "secondary"
			| "link";
		size?: "default" | "sm" | "lg" | "icon";
	}
>(({ className, variant = "default", size = "default", ...props }, ref) => {
	const base =
		"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0";

	const variants: Record<string, string> = {
		default: "gradient-primary text-white shadow hover:opacity-90",
		outline:
			"border border-border bg-transparent hover:bg-bg-card-hover text-text-primary",
		ghost: "hover:bg-bg-card-hover text-text-primary",
		destructive: "bg-error text-white shadow-sm hover:bg-error/90",
		secondary: "bg-bg-card text-text-primary shadow-sm hover:bg-bg-card-hover",
		link: "text-primary underline-offset-4 hover:underline",
	};

	const sizes: Record<string, string> = {
		default: "h-9 px-4 py-2",
		sm: "h-8 rounded-md px-3 text-xs",
		lg: "h-10 rounded-md px-8",
		icon: "h-9 w-9",
	};

	return (
		<button
			ref={ref}
			className={cn(base, variants[variant], sizes[size], className)}
			{...props}
		/>
	);
});
Button.displayName = "Button";

export { Button };
