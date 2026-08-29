"use client";

import { Rocket } from "lucide-react";
import { useState } from "react";
import { EmailForm } from "@/components/auth/email-form";
import { OtpForm } from "@/components/auth/otp-form";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/constants";

export default function LoginPage() {
	const [step, setStep] = useState<"email" | "otp">("email");
	const [email, setEmail] = useState("");
	const [devCode, setDevCode] = useState<string | null>(null);

	function handleCodeSent(sentEmail: string, devCode?: string | null) {
		setEmail(sentEmail);
		setDevCode(devCode ?? null);
		setStep("otp");
	}

	function handleBack() {
		setStep("email");
		setEmail("");
		setDevCode(null);
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-bg-dark p-4">
			{/* Background decorative elements */}
			<div className="fixed inset-0 overflow-hidden pointer-events-none">
				<div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
				<div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />
			</div>

			<div className="relative w-full max-w-md">
				{/* Logo / Brand */}
				<div className="mb-8 text-center">
					<div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary shadow-lg shadow-primary/25">
						<Rocket className="h-7 w-7 text-white" />
					</div>
					<h1 className="gradient-primary-text text-3xl font-bold tracking-tight">
						{APP_NAME}
					</h1>
					<p className="mt-2 text-sm text-text-muted">{APP_DESCRIPTION}</p>
				</div>

				{/* Auth Card with gradient border */}
				<div className="relative rounded-2xl p-[1px] gradient-primary">
					<div className="rounded-2xl bg-bg-card p-6 sm:p-8">
						{/* Step indicator */}
						<div className="mb-6 flex items-center justify-center gap-2">
							<div
								className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
									step === "email"
										? "gradient-primary text-white shadow-sm"
										: "bg-border text-text-muted"
								}`}
							>
								1
							</div>
							<div className="h-px w-8 bg-border" />
							<div
								className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
									step === "otp"
										? "gradient-primary text-white shadow-sm"
										: "bg-border text-text-muted"
								}`}
							>
								2
							</div>
						</div>

						<div className="mb-4 text-center">
							<h2 className="text-lg font-semibold text-text-primary">
								{step === "email" ? "Sign in to continue" : "Check your email"}
							</h2>
							<p className="mt-1 text-sm text-text-muted">
								{step === "email"
									? "Enter your email to receive a verification code"
									: "Enter the 6-digit code we sent you"}
							</p>
						</div>

						{step === "email" ? (
							<EmailForm onCodeSent={handleCodeSent} />
						) : (
							<OtpForm email={email} devCode={devCode} onBack={handleBack} />
						)}
					</div>
				</div>

				{/* Footer */}
				<p className="mt-6 text-center text-xs text-text-muted">
					TikTok Shop &middot; Creator Campaign Copilot &middot; Internal Tool
				</p>
			</div>
		</div>
	);
}
