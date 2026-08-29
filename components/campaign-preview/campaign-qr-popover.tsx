"use client";

import { Copy, Monitor, QrCode, Smartphone } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";

interface CampaignQrPopoverProps {
	campaignId: string;
	campaignName: string;
}

export function CampaignQrPopover({
	campaignId,
	campaignName,
}: CampaignQrPopoverProps) {
	const [copied, setCopied] = useState(false);
	const [open, setOpen] = useState(false);
	const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const baseUrl =
		typeof window !== "undefined"
			? window.location.origin
			: (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000");
	const previewUrl = `${baseUrl}/campaigns/${campaignId}/preview`;

	// Show on hover/focus, hide after a short delay when leaving both
	// trigger and content — long enough to move cursor into the popover.
	const show = () => {
		if (hideTimerRef.current) {
			clearTimeout(hideTimerRef.current);
			hideTimerRef.current = null;
		}
		setOpen(true);
	};

	const hide = () => {
		hideTimerRef.current = setTimeout(() => setOpen(false), 200);
	};

	const handleCopyLink = async (e: React.MouseEvent) => {
		e.stopPropagation();
		try {
			await navigator.clipboard.writeText(previewUrl);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			// clipboard not available
		}
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					size="sm"
					className="gap-1.5"
					onMouseEnter={show}
					onMouseLeave={hide}
					onFocus={show}
					onBlur={hide}
				>
					<QrCode className="h-4 w-4" />
					Mobile Preview
				</Button>
			</PopoverTrigger>
			<PopoverContent
				className="w-64 p-0"
				side="bottom"
				align="end"
				sideOffset={8}
				onOpenAutoFocus={(e) => e.preventDefault()}
				onMouseEnter={show}
				onMouseLeave={hide}
			>
				<div className="flex flex-col items-center gap-3 p-4">
					{/* Header */}
					<div className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary self-start">
						<Smartphone className="h-3.5 w-3.5 text-primary-light" />
						Scan to preview
					</div>

					{/* QR Code */}
					<div className="bg-white p-3 rounded-lg shadow-sm">
						<QRCodeSVG
							value={previewUrl}
							size={140}
							level="M"
							bgColor="#ffffff"
							fgColor="#0a0a0f"
							includeMargin={false}
						/>
					</div>

					{/* Campaign Name */}
					{campaignName && (
						<p className="text-xs font-medium text-text-primary text-center line-clamp-1">
							{campaignName}
						</p>
					)}

					{/* URL row + copy */}
					<div className="w-full space-y-1.5">
						<div className="flex items-center gap-1.5 bg-bg-dark rounded-md px-2 py-1.5 border border-border">
							<Monitor className="h-3 w-3 text-text-muted shrink-0" />
							<code className="text-[10px] text-text-secondary truncate flex-1">
								{previewUrl}
							</code>
						</div>
						<button
							type="button"
							onClick={handleCopyLink}
							className="flex items-center justify-center gap-1.5 w-full rounded-md border border-border bg-transparent hover:bg-bg-card-hover px-2 py-1.5 text-[11px] font-medium text-text-secondary hover:text-text-primary transition-colors"
						>
							{copied ? (
								<>
									<span className="text-success">✓</span> Copied!
								</>
							) : (
								<>
									<Copy className="h-3 w-3" /> Copy Link
								</>
							)}
						</button>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}
