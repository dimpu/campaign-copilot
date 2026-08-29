"use client";

import { cn } from "@/lib/utils";

const QUICK_PROMPTS = [
	"US beauty micro-creators, $5k",
	"ID+TH fashion, commission",
	"Free sample campaign",
	"Commission boost",
] as const;

interface QuickPromptsProps {
	onSelect: (prompt: string) => void;
	disabled?: boolean;
	className?: string;
}

export function QuickPrompts({
	onSelect,
	disabled = false,
	className,
}: QuickPromptsProps) {
	return (
		<div className={cn("flex flex-wrap gap-2", className)}>
			{QUICK_PROMPTS.map((prompt) => (
				<button
					key={prompt}
					type="button"
					disabled={disabled}
					onClick={() => onSelect(prompt)}
					className={cn(
						"inline-flex items-center rounded-full border border-border px-3 py-1.5",
						"text-xs font-medium text-text-secondary",
						"transition-all duration-200",
						"hover:border-primary/40 hover:text-text-primary",
						"hover:bg-gradient-to-r hover:from-primary/10 hover:to-accent/10",
						"disabled:pointer-events-none disabled:opacity-50",
						"focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary",
					)}
				>
					{prompt}
				</button>
			))}
		</div>
	);
}
