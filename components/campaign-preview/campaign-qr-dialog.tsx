"use client";

import { Monitor, QrCode, Smartphone } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";

interface CampaignQrDialogProps {
	campaignId: string;
	campaignName: string;
}

export function CampaignQrDialog({ campaignId }: CampaignQrDialogProps) {
	const [copied, setCopied] = useState(false);

	// Build the preview URL — use NEXT_PUBLIC_APP_URL or fall back to window.location.origin
	const baseUrl =
		typeof window !== "undefined"
			? window.location.origin
			: (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000");
	const previewUrl = `${baseUrl}/campaigns/${campaignId}/preview`;

	const handleCopyLink = async () => {
		try {
			await navigator.clipboard.writeText(previewUrl);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			// Fallback — no clipboard access
		}
	};

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button variant="outline" size="sm" className="gap-1.5">
					<QrCode className="h-4 w-4" />
					Mobile Preview
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Smartphone className="h-5 w-5 text-primary-light" />
						Mobile Preview
					</DialogTitle>
					<DialogDescription>
						Scan this QR code with your phone to preview how creators will see
						this campaign.
					</DialogDescription>
				</DialogHeader>

				<div className="flex flex-col items-center gap-6 py-4">
					{/* QR Code */}
					<div className="bg-white p-4 rounded-xl shadow-lg">
						<QRCodeSVG
							value={previewUrl}
							size={200}
							level="M"
							bgColor="#ffffff"
							fgColor="#0a0a0f"
							includeMargin={false}
						/>
					</div>

					{/* Campaign Name */}
					<p className="text-sm font-medium text-text-primary text-center">
						Scan with your phone camara
					</p>

					{/* URL + Copy */}
					<div className="w-full space-y-2">
						<div className="flex items-center gap-2 bg-bg-card rounded-lg px-3 py-2 border border-border">
							<Monitor className="h-3.5 w-3.5 text-text-muted shrink-0" />
							<code className="text-xs text-text-secondary truncate flex-1">
								{previewUrl}
							</code>
						</div>
						<Button
							variant="outline"
							size="sm"
							className="w-full"
							onClick={handleCopyLink}
						>
							{copied ? "✓ Copied!" : "Copy Link"}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
