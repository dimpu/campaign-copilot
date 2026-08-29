import { createDataStreamResponse, type JSONValue, streamText } from "ai";
import type { NextRequest } from "next/server";
import { getMockCopyForLocales } from "@/lib/ai/copy-generator";
import { mockProcessMessage } from "@/lib/ai/mock-llm";
import { buildModel, isMockMode } from "@/lib/ai/provider";
import { buildSystemPrompt } from "@/lib/ai/system-prompt";
import { copilotTools } from "@/lib/ai/tools";
import { auth } from "@/lib/auth/auth";
import {
	addMessage,
	createCampaign,
	getCampaign,
	updateCampaign,
} from "@/lib/db/queries";
import type { CampaignConfig } from "@/lib/schemas/campaign-config";
import {
	ChatRequestSchema,
	createDefaultConfig,
} from "@/lib/schemas/campaign-config";
import { saveCopyVariants } from "@/lib/services/copy";
import { deepMergeConfig } from "@/lib/store/draft-store";
import { generateId, now, slugify } from "@/lib/utils";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes for long AI calls

export async function POST(request: NextRequest) {
	const session = await auth();
	if (!session?.user) {
		return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
			status: 401,
			headers: { "Content-Type": "application/json" },
		});
	}

	const userId = (session.user as { id: string }).id;

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return new Response(
			JSON.stringify({ ok: false, error: "Invalid JSON body" }),
			{
				status: 400,
				headers: { "Content-Type": "application/json" },
			},
		);
	}

	const parsed = ChatRequestSchema.safeParse(body);
	if (!parsed.success) {
		return new Response(
			JSON.stringify({
				ok: false,
				error: "Invalid request body",
				details: parsed.error.flatten(),
			}),
			{ status: 400, headers: { "Content-Type": "application/json" } },
		);
	}

	const {
		campaignId: incomingCampaignId,
		messages,
		currentConfig,
	} = parsed.data;

	// Normalize the (possibly partial) form snapshot over the defaults.
	const effectiveConfig = deepMergeConfig(
		createDefaultConfig(),
		(currentConfig ?? {}) as Partial<CampaignConfig>,
	);

	// ── Resolve or create campaign ──
	let campaignId = incomingCampaignId;
	let _currentCampaign = campaignId ? await getCampaign(campaignId) : null;

	if (!campaignId) {
		// Create a new campaign from the first user message
		const firstUserMsg = messages.find((m) => m.role === "user");
		const name = firstUserMsg?.content.slice(0, 80) ?? "New Campaign";
		const slug = `${slugify(name)}-${generateId().slice(0, 6)}`;

		const newCampaign = await createCampaign({
			name,
			slug,
			description: firstUserMsg?.content,
			createdBy: userId,
			config: effectiveConfig,
		});

		if (!newCampaign) {
			return new Response(
				JSON.stringify({ ok: false, error: "Failed to create campaign" }),
				{ status: 500, headers: { "Content-Type": "application/json" } },
			);
		}

		campaignId = newCampaign.id;
		_currentCampaign = newCampaign;
	}

	if (!campaignId) {
		return new Response(
			JSON.stringify({ ok: false, error: "No campaign ID" }),
			{ status: 500, headers: { "Content-Type": "application/json" } },
		);
	}

	// ── Save the user message ──
	const lastUserMessage = messages[messages.length - 1];
	if (lastUserMessage && lastUserMessage.role === "user") {
		await addMessage({
			campaignId,
			role: "user",
			content: lastUserMessage.content,
		});
	}

	// ── Determine mode ──
	const mockMode = isMockMode();

	if (mockMode) {
		// ── MOCK STREAMING PATH ──
		return handleMockStream(
			campaignId,
			lastUserMessage?.content ?? "",
			effectiveConfig,
			userId,
		);
	}

	// ── REAL AI SDK STREAMING PATH ──
	return handleRealStream(campaignId, messages, effectiveConfig, userId);
}

