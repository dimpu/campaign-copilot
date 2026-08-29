import { cn } from "@/lib/utils";

interface PhoneFrameProps {
	children: React.ReactNode;
	className?: string;
	/** Show the phone notch/dynamic island. Default: true */
	showNotch?: boolean;
	/** Show home indicator bar at bottom. Default: true */
	showHomeBar?: boolean;
}

/**
 * A phone-shaped frame that wraps mobile-first content (e.g. campaign preview
 * cards) to give users a realistic preview of the creator-facing experience.
 * Purely decorative — no interactivity or `"use client"` needed.
 */
export function PhoneFrame({
	children,
	className,
	showNotch = true,
	showHomeBar = true,
}: PhoneFrameProps) {
	return (
		<div
			className={cn(
				"relative mx-auto",
				/* The phone body — 375px is the standard mobile viewport width */
				"w-[375px]",
				"rounded-[2.5rem]",
				"border-[6px] border-gray-800 dark:border-gray-700",
				"bg-bg-dark",
				"shadow-[0_0_0_2px_rgba(255,255,255,0.06),0_25px_50px_-12px_rgba(0,0,0,0.5)]",
				"overflow-hidden",
				className,
			)}
		>
			{/* Dynamic island / notch */}
			{showNotch && (
				<div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-10">
					<div
						className={cn(
							"h-[1.6rem] w-[7.5rem]",
							"rounded-full",
							"bg-gray-800 dark:bg-gray-700",
						)}
					/>
				</div>
			)}

			{/* Status bar spacer — reserves space below the notch so content
			    doesn't overlap. Height matches notch + padding. */}
			{showNotch && <div className="h-14 shrink-0" />}

			{/* Content area */}
			<div
				className="overflow-y-auto"
				style={{ maxHeight: "calc(812px - 6rem)" }}
			>
				{children}
			</div>

			{/* Home indicator bar */}
			{showHomeBar && (
				<div className="flex justify-center py-2 shrink-0">
					<div className="h-1 w-32 rounded-full bg-gray-600 dark:bg-gray-500" />
				</div>
			)}
		</div>
	);
}
