"use client";

import { Cpu, FlaskConical, Settings, User } from "lucide-react";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function SettingsPage() {
	const { data: session } = useSession();
	const [seedLoading, setSeedLoading] = useState(false);

	const handleSeed = async () => {
		setSeedLoading(true);
		try {
			const res = await fetch("/api/seed", { method: "POST" });
			if (res.ok) {
				toast.success("Database seeded with 20,000 creators!");
			} else {
				toast.error("Seed failed");
			}
		} catch {
			toast.error("Seed failed");
		} finally {
			setSeedLoading(false);
		}
	};

	return (
		<div className="p-6 max-w-2xl space-y-6">
			<div className="flex items-center gap-2">
				<Settings className="h-5 w-5 text-primary" />
				<h1 className="text-xl font-bold">Settings</h1>
			</div>

			{/* Profile */}
			<Card>
				<CardHeader>
					<div className="flex items-center gap-2">
						<User className="h-4 w-4 text-primary" />
						<CardTitle className="text-base">Profile</CardTitle>
					</div>
					<CardDescription>Your account information</CardDescription>
				</CardHeader>
				<CardContent className="space-y-3">
					<div>
						<Label className="text-text-muted">Email</Label>
						<p className="text-sm">
							{session?.user?.email ?? "demo@bytedance.com"}
						</p>
					</div>
					<div>
						<Label className="text-text-muted">Name</Label>
						<p className="text-sm">{session?.user?.name ?? "Demo User"}</p>
					</div>
					<div>
						<Label className="text-text-muted">Role</Label>
						<Badge variant="secondary">
							{(session?.user as { role?: string })?.role ?? "ops"}
						</Badge>
					</div>
				</CardContent>
			</Card>

			{/* AI Settings */}
			<Card>
				<CardHeader>
					<div className="flex items-center gap-2">
						<Cpu className="h-4 w-4 text-primary" />
						<CardTitle className="text-base">AI / LLM</CardTitle>
					</div>
					<CardDescription>Configure the AI model provider</CardDescription>
				</CardHeader>
				<CardContent className="space-y-3">
					<div>
						<Label>Provider Priority</Label>
						<div className="mt-2 space-y-2 text-sm">
							<div className="flex items-center gap-2">
								<Badge variant="success">LLMBox</Badge>
								<span className="text-text-secondary">
									GLM 5.1 — ByteDance internal (llmbox.tiktok-row.net)
								</span>
							</div>
							<div className="flex items-center gap-2">
								<Badge variant="secondary">OpenAI</Badge>
								<span className="text-text-secondary">
									GPT-4o — Public cloud (fallback)
								</span>
							</div>
							<div className="flex items-center gap-2">
								<Badge variant="secondary">Mock</Badge>
								<span className="text-text-secondary">
									Deterministic offline mode (demo / testing)
								</span>
							</div>
						</div>
						<p className="text-xs text-text-muted mt-3">
							Set{" "}
							<code className="bg-bg-dark px-1 rounded">LLMBOX_API_KEY</code> in{" "}
							<code className="bg-bg-dark px-1 rounded">.env.local</code> to use
							LLMBox. Set{" "}
							<code className="bg-bg-dark px-1 rounded">LLM_MODE=mock</code> for
							offline demo.
						</p>
					</div>
				</CardContent>
			</Card>

			{/* Dev Tools */}
			<Card>
				<CardHeader>
					<div className="flex items-center gap-2">
						<FlaskConical className="h-4 w-4 text-primary" />
						<CardTitle className="text-base">Dev Tools</CardTitle>
					</div>
					<CardDescription>Development utilities</CardDescription>
				</CardHeader>
				<CardContent className="space-y-3">
					<div>
						<Label>Re-seed Database</Label>
						<p className="text-xs text-text-muted mb-2">
							Wipes and re-generates 20,000 synthetic creator profiles. This is
							deterministic (faker seed 42).
						</p>
						<Button
							variant="outline"
							size="sm"
							onClick={handleSeed}
							disabled={seedLoading}
						>
							{seedLoading ? "Seeding..." : "Re-seed Database"}
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
