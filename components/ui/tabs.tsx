"use client";

import { createContext, useContext, useState } from "react";
import { cn } from "@/lib/utils";

interface TabsContextType {
	value: string;
	onValueChange: (v: string) => void;
}
const TabsContext = createContext<TabsContextType>({
	value: "",
	onValueChange: () => {},
});

export function Tabs({
	defaultValue,
	value,
	onValueChange,
	className,
	children,
}: {
	defaultValue?: string;
	value?: string;
	onValueChange?: (v: string) => void;
	className?: string;
	children: React.ReactNode;
}) {
	const [internal, setInternal] = useState(defaultValue ?? "");
	const ctx = {
		value: value ?? internal,
		onValueChange: onValueChange ?? setInternal,
	};
	return (
		<TabsContext.Provider value={ctx}>
			<div className={className}>{children}</div>
		</TabsContext.Provider>
	);
}

export function TabsList({
	className,
	children,
}: {
	className?: string;
	children: React.ReactNode;
}) {
	return (
		<div
			className={cn(
				"inline-flex h-9 items-center justify-center rounded-lg bg-bg-dark p-1 text-text-secondary",
				className,
			)}
		>
			{children}
		</div>
	);
}

export function TabsTrigger({
	value,
	children,
	className,
}: {
	value: string;
	children: React.ReactNode;
	className?: string;
}) {
	const ctx = useContext(TabsContext);
	const active = ctx.value === value;
	return (
		<button
			type="button"
			onClick={() => ctx.onValueChange(value)}
			className={cn(
				"inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium transition-all",
				"focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary",
				active
					? "bg-bg-card text-text-primary shadow-sm"
					: "hover:text-text-primary",
				className,
			)}
		>
			{children}
		</button>
	);
}

export function TabsContent({
	value,
	children,
	className,
}: {
	value: string;
	children: React.ReactNode;
	className?: string;
}) {
	const ctx = useContext(TabsContext);
	if (ctx.value !== value) return null;
	return <div className={cn("mt-2", className)}>{children}</div>;
}
