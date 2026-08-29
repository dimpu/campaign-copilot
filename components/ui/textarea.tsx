"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

const Textarea = forwardRef<
	HTMLTextAreaElement,
	React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
	return (
		<textarea
			className={cn(
				"flex min-h-[60px] w-full rounded-md border border-border bg-bg-dark px-3 py-2 text-sm shadow-sm transition-colors",
				"placeholder:text-text-muted",
				"focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary",
				"disabled:cursor-not-allowed disabled:opacity-50",
				className,
			)}
			ref={ref}
			{...props}
		/>
	);
});
Textarea.displayName = "Textarea";

export { Textarea };
