"use client";

import { type Message, useChat } from "ai/react";
import { ArrowRight, Sparkles } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type {
	CampaignConfig,
	CopyVariant,
	SimulationResult,
	ValidationIssue,
} from "@/lib/schemas/campaign-config";
import type { DraftStage } from "@/lib/store/draft-store";
import { useDraftStore } from "@/lib/store/draft-store";
import { cn } from "@/lib/utils";
import { MessageBubble } from "./message-bubble";
import { MessageInput } from "./message-input";
import { QuickPrompts } from "./quick-prompts";
import { StageProgress } from "./stage-progress";

// ── Types ──

interface ChatPanelProps {
	campaignId?: string | null;
	onConfigUpdate?: (config: Partial<CampaignConfig>) => void;
	className?: string;
	/** Server-restored chat history (e.g. when editing an existing campaign). */
	initialMessages?: Message[];
}

interface MessagePayload {
	configPatch?: Partial<CampaignConfig>;
	stage?: DraftStage;
	issues?: ValidationIssue[];
	estimate?: SimulationResult;
	copyVariants?: CopyVariant[];
	reasoningSteps?: ReasoningStep[];
}

interface ReasoningStep {
	tool: string;
	summary: string;
	status?: "running" | "complete" | "error";
}

// ── Payload parser ──

function parsePayload(content: string): MessagePayload | undefined {
	// Look for JSON payload blocks in the format: <!-- payload {...} -->
	const payloadRegex = /<!--\s*payload\s*({[\s\S]*?})\s*-->/g;
	const matches = [...content.matchAll(payloadRegex)];

	if (matches.length === 0) return undefined;

	const payload: MessagePayload = {};

	for (const match of matches) {
		try {
			const data = JSON.parse(match[1]);
			if (data.configPatch) payload.configPatch = data.configPatch;
			if (data.stage) payload.stage = data.stage;
			if (data.issues) payload.issues = data.issues;
			if (data.estimate) payload.estimate = data.estimate;
			if (data.copyVariants) payload.copyVariants = data.copyVariants;
			if (data.reasoningSteps) payload.reasoningSteps = data.reasoningSteps;
		} catch {
			// Ignore malformed payload blocks
		}
	}

	return Object.keys(payload).length > 0 ? payload : undefined;
}

// ── Strip payload blocks from displayed content ──

function stripPayload(content: string): string {
	return content.replace(/<!--\s*payload\s*[\s\S]*?\s*-->/g, "").trim();
}

// ── Empty state prompts ──

const EXAMPLE_PROMPTS = [
	{
		text: "Run a 7-day US-only video campaign for new beauty creators under 10k followers, tiered commission starting at 10%, $5,000 budget",
		icon: "🎯",
	},
	{
		text: "Free sample campaign for Indonesian fashion creators, allocate $3,000 for product samples",
		icon: "📦",
	},
	{
		text: "Commission boost for top-performing tech creators in Thailand, 20% bonus for hitting $10k GMV",
		icon: "🚀",
	},
];

// ── Component ──

