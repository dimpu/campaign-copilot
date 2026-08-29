"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

const Label = forwardRef<
	HTMLLabelElement,
	React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
	// biome-ignore lint/a11y/noLabelWithoutControl: generic Label primitive; consumers associate via htmlFor or by wrapping a control
	<label
		ref={ref}
		className={cn(
			"text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
			className,
		)}
		{...props}
	/>
));
Label.displayName = "Label";

export { Label };
