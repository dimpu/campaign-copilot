"use client";

import { Check, Copy } from "lucide-react";
import { useCallback, useState } from "react";
import { LOCALES } from "@/lib/constants";
import type { CopyVariant, Locale } from "@/lib/schemas/campaign-config";
import { cn } from "@/lib/utils";

interface CopyPreviewCardProps {
	copyVariants: CopyVariant[];
	className?: string;
}

export function CopyPreviewCard({
	copyVariants,
	className,
}: CopyPreviewCardProps) {
	const [activeLocale, setActiveLocale] = useState<Locale>(
		copyVariants[0]?.locale ?? "en",
	);

	const activeVariant = copyVariants.find((v) => v.locale === activeLocale);

	if (!copyVariants || copyVariants.length === 0) return null;

	return (
		<div
			className={cn(
				"rounded-lg border border-border overflow-hidden",
				className,
			)}
		>
			{/* Header */}
			<div className="flex items-center gap-2 border-b border-border px-3 py-2">
				<span className="text-xs font-semibold text-text-primary">
					Copy Preview
				</span>
				<span className="ml-auto text-[10px] text-text-muted">
					{copyVariants.length} locale{copyVariants.length > 1 ? "s" : ""}
				</span>
			</div>

			{/* Locale tabs */}
			<div className="flex gap-0.5 border-b border-border bg-bg-dark/50 px-2 py-1.5">
				{copyVariants.map((v) => {
					const localeInfo = LOCALES.find((l) => l.code === v.locale);
					const isActive = v.locale === activeLocale;

					return (
						<button
							key={v.locale}
							type="button"
							onClick={() => setActiveLocale(v.locale)}
							className={cn(
								"inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium transition-all",
								"focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary",
								isActive
									? "bg-bg-card text-text-primary shadow-sm"
									: "text-text-muted hover:text-text-secondary",
							)}
						>
							{localeInfo?.flag && <span>{localeInfo.flag}</span>}
							<span>{v.locale}</span>
						</button>
					);
				})}
			</div>

			{/* Copy content */}
			{activeVariant && (
				<div className="divide-y divide-border/50">
					<CopyField label="Subject" value={activeVariant.subject} />
					<CopyField label="Title" value={activeVariant.title} />
					<CopyField label="Body" value={activeVariant.body} maxLines={4} />
					<CopyField label="CTA" value={activeVariant.ctaText} />
					{activeVariant.hashtags && activeVariant.hashtags.length > 0 && (
						<div className="px-3 py-2">
							<span className="text-[10px] font-semibold text-text-muted uppercase tracking-wide">
								Hashtags
							</span>
							<div className="mt-1 flex flex-wrap gap-1">
								{activeVariant.hashtags.map((tag) => (
									<span
										key={tag}
										className="inline-flex items-center rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-mono text-primary-light"
									>
										#{tag}
									</span>
								))}
							</div>
						</div>
					)}
					{activeVariant.smsVariant && (
						<CopyField label="SMS" value={activeVariant.smsVariant} />
					)}
				</div>
			)}
		</div>
	);
}

function CopyField({
	label,
	value,
	maxLines,
}: {
	label: string;
	value: string;
	maxLines?: number;
}) {
	const [copied, setCopied] = useState(false);

	const handleCopy = useCallback(async () => {
		if (!value) return;
		await navigator.clipboard.writeText(value);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	}, [value]);

	return (
		<div className="group px-3 py-2">
			<div className="flex items-center justify-between">
				<span className="text-[10px] font-semibold text-text-muted uppercase tracking-wide">
					{label}
				</span>
				<button
					type="button"
					onClick={handleCopy}
					className={cn(
						"inline-flex items-center gap-1 rounded px-1.5 py-0.5",
						"text-[10px] text-text-muted transition-all",
						"opacity-0 group-hover:opacity-100",
						"hover:bg-bg-dark hover:text-text-primary",
						"focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:opacity-100",
					)}
				>
					{copied ? (
						<>
							<Check className="h-3 w-3 text-success" />
							<span className="text-success">Copied</span>
						</>
					) : (
						<>
							<Copy className="h-3 w-3" />
							<span>Copy</span>
						</>
					)}
				</button>
			</div>
			<p
				className={cn(
					"mt-0.5 text-xs text-text-primary leading-relaxed",
					maxLines && `line-clamp-${maxLines}`,
				)}
				style={
					maxLines
						? {
								display: "-webkit-box",
								WebkitLineClamp: maxLines,
								WebkitBoxOrient: "vertical",
								overflow: "hidden",
							}
						: undefined
				}
			>
				{value}
			</p>
		</div>
	);
}
