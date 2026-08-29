"use client";

import { SessionProvider } from "next-auth/react";
// import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function AppLayout({ children }: { children: React.ReactNode }) {
	return (
		<SessionProvider>
			<TooltipProvider delayDuration={300}>
				<div className="flex h-screen w-full overflow-hidden bg-bg-dark">
					{/* Sidebar */}
					{/* <Sidebar /> */}

					{/* Main Content Area */}
					<div className="flex flex-1 flex-col overflow-hidden">
						{/* Topbar */}
						<Topbar />

						{/* Page Content */}
						<main className="flex-1 overflow-y-auto bg-bg-dark">
							{children}
						</main>
					</div>
				</div>
			</TooltipProvider>
		</SessionProvider>
	);
}
