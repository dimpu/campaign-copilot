"use client";

import { Globe } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { LOCALES, TONES } from "@/lib/constants";
import type { CampaignConfig } from "@/lib/schemas/campaign-config";
import { cn } from "@/lib/utils";
import { DiffHighlightInput } from "./diff-highlight-input";

export function CopySection() {
	const { watch, setValue } = useFormContext<CampaignConfig>();
	const targetLocales = watch("targetLocales");
	const tone = watch("tone");

	const toggleLocale = (locale: string) => {
		const current = targetLocales ?? ["en"];
		const next = current.includes(locale as never)
			? current.filter((l) => l !== locale)
			: [...current, locale];
		setValue("targetLocales", next as CampaignConfig["targetLocales"]);
	};

	return (
		<Card className="p-4 space-y-4">
			<div className="flex items-center gap-2 mb-2">
				<Globe className="h-4 w-4 text-primary" />
				<h3 className="text-sm font-semibold">Copy &amp; Languages</h3>
			</div>

			<div className="grid gap-3">
				<DiffHighlightInput fieldName="targetLocales">
					<Label>Target Languages *</Label>
					<div className="flex flex-wrap gap-1.5">
						{LOCALES.map((l) => {
							const active = (targetLocales ?? ["en"]).includes(
								l.code as never,
							);
							return (
								<button
									key={l.code}
									type="button"
									onClick={() => toggleLocale(l.code)}
									className={cn(
										"px-2.5 py-1 rounded-md text-xs font-medium border transition-colors",
										active
											? "bg-primary/20 border-primary text-primary"
											: "border-border text-text-secondary hover:border-text-muted",
									)}
								>
									{l.flag} {l.name}
								</button>
							);
						})}
					</div>
				</DiffHighlightInput>

				<DiffHighlightInput fieldName="tone">
					<Label>Tone</Label>
					<Select
						value={tone}
						onValueChange={(v) => setValue("tone", v as CampaignConfig["tone"])}
						options={TONES}
					/>
				</DiffHighlightInput>
			</div>
		</Card>
	);
}
