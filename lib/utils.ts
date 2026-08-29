import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
	if (amount == null || Number.isNaN(amount)) return "—";
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		maximumFractionDigits: 0,
	}).format(amount);
}

export function formatNumber(n: number): string {
	if (n == null || Number.isNaN(n)) return "—";
	if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
	if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
	return n.toLocaleString("en-US");
}

export function formatPercent(p: number): string {
	if (p == null || Number.isNaN(p)) return "—";
	return `${(p * 100).toFixed(1)}%`;
}

export function slugify(text: string): string {
	return text
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/(^-|-$)/g, "")
		.slice(0, 80);
}

export function generateId(): string {
	return crypto.randomUUID();
}

export function now(): number {
	return Date.now();
}

export function debounce<T extends (...args: unknown[]) => void>(
	fn: T,
	ms: number,
): (...args: Parameters<T>) => void {
	let timer: ReturnType<typeof setTimeout>;
	return (...args: Parameters<T>) => {
		clearTimeout(timer);
		timer = setTimeout(() => fn(...args), ms);
	};
}

// react-hook-form `setValueAs` for number inputs. Empty/blank input yields
// `undefined` (omitted from the payload) instead of `NaN`, which JSON
// serializes to `null` and would otherwise fail the campaign-config schema.
export function numberFieldValueAs(v: unknown): number | undefined {
	if (v === "" || v === null || v === undefined) return undefined;
	const n = typeof v === "number" ? v : Number(v);
	return Number.isNaN(n) ? undefined : n;
}

// Turn raw zod validation messages into human-readable, field-level copy.
export function humanizeZodError(message: string): string {
	const m = message.trim();
	let match = m.match(/^String must contain at least (\d+) character/i);
	if (match) return `Must be at least ${match[1]} characters`;
	match = m.match(/^String must contain at most (\d+) character/i);
	if (match) return `Must be at most ${match[1]} characters`;
	if (/^Expected number, received (nan|null)/i.test(m))
		return "Must be a valid number";
	match = m.match(/^Expected (\w+), received (?:nan|null|\w+)/i);
	if (match) return `Must be a valid ${match[1].toLowerCase()}`;
	if (m === "Required") return "This field is required";
	return m;
}
