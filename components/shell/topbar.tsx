"use client";

import { Bell, Moon, Sparkles, Sun } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/constants";
import { UserNav } from "./user-nav";

export function Topbar() {
	const { theme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);
	const router = useRouter();

	useEffect(() => {
		setMounted(true);
	}, []);

	return (
		<header className="flex h-14 items-center justify-between border-b border-border bg-bg-dark px-6">
			{/* Page Title */}
			<button
				type="button"
				className="flex h-14 w-full items-center gap-2.5 border-b border-border cursor-pointer text-left"
				onClick={() => router.push("/campaigns")}
			>
				<div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
					<Sparkles className="h-4.5 w-4.5 text-white" />
				</div>
				<span className="gradient-primary-text text-lg font-bold tracking-tight">
					{APP_NAME}
				</span>
			</button>
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
