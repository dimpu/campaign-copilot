"use client";

import { ArrowUp, Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface MessageInputProps {
	value: string;
	onChange: (value: string) => void;
	onSubmit: () => void;
	isLoading?: boolean;
	disabled?: boolean;
	placeholder?: string;
	className?: string;
}

export function MessageInput({
	value,
	onChange,
	onSubmit,
	isLoading = false,
	disabled = false,
	placeholder = "Describe your campaign...",
	className,
}: MessageInputProps) {
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const [isFocused, setIsFocused] = useState(false);

	// Autosize textarea
	const adjustHeight = useCallback(() => {
		const el = textareaRef.current;
		if (!el) return;
		el.style.height = "0";
		const scrollHeight = el.scrollHeight;
		el.style.height = `${Math.min(scrollHeight, 160)}px`;
	}, []);

	useEffect(() => {
		adjustHeight();
	}, [adjustHeight]);

	// ⌘K shortcut to focus
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key === "k") {
				e.preventDefault();
				textareaRef.current?.focus();
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, []);

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			if (value.trim() && !isLoading && !disabled) {
				onSubmit();
			}
		}
	};

	const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		onChange(e.target.value);
	};

	const isDisabled = disabled || isLoading;
	const canSend = value.trim().length > 0 && !isDisabled;

	return (
		<div
			className={cn(
				"flex items-end gap-2 rounded-xl border bg-bg-dark p-2 transition-all duration-200",
				isFocused
					? "border-primary/50 shadow-sm shadow-primary/10"
					: "border-border",
				className,
			)}
		>
			<textarea
				ref={textareaRef}
				value={value}
				onChange={handleChange}
				onKeyDown={handleKeyDown}
				onFocus={() => setIsFocused(true)}
				onBlur={() => setIsFocused(false)}
				disabled={isDisabled}
				placeholder={placeholder}
				rows={1}
				className={cn(
					"flex-1 resize-none bg-transparent px-1 py-1.5",
					"text-sm text-text-primary",
					"placeholder:text-text-muted",
					"focus:outline-none",
					"disabled:cursor-not-allowed disabled:opacity-50",
					"max-h-40 overflow-y-auto",
				)}
				style={{ minHeight: "24px" }}
			/>

			<button
				type="button"
				onClick={onSubmit}
				disabled={!canSend}
				className={cn(
					"flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200",
					canSend
						? "bg-gradient-to-br from-primary to-accent text-white shadow-sm hover:opacity-90 active:scale-95"
						: "bg-border text-text-muted",
					"focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary",
				)}
			>
				{isLoading ? (
					<Loader2 className="h-4 w-4 animate-spin" />
				) : (
					<ArrowUp className="h-4 w-4" />
				)}
			</button>
		</div>
	);
}