// ── Real AI SDK Stream ──
function handleRealStream(
	campaignId: string,
	messages: {
		role: "user" | "assistant" | "system" | "tool";
		content: string;
	}[],
	currentConfig: CampaignConfig | null | undefined,
	_userId: string,
): Response {
	// Collect tool results for post-processing
	const toolResults: Array<{
		toolName: string;
		args: unknown;
		result: unknown;
	}> = [];
	let _accumulatedText = "";

	return createDataStreamResponse({
		execute: async (dataStream) => {
			dataStream.writeData({ type: "campaignId", campaignId });

			const model = buildModel();
			if (!model) {
				// Fallback to mock if model creation fails
				dataStream.writeData({
					type: "text-delta",
					textDelta:
						"⚠️ LLM not configured. Please set OPENAI_API_KEY or use LLM_MODE=mock.\n\n",
				});
				dataStream.writeData({ type: "finish", finishReason: "error" });
				return;
			}

			const systemPrompt = buildSystemPrompt(currentConfig);

			const result = streamText({
				model,
				system: systemPrompt,
				tools: copilotTools,
				messages: messages.map((m) => ({
					role: m.role as "user" | "assistant" | "system",
					content: m.content,
				})),
				maxSteps: 8,
				onStepFinish: async (event) => {
					// Track tool calls for post-processing
					if (event.toolResults) {
						for (const tr of event.toolResults) {
							toolResults.push({
								toolName: tr.toolName,
								args: tr.args,
								result: tr.result,
							});

							// Map tool name to user-visible stage so the stage-progress
							// strip advances in real-LLM mode exactly like mock mode.
							const stageForTool: Record<string, string> = {
								set_config: "config-filling",
								run_validation: "validating",
								generate_copy: "copy-gen",
								run_simulation: "estimating",
							};
							const stage = stageForTool[tr.toolName];
							if (stage) {
								dataStream.writeData({
									type: "stage",
									stage,
									timestamp: now(),
								});
							}

							dataStream.writeData({
								type: "tool-result",
								toolCallId: tr.toolCallId,
								toolName: tr.toolName,
								result: tr.result as JSONValue,
							});
						}
					}
				},
				onFinish: async (event) => {
					// Save assistant message
					const finalText = event.text;
					_accumulatedText = finalText;

					if (finalText) {
						await addMessage({
							campaignId,
							role: "assistant",
							content: finalText,
							payload: {
								finishReason: event.finishReason,
								usage: event.usage,
							},
						});
					}

					// Process tool results for side effects
					for (const tr of toolResults) {
						if (tr.toolName === "set_config") {
							const configPatch = (
								tr.result as { merged?: Partial<CampaignConfig> }
							)?.merged;
							if (configPatch && Object.keys(configPatch).length > 0) {
								await updateCampaign(campaignId, {
									config: configPatch,
									reasoningTrace: [
										{
											step: tr.toolName,
											input: tr.args,
											output: tr.result,
											ts: now(),
										},
									],
								});
							}
						}

						if (tr.toolName === "generate_copy") {
							const locales = (tr.result as { localesGenerated?: string[] })
								?.localesGenerated;
							const params = (
								tr.result as {
									_params?: { campaignName?: string; taskType?: string };
								}
							)?._params;
							if (locales && locales.length > 0) {
								const taskType = params?.taskType ?? "open_collab";
								const variants = getMockCopyForLocales(locales, taskType);
								await saveCopyVariants(campaignId, variants);
							}
						}

						if (tr.toolName === "run_simulation") {
							const simResult = tr.result as {
								estimatedReach?: number;
								estimatedCost?: number;
								estimatedCpa?: number;
								estimatedRoi?: number;
								eligibleCreatorCount?: number;
							};
							if (simResult.estimatedReach !== undefined) {
								await updateCampaign(campaignId, {
									estimatedReach: simResult.estimatedReach ?? null,
									estimatedCost: simResult.estimatedCost ?? null,
									estimatedCpa: simResult.estimatedCpa ?? null,
									estimatedRoi: simResult.estimatedRoi ?? null,
									eligibleCreatorCount: simResult.eligibleCreatorCount ?? null,
								});
							}
						}
					}
				},
			});

			result.mergeIntoDataStream(dataStream);
		},
		onError: (error) => {
			console.error("[chat] Stream error:", error);
			return error instanceof Error ? error.message : "Unknown streaming error";
		},
	});
}

