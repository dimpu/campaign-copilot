"use client";

import { Bell, Moon, Sun } from "lucide-react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/constants";
import { UserNav } from "./user-nav";

export function Topbar() {
	const pathname = usePathname();
	const { theme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	const pageTitle = getPageTitle(pathname);

	return (
		<header className="flex h-14 items-center justify-between border-b border-border bg-bg-dark px-6">
			{/* Page Title */}
			<div className="flex items-center gap-2">
				<h1 className="text-lg font-semibold text-text-primary">{pageTitle}</h1>
			</div>

			{/* Right side */}
			<div className="flex items-center gap-2">
				{/* Theme toggle */}
				{mounted && (
					<Button
						variant="ghost"
						size="icon"
						className="h-9 w-9 text-text-muted hover:text-text-primary"
						onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
						aria-label="Toggle theme"
					>
						{theme === "dark" ? (
							<Sun className="h-4 w-4" />
						) : (
							<Moon className="h-4 w-4" />
						)}
					</Button>
				)}

				{/* Notifications */}
				<Button
					variant="ghost"
					size="icon"
					className="h-9 w-9 text-text-muted hover:text-text-primary"
					aria-label="Notifications"
				>
					<Bell className="h-4 w-4" />
				</Button>

				{/* User Menu */}
				<UserNav />
			</div>
		</header>
	);
}

function getPageTitle(pathname: string): string {
	if (pathname === "/campaigns") return "Campaigns";
	if (pathname === "/campaigns/new") return "New Campaign";
	if (pathname?.startsWith("/campaigns/") && pathname.includes("/edit"))
		return "Edit Campaign";
	if (pathname?.startsWith("/campaigns/")) return "Campaign Dashboard";
	if (pathname === "/settings") return "Settings";
	return APP_NAME;
}
