"use client";

import { Check, Copy, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LOCALES } from "@/lib/constants";
import type { CampaignConfig, Locale } from "@/lib/schemas/campaign-config";
import type { CopyRecord } from "@/lib/schemas/copy";

export function CopyTab({
	copy,
	campaignId,
	config,
}: {
	copy: CopyRecord[];
	campaignId: string;
	config: CampaignConfig;
}) {
	const [copied, setCopied] = useState<string | null>(null);
	const [regenerating, setRegenerating] = useState(false);

	const locales = (config.targetLocales ?? ["en"]) as Locale[];

	const handleCopy = (text: string, field: string) => {
		navigator.clipboard.writeText(text);
		setCopied(field);
		toast.success("Copied to clipboard!");
		setTimeout(() => setCopied(null), 2000);
	};

	const handleRegenerate = async () => {
		setRegenerating(true);
		try {
			const res = await fetch(`/api/campaigns/${campaignId}/copy/regenerate`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ locales, tone: config.tone }),
			});
			if (res.ok) {
				toast.success("Copy regenerated!");
			} else {
				toast.error("Failed to regenerate");
			}
		} catch {
			toast.error("Failed to regenerate");
		} finally {
			setRegenerating(false);
		}
	};

	const copyForLocale = (locale: string) =>
		copy.find((c) => c.locale === locale);

	return (
		<div className="space-y-4">
			<div className="flex justify-between items-center">
				<h3 className="text-sm font-semibold">Creator-Facing Copy</h3>
				<Button
					variant="outline"
					size="sm"
					onClick={handleRegenerate}
					disabled={regenerating}
				>
					<RefreshCw
						className={`h-4 w-4 ${regenerating ? "animate-spin" : ""}`}
					/>
					Regenerate
				</Button>
			</div>

			<Tabs defaultValue={locales[0]}>
				<TabsList>
					{locales.map((locale) => {
						const localeInfo = LOCALES.find((l) => l.code === locale);
						return (
							<TabsTrigger key={locale} value={locale}>
								{localeInfo?.flag} {localeInfo?.name ?? locale}
							</TabsTrigger>
						);
					})}
				</TabsList>

				{locales.map((locale) => {
					const c = copyForLocale(locale);
					return (
						<TabsContent key={locale} value={locale}>
							{c ? (
								<Card className="p-4 space-y-4">
									<CopyField
										label="Subject"
										value={c.subject ?? ""}
										copied={copied}
										onCopy={(v) => handleCopy(v, `subject-${locale}`)}
									/>
									<CopyField
										label="Title"
										value={c.title}
										copied={copied}
										onCopy={(v) => handleCopy(v, `title-${locale}`)}
									/>
									<CopyField
										label="Body"
										value={c.body}
										copied={copied}
										onCopy={(v) => handleCopy(v, `body-${locale}`)}
										multiline
									/>
									<CopyField
										label="CTA Text"
										value={c.ctaText}
										copied={copied}
										onCopy={(v) => handleCopy(v, `cta-${locale}`)}
									/>
									<CopyField
										label="Hashtags"
										value={
											Array.isArray(c.hashtags)
												? c.hashtags.join(" ")
												: (c.hashtags ?? "")
										}
										copied={copied}
										onCopy={(v) => handleCopy(v, `hashtags-${locale}`)}
									/>
									{c.tone && (
										<div className="flex items-center gap-2">
											<span className="text-xs text-text-muted">Tone:</span>
											<Badge variant="secondary">{c.tone}</Badge>
										</div>
									)}
								</Card>
							) : (
								<Card className="p-6 text-center text-text-muted">
									No copy generated yet for this locale.
								</Card>
							)}
						</TabsContent>
					);
				})}
			</Tabs>
		</div>
	);
}

function CopyField({
	label,
	value,
	copied,
	onCopy,
	multiline,
}: {
	label: string;
	value: string;
	copied: string | null;
	onCopy: (v: string) => void;
	multiline?: boolean;
}) {
	return (
		<div className="space-y-1">
			<div className="flex items-center justify-between">
				<span className="text-xs text-text-muted font-medium">{label}</span>
				<button
					type="button"
					onClick={() => onCopy(value)}
					className="text-text-muted hover:text-text-primary transition-colors"
				>
					{copied === `${label}-${value}` ? (
						<Check className="h-3 w-3 text-success" />
					) : (
						<Copy className="h-3 w-3" />
					)}
				</button>
			</div>
			<p className={`text-sm ${multiline ? "whitespace-pre-wrap" : ""}`}>
				{value}
			</p>
		</div>
	);
}
