"use client";

import { ArrowLeft, ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const OTP_BOXES = [0, 1, 2, 3, 4, 5] as const;

interface OtpFormProps {
	email: string;
	devCode?: string | null;
	onBack: () => void;
}

export function OtpForm({
	email,
	devCode: initialDevCode,
	onBack,
}: OtpFormProps) {
	const router = useRouter();
	const [code, setCode] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [devCode, _setDevCode] = useState<string | null>(
		initialDevCode ?? null,
	);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		// Focus the input on mount
		inputRef.current?.focus();
	}, []);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);

		if (code.length !== 6) {
			setError("Please enter the complete 6-digit code");
			return;
		}

		if (!/^\d{6}$/.test(code)) {
			setError("Code must be 6 digits");
			return;
		}

		setIsLoading(true);

		try {
			const result = await signIn("credentials", {
				email,
				code,
				redirect: false,
			});

			if (result?.error) {
				setError(
					result.error === "CredentialsSignin"
						? "Invalid or expired code. Please try again."
						: "Verification failed. Please try again.",
				);
			} else {
				router.push("/campaigns");
				router.refresh();
			}
		} catch {
			setError("Network error. Please try again.");
		} finally {
			setIsLoading(false);
		}
	}

	const handleInputChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const value = e.target.value.replace(/\D/g, "").slice(0, 6);
			setCode(value);
			setError(null);
		},
		[],
	);

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter" && code.length === 6 && !isLoading) {
			e.preventDefault();
			handleSubmit(e);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<div className="space-y-2">
				<div className="flex items-center justify-between">
					<label
						htmlFor="otp-code"
						className="text-sm font-medium text-text-secondary"
					>
						Verification code
					</label>
					<button
						type="button"
						onClick={onBack}
						className="text-xs text-text-muted hover:text-text-secondary flex items-center gap-1"
					>
						<ArrowLeft className="h-3 w-3" />
						Change email
					</button>
				</div>

				<p className="text-xs text-text-muted">
					We sent a 6-digit code to{" "}
					<span className="text-text-primary font-medium">{email}</span>
				</p>

				{/* 6-digit input */}
				<div className="relative">
					<ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
					<Input
						ref={inputRef}
						id="otp-code"
						type="text"
						inputMode="numeric"
						autoComplete="one-time-code"
						placeholder="000000"
						value={code}
						onChange={handleInputChange}
						onKeyDown={handleKeyDown}
						className="pl-10 h-11 text-center text-lg tracking-[0.5em] font-mono"
						disabled={isLoading}
						maxLength={6}
					/>
				</div>

				{/* OTP boxes visual */}
				<div className="flex justify-center gap-2 mt-3">
					{OTP_BOXES.map((pos) => (
						<div
							key={`otp-${pos}`}
							className={cn(
								"flex h-10 w-10 items-center justify-center rounded-md border text-lg font-mono font-bold transition-all",
								code[pos]
									? "border-primary bg-primary/10 text-primary"
									: "border-border text-text-muted",
								pos === code.length &&
									"border-primary/50 ring-1 ring-primary/30",
							)}
						>
							{code[pos] || ""}
						</div>
					))}
				</div>
			</div>

			{error && (
				<p className="text-sm text-error" role="alert">
					{error}
				</p>
			)}

			{/* Dev mode: show code */}
			{devCode && (
				<div className="rounded-md bg-bg-card border border-border p-3">
					<p className="text-xs text-text-muted text-center">
						<span className="font-semibold text-warning">DEV MODE:</span> Your
						code is{" "}
						<span className="font-mono font-bold text-primary text-lg">
							{devCode}
						</span>
					</p>
				</div>
			)}

			<Button
				type="submit"
				className="w-full h-11 gradient-primary text-white font-semibold"
				disabled={isLoading || code.length !== 6}
			>
				{isLoading ? (
					<>
						<Loader2 className="h-4 w-4 animate-spin" />
						Verifying...
					</>
				) : (
					<>
						Verify Code
						<ArrowRight className="h-4 w-4" />
					</>
				)}
			</Button>

			<p className="text-xs text-text-muted text-center">
				Didn&apos;t receive the code?{" "}
				<button
					type="button"
					onClick={() => onBack()}
					className="text-primary hover:underline font-medium"
				>
					Send again
				</button>
			</p>
		</form>
	);
}
