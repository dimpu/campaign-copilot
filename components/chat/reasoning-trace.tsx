"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ReasoningStep {
	tool: string;
	summary: string;
	status?: "running" | "complete" | "error";
}

interface ReasoningTraceProps {
	steps: ReasoningStep[];
	className?: string;
}

export function ReasoningTrace({ steps, className }: ReasoningTraceProps) {
	const [isOpen, setIsOpen] = useState(false);

	if (!steps || steps.length === 0) return null;

	return (
		<div className={cn("mt-2", className)}>
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className={cn(
					"inline-flex items-center gap-1.5 rounded-md px-2 py-1",
					"text-xs font-medium text-text-muted",
					"transition-colors hover:text-text-secondary",
					"focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary",
				)}
			>
				{isOpen ? (
					<ChevronDown className="h-3.5 w-3.5" />
				) : (
					<ChevronRight className="h-3.5 w-3.5" />
				)}
				{isOpen ? "Hide AI reasoning" : "Show AI reasoning"}
			</button>

			{isOpen && (
				<div className="mt-2 rounded-lg border border-border bg-bg-dark/50 p-3">
					<div className="space-y-2">
						{steps.map((step, i) => (
							<ReasoningStepRow
								// biome-ignore lint/suspicious/noArrayIndexKey: reasoning steps have no stable id
								key={`${step.tool}-${i}`}
								step={step}
								isLast={i === steps.length - 1}
							/>
						))}
					</div>
				</div>
			)}
		</div>
	);
}

function ReasoningStepRow({
	step,
	isLast,
}: {
	step: ReasoningStep;
	isLast: boolean;
}) {
	const statusColor = {
		running: "text-primary-light",
		complete: "text-success",
		error: "text-error",
	}[step.status ?? "complete"];

	return (
		<div className="flex gap-3">
			{/* Timeline connector */}
			<div className="flex flex-col items-center">
				<div
					className={cn(
						"h-1.5 w-1.5 rounded-full",
						statusColor === "text-success" && "bg-success",
						statusColor === "text-primary-light" &&
							"bg-primary-light animate-pulse",
						statusColor === "text-error" && "bg-error",
					)}
				/>
				{!isLast && <div className="mt-0.5 w-px flex-1 bg-border" />}
			</div>

			<div className="flex-1 pb-2">
				<div className="flex items-center gap-1.5">
					<code className="rounded bg-primary/10 px-1.5 py-0.5 text-[11px] font-mono font-semibold text-primary-light">
						{step.tool}
					</code>
					{step.status === "running" && (
						<span className="text-[10px] text-text-muted">running...</span>
					)}
				</div>
				<p className="mt-0.5 text-xs font-mono text-text-secondary leading-relaxed">
					{step.summary}
				</p>
			</div>
		</div>
	);
}
