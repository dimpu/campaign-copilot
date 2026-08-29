import { createOpenAI } from "@ai-sdk/openai";

/**
 * LLMBox (GLM) returns streaming chunks with two quirks vs. OpenAI:
 *   1. `tool_calls` delta entries are missing the `index` field the AI SDK Zod parser requires.
 *   2. Chunks can be split arbitrarily at the TCP level, so naive regex replacement fails —
 *      we need to buffer by SSE event boundary, JSON-parse each event, patch in place, then re-serialize.
 *
 * Additionally, some LLMBox tool-call delta fragments arrive with an empty `name`/`arguments`
 * placeholder (or name arrives after arguments), which can trip the SDK. We normalize these
 * to `undefined` so they're treated as incremental updates rather than invalid values.
 */
function llmboxFetch(
	input: RequestInfo | URL,
	init?: RequestInit,
): Promise<Response> {
	return fetch(input, init).then(async (res) => {
		if (!res.ok || !res.body) return res;

		const reader = res.body.getReader();
		const decoder = new TextDecoder();
		const encoder = new TextEncoder();
		let buffer = "";

		const stream = new ReadableStream({
			async pull(controller) {
				const { done, value } = await reader.read();
				if (done) {
					if (buffer.trim().length > 0) {
						// Flush any trailing data on close.
						controller.enqueue(encoder.encode(buffer));
					}
					controller.close();
					return;
				}

				buffer += decoder.decode(value, { stream: true });

				// SSE events are separated by a blank line (\n\n).
				const parts = buffer.split(/\r?\n\r?\n/);
				// Keep the last (possibly incomplete) piece in the buffer.
				buffer = parts.pop() ?? "";

				let out = "";
				for (const rawEvent of parts) {
					out += `${patchSseEvent(rawEvent)}\n\n`;
				}
				controller.enqueue(encoder.encode(out));
			},
		});

		// Copy headers but drop transfer-encoding/content-length since we're re-encoding.
		const headers = new Headers(res.headers);
		headers.delete("transfer-encoding");
		headers.delete("content-length");

		return new Response(stream, {
			status: res.status,
			statusText: res.statusText,
			headers,
		});
	});
}

/**
 * Patch a single SSE event block.
 *
 * SSE events may contain multiple `data:` lines (for multi-line data); we only care about
 * `data: {...}` lines that are JSON chat.completion.chunk objects. The terminal
 * `data: [DONE]` line is left alone.
 */
function patchSseEvent(rawEvent: string): string {
	const lines = rawEvent.split(/\r?\n/);
	return lines
		.map((line) => {
			if (!line.startsWith("data:")) return line;
			const payload = line.slice(5).trim();
			if (payload === "[DONE]") return line;

			let json: unknown;
			try {
				json = JSON.parse(payload);
			} catch {
				// Not parseable JSON — leave untouched (could be a comment/heartbeat).
				return line;
			}

			const patched = patchChunk(json);
			return `data: ${JSON.stringify(patched)}`;
		})
		.join("\n");
}

type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

function patchChunk(obj: unknown): unknown {
	const root = obj as Json;
	if (!root || typeof root !== "object" || Array.isArray(root)) return obj;

	// Ensure choices is an array.
	const choices = Array.isArray(root.choices) ? root.choices : undefined;
	if (choices) {
		for (let i = 0; i < choices.length; i++) {
			const choice = choices[i];
			if (!choice || typeof choice !== "object" || Array.isArray(choice))
				continue;

			// Fill top-level choice.index if missing.
			if (typeof choice.index !== "number") {
				choice.index = i;
			}

			const delta = choice.delta;
			if (delta && typeof delta === "object" && !Array.isArray(delta)) {
				const toolCalls = Array.isArray(delta.tool_calls)
					? delta.tool_calls
					: undefined;
				if (toolCalls) {
					for (let j = 0; j < toolCalls.length; j++) {
						const tc = toolCalls[j];
						if (!tc || typeof tc !== "object" || Array.isArray(tc)) continue;
						if (typeof tc.index !== "number") {
							tc.index = j;
						}
						// Normalize empty-string name/arguments/function fields to undefined
						// so the SDK treats them as "not present yet" rather than invalid values.
						const fn = tc.function;
						if (fn && typeof fn === "object" && !Array.isArray(fn)) {
							if (typeof fn.name === "string" && fn.name === "") {
								delete fn.name;
							}
							// arguments may arrive as an empty string on the first fragment — leave it.
							if (fn.arguments === undefined || fn.arguments === null) {
								fn.arguments = "";
							}
							// If function name is missing, ensure it's at least a string field
							// (the AI SDK expects `name` on the tool call too).
						}
						if (typeof tc.name === "string" && tc.name === "") {
							delete tc.name;
						}
					}
				}
			}
		}
	}

	return obj;
}

/**
 * Build the AI model based on environment configuration.
 *
 * Priority:
 * 1. If LLM_MODE=mock → return null (use mock fallback)
 * 2. If LLMBOX_API_KEY is set → use LLMBox (ByteDance internal) with glm-5.1
 * 3. If OPENAI_API_KEY is set → use OpenAI gpt-4o
 * 4. Otherwise → return null (mock fallback)
 */
export function buildModel() {
	if (process.env.LLM_MODE === "mock") {
		return null;
	}

	const llmboxKey = process.env.LLMBOX_API_KEY;
	if (llmboxKey) {
		const llmbox = createOpenAI({
			apiKey: llmboxKey,
			baseURL: "https://llmbox.tiktok-row.net/v1",
			headers: { "X-Source": "ttadk" },
			fetch: llmboxFetch,
		});
		return llmbox("glm-5.1");
	}

	const openaiKey = process.env.OPENAI_API_KEY;
	if (openaiKey) {
		const openai = createOpenAI({ apiKey: openaiKey });
		return openai("gpt-4o");
	}

	return null;
}

/**
 * Returns true if we should use the deterministic mock LLM.
 * Mock mode is active when LLM_MODE=mock or when no real API key is configured.
 */
export function isMockMode(): boolean {
	if (process.env.LLM_MODE === "mock") return true;
	if (process.env.LLMBOX_API_KEY) return false;
	if (process.env.OPENAI_API_KEY) return false;
	return true;
}

/**
 * Returns the name of the active model (for display in settings / copy metadata).
 */
export function getActiveModel(): string {
	if (isMockMode()) return "mock (deterministic)";
	if (process.env.LLMBOX_API_KEY) return "GLM 5.1 (LLMBox)";
	if (process.env.OPENAI_API_KEY) return "GPT-4o (OpenAI)";
	return "unknown";
}
