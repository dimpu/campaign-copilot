"use client";

import { cn } from "@/lib/utils";

interface SelectProps {
	value: string;
	onValueChange: (v: string) => void;
	options: readonly { value: string; label: string }[];
	placeholder?: string;
	className?: string;
	disabled?: boolean;
}

export function Select({
	value,
	onValueChange,
	options,
	placeholder,
	className,
	disabled,
}: SelectProps) {
	return (
		<select
			value={value}
			onChange={(e) => onValueChange(e.target.value)}
			disabled={disabled}
			className={cn(
				"flex h-9 w-full rounded-md border border-border bg-bg-dark px-3 py-1 text-sm shadow-sm transition-colors",
				"focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary",
				"disabled:cursor-not-allowed disabled:opacity-50",
				"text-text-primary",
				className,
			)}
		>
			{placeholder && (
				<option value="" disabled>
					{placeholder}
				</option>
			)}
			{options.map((opt) => (
				<option key={opt.value} value={opt.value}>
					{opt.label}
				</option>
			))}
		</select>
	);
}
