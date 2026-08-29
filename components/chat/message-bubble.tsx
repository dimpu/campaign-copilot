"use client";

import { Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type {
	CopyVariant,
	SimulationResult,
	ValidationIssue,
} from "@/lib/schemas/campaign-config";
import { cn } from "@/lib/utils";
import { ReasoningTrace } from "./reasoning-trace";
import { CopyPreviewCard } from "./widgets/copy-preview-card";
import { EstimateCard } from "./widgets/estimate-card";
import { IssuesCard } from "./widgets/issues-card";

interface MessagePayload {
	configPatch?: Record<string, unknown>;
	stage?: string;
	issues?: ValidationIssue[];
	estimate?: SimulationResult;
	copyVariants?: CopyVariant[];
	reasoningSteps?: Array<{
		tool: string;
		summary: string;
		status?: "running" | "complete" | "error";
	}>;
}

interface MessageBubbleProps {
	id: string;
	role: "user" | "assistant" | "system" | "tool";
	content: string;
	payload?: MessagePayload;
	timestamp?: number;
	className?: string;
}

export function MessageBubble({
	role,
	content,
	payload,
	timestamp,
	className,
}: MessageBubbleProps) {
	const isUser = role === "user";
	const isAssistant = role === "assistant";

	if (role === "system" || role === "tool") {
		return null; // Don't render system/tool messages in the chat UI
	}

	return (
		<div
			className={cn(
				"flex w-full gap-3",
				isUser ? "justify-end" : "justify-start",
				className,
			)}
		>
			{/* Assistant avatar */}
			{isAssistant && (
				<div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent">
					<Sparkles className="h-3.5 w-3.5 text-white" />
				</div>
			)}

			<div
				className={cn(
					"group relative max-w-[85%] rounded-2xl px-4 py-3",
					isUser
						? "bg-gradient-to-br from-primary to-accent text-white"
						: "bg-bg-card border border-border text-text-primary",
				)}
			>
				{/* Content */}
				{isAssistant ? (
					<div className="prose prose-sm prose-invert max-w-none">
						<ReactMarkdown
							remarkPlugins={[remarkGfm]}
							components={{
								// Override elements for dark theme styling
								p: ({ children, ...props }) => (
									<p
										className="text-sm leading-relaxed text-text-primary mb-1.5 last:mb-0"
										{...props}
									>
										{children}
									</p>
								),
								strong: ({ children, ...props }) => (
									<strong
										className="font-semibold text-text-primary"
										{...props}
									>
										{children}
									</strong>
								),
								code: ({ className: codeClass, children, ...props }) => {
									const isInline = !codeClass;
									if (isInline) {
										return (
											<code
												className="rounded bg-bg-dark px-1.5 py-0.5 text-xs font-mono text-primary-light"
												{...props}
											>
												{children}
											</code>
										);
									}
									return (
										<code
											className={cn(
												"block rounded bg-bg-dark px-3 py-2 text-xs font-mono text-text-primary overflow-x-auto",
												codeClass,
											)}
											{...props}
										>
											{children}
										</code>
									);
								},
								ul: ({ children, ...props }) => (
									<ul
										className="list-disc pl-4 text-sm text-text-primary space-y-0.5 mb-1.5"
										{...props}
									>
										{children}
									</ul>
								),
								ol: ({ children, ...props }) => (
									<ol
										className="list-decimal pl-4 text-sm text-text-primary space-y-0.5 mb-1.5"
										{...props}
									>
										{children}
									</ol>
								),
								li: ({ children, ...props }) => (
									<li className="text-sm text-text-primary" {...props}>
										{children}
									</li>
								),
								a: ({ children, ...props }) => (
									<a
										className="text-primary-light underline underline-offset-2 hover:text-primary"
										target="_blank"
										rel="noopener noreferrer"
										{...props}
									>
										{children}
									</a>
								),
								blockquote: ({ children, ...props }) => (
									<blockquote
										className="border-l-2 border-primary/50 pl-3 italic text-text-secondary"
										{...props}
									>
										{children}
									</blockquote>
								),
								table: ({ children, ...props }) => (
									<div className="overflow-x-auto mb-1.5">
										<table
											className="min-w-full text-xs border-collapse"
											{...props}
										>
											{children}
										</table>
									</div>
								),
								th: ({ children, ...props }) => (
									<th
										className="border border-border px-2 py-1 text-left font-semibold bg-bg-dark"
										{...props}
									>
										{children}
									</th>
								),
								td: ({ children, ...props }) => (
									<td className="border border-border px-2 py-1" {...props}>
										{children}
									</td>
								),
								h1: ({ children, ...props }) => (
									<h1
										className="text-base font-bold text-text-primary mt-3 mb-1.5"
										{...props}
									>
										{children}
									</h1>
								),
								h2: ({ children, ...props }) => (
									<h2
										className="text-sm font-bold text-text-primary mt-2.5 mb-1"
										{...props}
									>
										{children}
									</h2>
								),
								h3: ({ children, ...props }) => (
									<h3
										className="text-sm font-semibold text-text-primary mt-2 mb-1"
										{...props}
									>
										{children}
									</h3>
								),
							}}
						>
							{content}
						</ReactMarkdown>
					</div>
				) : (
					<p className="text-sm leading-relaxed whitespace-pre-wrap">
						{content}
					</p>
				)}

				{/* Embedded widget cards */}
				{payload?.issues && payload.issues.length > 0 && (
					<div className="mt-3">
						<IssuesCard issues={payload.issues} />
					</div>
				)}

				{payload?.estimate && (
					<div className="mt-3">
						<EstimateCard estimate={payload.estimate} />
					</div>
				)}

				{payload?.copyVariants && payload.copyVariants.length > 0 && (
					<div className="mt-3">
						<CopyPreviewCard copyVariants={payload.copyVariants} />
					</div>
				)}

				{/* Reasoning trace */}
				{payload?.reasoningSteps && payload.reasoningSteps.length > 0 && (
					<ReasoningTrace steps={payload.reasoningSteps} />
				)}

				{/* Timestamp */}
				{timestamp && (
					<div
						className={cn(
							"mt-2 text-[10px]",
							isUser ? "text-white/60" : "text-text-muted",
						)}
					>
						{formatTime(timestamp)}
					</div>
				)}
			</div>

			{/* User avatar */}
			{isUser && (
				<div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-bg-card border border-border">
					<span className="text-xs font-semibold text-text-secondary">U</span>
				</div>
			)}
		</div>
	);
}

function formatTime(ts: number): string {
	return new Date(ts).toLocaleTimeString("en-US", {
		hour: "numeric",
		minute: "2-digit",
		hour12: true,
	});
}
