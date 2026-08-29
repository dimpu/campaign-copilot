"use client";

import { Check, Loader2, X } from "lucide-react";
import type { DraftStage } from "@/lib/store/draft-store";
import { cn } from "@/lib/utils";

const STAGES: { key: DraftStage; label: string }[] = [
	{ key: "parsing", label: "Parsing" },
	{ key: "config-filling", label: "Config" },
	{ key: "validating", label: "Validating" },
	{ key: "copy-gen", label: "Copy" },
	{ key: "estimating", label: "Simulate" },
	{ key: "done", label: "Done" },
];

const STAGE_ORDER: DraftStage[] = [
	"idle",
	"parsing",
	"config-filling",
	"validating",
	"copy-gen",
	"estimating",
	"done",
];

interface StageProgressProps {
	stage: DraftStage;
	className?: string;
}

export function StageProgress({ stage, className }: StageProgressProps) {
	const currentIndex = STAGE_ORDER.indexOf(stage);
	const isError = stage === "error";

	return (
		<div className={cn("flex items-center gap-1", className)}>
			{STAGES.map((s, i) => {
				const stageIndex = STAGE_ORDER.indexOf(s.key);
				const isCompleted = currentIndex >= 0 && stageIndex < currentIndex;
				const isCurrent = stage === s.key && !isError;
				const isPending = !isCompleted && !isCurrent;

				return (
					<div key={s.key} className="flex items-center gap-1">
						<StageChip
							label={s.label}
							isCompleted={isCompleted}
							isCurrent={isCurrent}
							isPending={isPending}
							isError={isError && stageIndex === currentIndex}
						/>
						{i < STAGES.length - 1 && (
							<StageConnector isCompleted={isCompleted} isActive={isCurrent} />
						)}
					</div>
				);
			})}
		</div>
	);
}

function StageChip({
	label,
	isCompleted,
	isCurrent,
	isPending,
	isError,
}: {
	label: string;
	isCompleted: boolean;
	isCurrent: boolean;
	isPending: boolean;
	isError: boolean;
}) {
	return (
		<div
			className={cn(
				"flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-all duration-300",
				isCompleted && "bg-success/15 text-success",
				isCurrent &&
					"bg-gradient-to-r from-primary/20 to-accent/20 text-primary-light shadow-sm shadow-primary/10",
				isPending && "bg-bg-dark text-text-muted",
				isError && "bg-error/15 text-error",
			)}
		>
			<StageIcon
				isCompleted={isCompleted}
				isCurrent={isCurrent}
				isError={isError}
			/>
			<span className="whitespace-nowrap">{label}</span>
		</div>
	);
}

function StageIcon({
	isCompleted,
	isCurrent,
	isError,
}: {
	isCompleted: boolean;
	isCurrent: boolean;
	isError: boolean;
}) {
	if (isError) {
		return <X className="h-3 w-3" />;
	}
	if (isCompleted) {
		return <Check className="h-3 w-3 animate-in zoom-in duration-200" />;
	}
	if (isCurrent) {
		return <Loader2 className="h-3 w-3 animate-spin" />;
	}
	return <div className="h-1.5 w-1.5 rounded-full bg-text-muted" />;
}

function StageConnector({
	isCompleted,
	isActive,
}: {
	isCompleted: boolean;
	isActive: boolean;
}) {
	return (
		<div
			className={cn(
				"h-px w-3 transition-colors duration-300",
				isCompleted && "bg-success/50",
				isActive && "bg-gradient-to-r from-primary/50 to-accent/50",
				!isCompleted && !isActive && "bg-border",
			)}
		/>
	);
}
