"use client";

import { LogOut, Rocket, Settings, Sparkles } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
	{
		label: "Campaigns",
		href: "/campaigns",
		icon: Rocket,
	},
	{
		label: "Settings",
		href: "/settings",
		icon: Settings,
	},
];

export function Sidebar() {
	const pathname = usePathname();
	const router = useRouter();
	const { data: session } = useSession();

	const user = session?.user;
	const initials = user?.name
		? user.name
				.split(" ")
				.map((n: string) => n[0])
				.join("")
				.toUpperCase()
				.slice(0, 2)
		: "U";

	return (
		<aside className="flex h-screen w-64 flex-col border-r border-border bg-bg-dark">
			{/* Brand */}
			<button
				type="button"
				className="flex h-14 w-full items-center gap-2.5 border-b border-border px-4 cursor-pointer text-left"
				onClick={() => router.push("/campaigns")}
			>
				<div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
					<Sparkles className="h-4.5 w-4.5 text-white" />
				</div>
				<span className="gradient-primary-text text-lg font-bold tracking-tight">
					{APP_NAME}
				</span>
			</button>

			{/* Navigation */}
			<nav className="flex-1 space-y-1 px-3 py-4">
				{NAV_ITEMS.map((item) => {
					const isActive =
						pathname === item.href || pathname.startsWith(`${item.href}/`);
					const Icon = item.icon;

					return (
						<Button
							key={item.href}
							variant="ghost"
							size="sm"
							className={cn(
								"w-full justify-start gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
								isActive
									? "bg-bg-card-hover text-text-primary border-l-2 border-primary rounded-l-none"
									: "text-text-secondary hover:text-text-primary hover:bg-bg-card-hover border-l-2 border-transparent rounded-l-none",
							)}
							onClick={() => router.push(item.href)}
						>
							<Icon
								className={cn(
									"h-4 w-4",
									isActive ? "text-primary" : "text-text-muted",
								)}
							/>
							{item.label}
						</Button>
					);
				})}
			</nav>

			{/* User Section */}
			<div className="border-t border-border p-3">
				<div className="flex items-center gap-3 rounded-lg px-2 py-2">
					<Avatar className="h-9 w-9">
						<AvatarFallback className="gradient-primary text-white text-xs font-bold">
							{initials}
						</AvatarFallback>
					</Avatar>
					<div className="flex-1 min-w-0">
						<p className="text-sm font-medium text-text-primary truncate">
							{user?.name ?? "User"}
						</p>
						<p className="text-xs text-text-muted truncate">
							{user?.email ?? ""}
						</p>
					</div>
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8 text-text-muted hover:text-text-primary"
								onClick={() => signOut({ callbackUrl: "/login" })}
							>
								<LogOut className="h-4 w-4" />
							</Button>
						</TooltipTrigger>
						<TooltipContent side="right">Sign out</TooltipContent>
					</Tooltip>
				</div>
			</div>
		</aside>
	);
}
