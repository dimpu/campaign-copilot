"use client";

import { ArrowRight, Loader2, Mail } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface EmailFormProps {
	onCodeSent: (email: string, devCode?: string | null) => void;
}

export function EmailForm({ onCodeSent }: EmailFormProps) {
	const [email, setEmail] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);

		if (!email.trim()) {
			setError("Please enter your email address");
			return;
		}

		// Basic email validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email.trim())) {
			setError("Please enter a valid email address");
			return;
		}

		setIsLoading(true);

		try {
			const res = await fetch("/api/auth/request-code", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email: email.trim() }),
			});

			const data = await res.json();

			if (!res.ok) {
				setError(data.error || "Failed to send code. Please try again.");
				return;
			}

			onCodeSent(email.trim(), data.devCode ?? null);
		} catch {
			setError("Network error. Please check your connection and try again.");
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<div className="space-y-2">
				<label
					htmlFor="email"
					className="text-sm font-medium text-text-secondary"
				>
					Email address
				</label>
				<div className="relative">
					<Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
					<Input
						id="email"
						type="email"
						placeholder="you@bytedance.com"
						value={email}
						onChange={(e) => {
							setEmail(e.target.value);
							setError(null);
						}}
						className="pl-10 h-11"
						disabled={isLoading}
						autoComplete="email"
						autoFocus
					/>
				</div>
			</div>

			{error && (
				<p className="text-sm text-error" role="alert">
					{error}
				</p>
			)}

			<Button
				type="submit"
				className="w-full h-11 gradient-primary text-white font-semibold"
				disabled={isLoading}
			>
				{isLoading ? (
					<>
						<Loader2 className="h-4 w-4 animate-spin" />
						Sending code...
					</>
				) : (
					<>
						Send Code
						<ArrowRight className="h-4 w-4" />
					</>
				)}
			</Button>
		</form>
	);
}
