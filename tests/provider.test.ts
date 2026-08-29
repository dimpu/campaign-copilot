import { describe, expect, it } from "vitest";

// Import via relative path since we aren't exporting patchChunk from provider.ts
// (it's an internal helper). Instead, test the behavior at the SSE-event level via a
// mini re-implementation mirroring the core patch logic.

// Re-implement the core patch for a parsed SSE JSON object so we can unit-test the logic
// without duplicating imports of the provider module (which hits env at import time).
//
// Keep this in sync with lib/ai/provider.ts patchChunk.
type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

// Shape of the SSE completion chunk we patch (index/name are added at runtime).
interface ToolCall {
	index?: number;
	id: string;
	type: string;
	function: { name?: string; arguments?: string };
}
interface Choice {
	index?: number;
	delta: { role?: string; content?: string; tool_calls: ToolCall[] };
	finish_reason?: string | null;
}
interface SSEChunk {
	choices: Choice[];
	[key: string]: unknown;
}

function patchChunk(obj: unknown): unknown {
	const root = obj as Json;
	if (!root || typeof root !== "object" || Array.isArray(root)) return obj;
	const choices = Array.isArray(root.choices) ? root.choices : undefined;
	if (choices) {
		for (let i = 0; i < choices.length; i++) {
			const choice = choices[i];
			if (!choice || typeof choice !== "object" || Array.isArray(choice))
				continue;
			if (typeof choice.index !== "number") choice.index = i;
			const delta = choice.delta;
			if (delta && typeof delta === "object" && !Array.isArray(delta)) {
				const toolCalls = Array.isArray(delta.tool_calls)
					? delta.tool_calls
					: undefined;
				if (toolCalls) {
					for (let j = 0; j < toolCalls.length; j++) {
						const tc = toolCalls[j];
						if (!tc || typeof tc !== "object" || Array.isArray(tc)) continue;
						if (typeof tc.index !== "number") tc.index = j;
						const fn = tc.function;
						if (fn && typeof fn === "object" && !Array.isArray(fn)) {
							if (typeof fn.name === "string" && fn.name === "") delete fn.name;
							if (fn.arguments === undefined || fn.arguments === null)
								fn.arguments = "";
						}
						if (typeof tc.name === "string" && tc.name === "") delete tc.name;
					}
				}
			}
		}
	}
	return obj;
}

describe("llmbox stream patch", () => {
	it("injects missing index on choice and tool_calls entries (the reported error case)", () => {
		// Exact shape from the user's error report (single choice, single tool_call, no index).
		const incoming = {
			id: "",
			model: "",
			object: "chat.completion.chunk",
			choices: [
				{
					delta: {
						role: "assistant",
						tool_calls: [
							{
								function: { arguments: ',"campaignObjective":"', name: "" },
								id: "chatcmpl-tool-ae986d220198435d",
								type: "function",
							},
						],
					},
					finish_reason: null,
					// index: MISSING — this was the crash.
				},
			],
		};

		const out = patchChunk(incoming) as SSEChunk;
		expect(out.choices[0].index).toBe(0);
		expect(out.choices[0].delta.tool_calls[0].index).toBe(0);
		// Empty name must be removed so Zod treats it as an incremental delta (not a bad full name).
		expect(out.choices[0].delta.tool_calls[0].function.name).toBeUndefined();
		// Arguments kept as-is (partial JSON string is expected mid-stream).
		expect(out.choices[0].delta.tool_calls[0].function.arguments).toBe(
			',"campaignObjective":"',
		);
	});

	it("injects per-tool-call indices even when choice index is present", () => {
		const incoming = {
			choices: [
				{
					index: 0,
					delta: {
						tool_calls: [
							{
								function: { name: "set_config", arguments: "" },
								id: "a",
								type: "function",
							},
							{
								function: { name: "ask_user", arguments: "" },
								id: "b",
								type: "function",
							},
						],
					},
					finish_reason: null,
				},
			],
		};
		const out = patchChunk(incoming) as SSEChunk;
		expect(out.choices[0].delta.tool_calls[0].index).toBe(0);
		expect(out.choices[0].delta.tool_calls[1].index).toBe(1);
	});

	it("does not modify chunks without tool_calls (e.g. plain text deltas)", () => {
		const incoming = {
			choices: [{ index: 0, delta: { content: "Hello" }, finish_reason: null }],
		};
		const out = patchChunk(incoming) as SSEChunk;
		expect(out.choices[0].delta.content).toBe("Hello");
		expect(out.choices[0].delta.tool_calls).toBeUndefined();
	});

	it("preserves existing index values if they are already present", () => {
		const incoming = {
			choices: [
				{
					index: 3,
					delta: {
						tool_calls: [
							{
								index: 7,
								function: { name: "set_config", arguments: "" },
								id: "x",
								type: "function",
							},
						],
					},
					finish_reason: null,
				},
			],
		};
		const out = patchChunk(incoming) as SSEChunk;
		expect(out.choices[0].index).toBe(3);
		expect(out.choices[0].delta.tool_calls[0].index).toBe(7);
	});
});