export function ChatPanel({
	campaignId,
	onConfigUpdate,
	className,
	initialMessages,
}: ChatPanelProps) {
	const scrollRef = useRef<HTMLDivElement>(null);
	const bottomRef = useRef<HTMLDivElement>(null);
	const [inputValue, setInputValue] = useState("");
	const processedDataCount = useRef(0);
	const processedToolCallIds = useRef(new Set<string>());

	const stage = useDraftStore((s) => s.stage);
	const mergeConfig = useDraftStore((s) => s.mergeConfig);
	const setStage = useDraftStore((s) => s.setStage);
	const setIssues = useDraftStore((s) => s.setIssues);
	const setEstimate = useDraftStore((s) => s.setEstimate);
	const setLoading = useDraftStore((s) => s.setLoading);
	const setCampaignId = useDraftStore((s) => s.setCampaignId);

	const { messages, append, isLoading, status, error, data } = useChat({
		api: "/api/chat",
		id: campaignId ?? undefined,
		initialMessages: initialMessages ?? undefined,
		// Send the LATEST config from the store on every request (the `body`
		// option captures values at hook-creation time and would go stale).
		experimental_prepareRequestBody: ({ messages: reqMessages }) => ({
			// Prefer the server-assigned id (set after the first message creates
			// the campaign) so we keep updating the same campaign, not duplicates.
			campaignId: useDraftStore.getState().campaignId ?? campaignId,
			messages: reqMessages,
			currentConfig: useDraftStore.getState().config,
		}),
		onFinish: (message) => {
			// Legacy payload-in-comments path (kept for backwards compat)
			const payload = parsePayload(message.content);
			if (payload) {
				if (payload.configPatch) {
					mergeConfig(payload.configPatch, "ai");
					onConfigUpdate?.(payload.configPatch);
				}
				if (payload.stage) {
					setStage(payload.stage === "done" ? "done" : payload.stage);
				}
				if (payload.issues) {
					setIssues(payload.issues);
				}
				if (payload.estimate) {
					setEstimate(payload.estimate);
				}
			}

			// Process server-side tool results that arrived as native message parts
			// (Vercel AI SDK multi-step server tool calls).
			const parts = (
				message as {
					parts?: Array<{
						type: string;
						toolName?: string;
						result?: unknown;
						toolCallId?: string;
					}>;
				}
			).parts;
			if (parts) {
				for (const part of parts) {
					if (
						part.type === "tool-result" &&
						part.toolCallId &&
						!processedToolCallIds.current.has(part.toolCallId)
					) {
						processedToolCallIds.current.add(part.toolCallId);
						handleToolResult(part.toolName, part.result);
					}
				}
			}

			// Mark the stage strip as complete once streaming ends successfully.
			setStage("done");
		},
		onError: (err) => {
			setStage("error");
			console.error("Chat error:", err);
		},
	});

	// Seed server-restored chat history exactly once per campaign. This runs
	// after useChat is initialized so `setMessages` is in scope, and before any
	// user-driven append so restored history isn't clobbered on re-render.
	// Process custom data-stream events from the server.
	// Both the real AI SDK path (onStepFinish) and the mock path emit
	// { type: "tool-result" | "stage", ... } events; this is what actually
	// drives config/stage/estimate updates in the UI.
	useEffect(() => {
		if (!data) return;
		for (let i = processedDataCount.current; i < data.length; i++) {
			const evt = data[i] as Record<string, unknown> | undefined;
			if (!evt || typeof evt !== "object") continue;

			if (evt.type === "tool-result") {
				const toolCallId = evt.toolCallId as string | undefined;
				if (toolCallId) {
					if (processedToolCallIds.current.has(toolCallId)) continue;
					processedToolCallIds.current.add(toolCallId);
				}
				handleToolResult(evt.toolName as string, evt.result);
			} else if (evt.type === "stage") {
				const s = evt.stage as DraftStage | undefined;
				if (s) setStage(s === "done" ? "done" : s);
			} else if (evt.type === "campaignId") {
				const id = evt.campaignId as string | undefined;
				if (id) setCampaignId(id);
			}
		}
		processedDataCount.current = data.length;
		// biome-ignore lint/correctness/useExhaustiveDependencies: handleToolResult is a hoisted function intentionally re-included in deps
	}, [data, handleToolResult, setStage, setCampaignId]);

	function handleToolResult(toolName: string | undefined, result: unknown) {
		if (!toolName || !result || typeof result !== "object") return;
		const r = result as Record<string, unknown>;

		if (toolName === "set_config") {
			const patch = r.merged as Partial<CampaignConfig> | undefined;
			if (patch && Object.keys(patch).length > 0) {
				mergeConfig(patch, "ai");
				onConfigUpdate?.(patch);
			}
		} else if (toolName === "run_validation") {
			const issues = r.issues as ValidationIssue[] | undefined;
			if (Array.isArray(issues)) {
				setIssues(issues);
			}
			setStage("validating");
		} else if (toolName === "generate_copy") {
			setStage("copy-gen");
		} else if (toolName === "run_simulation") {
			setStage("estimating");
			const sim: Partial<SimulationResult> = {};
			if (typeof r.estimatedReach === "number")
				sim.estimatedReach = r.estimatedReach;
			if (typeof r.estimatedCost === "number")
				sim.estimatedCost = r.estimatedCost;
			if (typeof r.estimatedCpa === "number") sim.estimatedCpa = r.estimatedCpa;
			if (typeof r.estimatedRoi === "number") sim.estimatedRoi = r.estimatedRoi;
			if (typeof r.eligibleCreatorCount === "number")
				sim.eligibleCreatorCount = r.eligibleCreatorCount;
			if (typeof r.actualCreators === "number")
				sim.actualCreators = r.actualCreators;
			if (Object.keys(sim).length > 0) {
				setEstimate(sim as SimulationResult);
			}
		}
	}

	// Auto-scroll to bottom when messages change or loading
	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" });
	}, []);

	// Sync loading state to store (use getState() to avoid re-render loop)
	useEffect(() => {
		setLoading(isLoading);
	}, [isLoading, setLoading]);

	const handleSubmit = useCallback(() => {
		const trimmed = inputValue.trim();
		if (!trimmed || isLoading) return;

		// We do NOT reset processedDataCount because `data` accumulates across
		// turns in useChat; the Set of toolCallIds plus the `data.length` cursor
		// already guarantees each event is processed exactly once per session.

		setStage("parsing");

		append({
			role: "user",
			content: trimmed,
		});

		setInputValue("");
	}, [inputValue, isLoading, append, setStage]);

	const handleQuickPrompt = useCallback((prompt: string) => {
		setInputValue(prompt);
	}, []);

	const handleRetry = useCallback(() => {
		setStage("idle");
		const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
		if (lastUserMsg) {
			append({
				role: "user",
				content: lastUserMsg.content,
			});
		}
	}, [messages, append, setStage]);

	const hasMessages = messages.length > 0;
	const isStreaming = status === "streaming" || status === "submitted";

	return (
		<div className={cn("flex h-full flex-col bg-bg-dark", className)}>
			{/* Stage progress strip */}
			{stage !== "idle" && (
				<div className="shrink-0 border-b border-border px-4 py-2.5">
					<StageProgress stage={stage} />
				</div>
			)}

			{/* Messages area */}
			<div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
				{!hasMessages ? (
					<EmptyState onPromptClick={handleQuickPrompt} />
				) : (
					<div className="flex flex-col gap-4">
						{messages.map((message) => {
							const payload = parsePayload(message.content);
							const displayContent = stripPayload(message.content);

							return (
								<MessageBubble
									key={message.id}
									id={message.id}
									role={message.role as "user" | "assistant"}
									content={displayContent}
									payload={payload}
									timestamp={
										message.createdAt
											? new Date(message.createdAt).getTime()
											: undefined
									}
								/>
							);
						})}

						{/* Streaming indicator */}
						{isStreaming && (
							<div className="flex items-center gap-2 px-4">
								<div className="flex items-center gap-1">
									<span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary-light [animation-delay:0ms]" />
									<span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary-light [animation-delay:150ms]" />
									<span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary-light [animation-delay:300ms]" />
								</div>
								<span className="text-xs text-text-muted">
									AI is thinking...
								</span>
							</div>
						)}

						{/* Error state */}
						{error && (
							<div className="rounded-lg border border-error/30 bg-error/5 p-4">
								<p className="text-sm text-error font-medium">
									Something went wrong
								</p>
								<p className="mt-1 text-xs text-text-secondary">
									{error.message ||
										"An unexpected error occurred. Please try again."}
								</p>
								<button
									type="button"
									onClick={handleRetry}
									className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-error/20 px-3 py-1.5 text-xs font-medium text-error transition-colors hover:bg-error/30"
								>
									Retry
								</button>
							</div>
						)}

						<div ref={bottomRef} />
					</div>
				)}
			</div>

			{/* Input area */}
			<div className="shrink-0 border-t border-border p-4 space-y-3">
				{/* Quick prompts */}
				<QuickPrompts onSelect={handleQuickPrompt} disabled={isLoading} />

				{/* Message input */}
				<MessageInput
					value={inputValue}
					onChange={setInputValue}
					onSubmit={handleSubmit}
					isLoading={isLoading}
					disabled={false}
				/>

				{/* Keyboard hint */}
				<div className="flex items-center justify-center gap-3">
					<span className="text-[10px] text-text-muted">
						<kbd className="rounded border border-border px-1 py-0.5 text-[10px] font-mono">
							⌘K
						</kbd>{" "}
						to focus
					</span>
					<span className="text-[10px] text-text-muted">
						<kbd className="rounded border border-border px-1 py-0.5 text-[10px] font-mono">
							Shift+Enter
						</kbd>{" "}
						for new line
					</span>
					<span className="text-[10px] text-text-muted">
						<kbd className="rounded border border-border px-1 py-0.5 text-[10px] font-mono">
							Enter
						</kbd>{" "}
						to send
					</span>
				</div>
			</div>
		</div>
	);
}

