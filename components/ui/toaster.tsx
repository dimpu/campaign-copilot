"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
	return (
		<SonnerToaster
			position="bottom-right"
			toastOptions={{
				style: {
					background: "#14141f",
					color: "#ffffff",
					border: "1px solid #2a2a3a",
				},
			}}
		/>
	);
}
