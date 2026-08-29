"use client";

import type { ReactNode } from "react";
import { get, useFormContext, useFormState } from "react-hook-form";
import { useCopyFlash } from "@/lib/hooks/use-copy-flash";
import { useDraftStore } from "@/lib/store/draft-store";
import { cn, humanizeZodError } from "@/lib/utils";

export function DiffHighlightInput({
	fieldName,
	children,
}: {
	fieldName: string;
	children: ReactNode;
}) {
	const { control } = useFormContext();
	const { errors } = useFormState({ control, name: fieldName });
	const error = get(errors, fieldName)?.message as string | undefined;

	const lastAiPatchAt = useDraftStore((s) => s.lastAiPatchAt);
	const flashing = useCopyFlash(lastAiPatchAt, fieldName);

	return (
		<div className={cn("space-y-1.5", flashing && "diff-flash rounded-md")}>
			{children}
			{error && (
				<p className="text-[11px] leading-tight text-error">
					{humanizeZodError(error)}
				</p>
			)}
		</div>
	);
}