// ── Empty State ──

function EmptyState({
	onPromptClick,
}: {
	onPromptClick: (prompt: string) => void;
}) {
	return (
		<div className="flex h-full flex-col items-center justify-center px-6">
			{/* Icon */}
			<div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20">
				<Sparkles className="h-8 w-8 text-primary-light" />
			</div>

			{/* Title */}
			<h2 className="mt-6 text-lg font-semibold text-text-primary text-center">
				Describe your campaign to get started
			</h2>

			{/* Subtitle */}
			<p className="mt-2 max-w-md text-center text-sm text-text-secondary leading-relaxed">
				Describe your campaign in plain English. The AI will configure
				eligibility, rewards, budget, copy, and run a simulation — all
				automatically.
			</p>

			{/* Example prompts */}
			<div className="mt-8 w-full max-w-md space-y-2">
				<p className="text-xs font-medium text-text-muted uppercase tracking-wide text-center">
					Try an example
				</p>
				{EXAMPLE_PROMPTS.map((example) => (
					<button
						key={example.text}
						type="button"
						onClick={() => onPromptClick(example.text)}
						className={cn(
							"flex w-full items-center gap-3 rounded-xl border border-border px-4 py-3",
							"text-left text-sm text-text-secondary",
							"transition-all duration-200",
							"hover:border-primary/30 hover:bg-bg-card-hover hover:text-text-primary",
							"focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary",
						)}
					>
						<span className="text-lg shrink-0">{example.icon}</span>
						<span className="line-clamp-2">{example.text}</span>
						<ArrowRight className="ml-auto h-4 w-4 shrink-0 text-text-muted" />
					</button>
				))}
			</div>
		</div>
	);
}