// ── Mock Stream ──
function handleMockStream(
	campaignId: string,
	userMessage: string,
	currentConfig: CampaignConfig | null | undefined,
	_userId: string,
): Response {
	return createDataStreamResponse({
		execute: async (dataStream) => {
			dataStream.writeData({ type: "campaignId", campaignId });

			const {
				messages: responseMessages,
				toolCalls,
				finalConfig,
				stageSequence,
			} = mockProcessMessage(userMessage, currentConfig);

			const fullResponse = responseMessages.join("\n\n");

			// Stream stage markers
			for (const stage of stageSequence) {
				dataStream.writeData({
					type: "stage",
					stage,
					timestamp: now(),
				});
				// Small delay to simulate streaming
				await delay(150);
			}

			// Stream tool calls
			for (const tc of toolCalls) {
				dataStream.writeData({
					type: "tool-result",
					toolCallId: `mock-${generateId()}`,
					toolName: tc.tool,
					result: tc.result as JSONValue,
				});
				await delay(100);
			}

			// Stream text in chunks to simulate real streaming
			const chunks = splitIntoChunks(fullResponse, 40);
			for (const chunk of chunks) {
				dataStream.writeData({
					type: "text-delta",
					textDelta: chunk,
				});
				await delay(30);
			}

			// ── Save results to DB ──
			// Save assistant message
			await addMessage({
				campaignId,
				role: "assistant",
				content: fullResponse,
				payload: {
					stageSequence,
					toolCalls: toolCalls.map((tc) => tc.tool),
				},
			});

			// Update campaign config
			await updateCampaign(campaignId, {
				config: finalConfig as Partial<CampaignConfig>,
				status: "ready",
				reasoningTrace: toolCalls.map((tc) => ({
					step: tc.tool,
					output: tc.result,
					ts: now(),
				})),
			});

			// Handle generate_copy tool in mock mode
			const generateCopyCall = toolCalls.find(
				(tc) => tc.tool === "generate_copy",
			);
			if (generateCopyCall) {
				const locales = (
					generateCopyCall.result as { localesGenerated?: string[] }
				)?.localesGenerated;
				if (locales && locales.length > 0) {
					const taskType = finalConfig.taskType ?? "open_collab";
					const variants = getMockCopyForLocales(locales, taskType);
					await saveCopyVariants(campaignId, variants);
				}
			}

			// Handle run_simulation tool in mock mode
			const simCall = toolCalls.find((tc) => tc.tool === "run_simulation");
			if (simCall) {
				const simResult = simCall.result as {
					estimatedReach?: number;
					estimatedCost?: number;
					estimatedCpa?: number;
					estimatedRoi?: number;
					eligibleCreatorCount?: number;
				};
				await updateCampaign(campaignId, {
					estimatedReach: simResult.estimatedReach ?? null,
					estimatedCost: simResult.estimatedCost ?? null,
					estimatedCpa: simResult.estimatedCpa ?? null,
					estimatedRoi: simResult.estimatedRoi ?? null,
					eligibleCreatorCount: simResult.eligibleCreatorCount ?? null,
				});
			}

			dataStream.writeData({ type: "finish", finishReason: "stop" });
		},
		onError: (error) => {
			console.error("[chat mock] Stream error:", error);
			return error instanceof Error
				? error.message
				: "Unknown mock streaming error";
		},
	});
}

// ── Helpers ──
function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function splitIntoChunks(text: string, targetChunkSize: number): string[] {
	const chunks: string[] = [];
	let i = 0;
	while (i < text.length) {
		// Try to break at a word boundary
		let end = Math.min(i + targetChunkSize, text.length);
		if (end < text.length) {
			const spaceIdx = text.lastIndexOf(" ", end);
			if (spaceIdx > i) {
				end = spaceIdx + 1;
			}
		}
		chunks.push(text.slice(i, end));
		i = end;
	}
	return chunks;
}
