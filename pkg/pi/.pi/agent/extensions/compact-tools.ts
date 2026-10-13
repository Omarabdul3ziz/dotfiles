/**
 * Compact tool rendering for pi.
 *
 * Re-registers the built-in tools with minimal renderers: the collapsed
 * state (the default) shows only a one-line summary per tool call, so the
 * transcript stays quiet. Press ctrl+o to expand any tool and see full
 * output. Thinking blocks are hidden via "hideThinkingBlock" in settings.
 *
 * Execution behavior is untouched: each tool definition is created from the
 * original and only renderCall/renderResult are overridden.
 */
import type {
	BashToolDetails,
	EditToolDetails,
	ExtensionAPI,
	ReadToolDetails,
} from "@earendil-works/pi-coding-agent";
import {
	createBashToolDefinition,
	createEditToolDefinition,
	createReadToolDefinition,
	createWriteToolDefinition,
} from "@earendil-works/pi-coding-agent";
import { Text } from "@earendil-works/pi-tui";

const MAX_EXPANDED_LINES = 100;

/** Render up to MAX_EXPANDED_LINES dim lines after a marker, eliding the rest. */
function expandedBlock(text: string, theme: { fg: (c: string, s: string) => string }): string {
	const lines = text.split("\n");
	const shown = lines.slice(0, MAX_EXPANDED_LINES);
	let out = shown.map((line) => `\n${theme.fg("dim", line)}`).join("");
	if (lines.length > MAX_EXPANDED_LINES) {
		out += `\n... ${lines.length - MAX_EXPANDED_LINES} more lines`;
	}
	return out;
}

export default function (pi: ExtensionAPI) {
	const cwd = process.cwd();

	// --- bash: "$ command" on one line, status when done ---
	const bash = createBashToolDefinition(cwd);
	pi.registerTool({
		...bash,
		renderCall(args, theme) {
			const cmd = args.command.replace(/\s+/g, " ").trim();
			const shown = cmd.length > 100 ? `${cmd.slice(0, 97)}...` : cmd;
			return new Text(theme.fg("toolTitle", theme.bold("$ ")) + theme.fg("accent", shown), 0, 0);
		},
		renderResult(result, { expanded, isPartial }, theme) {
			if (isPartial) return new Text(theme.fg("warning", "running..."), 0, 0);
			const output = result.content.find((c) => c.type === "text")?.text ?? "";
			const exitMatch = output.match(/exit code: (\d+)/);
			const exitCode = exitMatch ? parseInt(exitMatch[1], 10) : null;
			const lines = output.split("\n").filter((l) => l.trim()).length;
			const details = result.details as BashToolDetails | undefined;

			let text: string;
			if (exitCode === 0 || exitCode === null) {
				text = theme.fg("success", "done");
			} else {
				text = theme.fg("error", `exit ${exitCode}`);
			}
			if (lines > 0) text += theme.fg("dim", ` (${lines} lines)`);
			if (details?.truncation?.truncated) text += theme.fg("warning", " [truncated]");
			if (expanded) text += expandedBlock(output, theme);
			return new Text(text, 0, 0);
		},
	});

	// --- read: path + line count ---
	const read = createReadToolDefinition(cwd);
	pi.registerTool({
		...read,
		renderCall(args, theme) {
			let text = theme.fg("toolTitle", theme.bold("read ")) + theme.fg("accent", args.path);
			if (args.offset !== undefined || args.limit !== undefined) {
				const start = args.offset ?? 1;
				const end = args.limit !== undefined ? start + args.limit - 1 : "";
				text += theme.fg("dim", `:${start}${end ? `-${end}` : ""}`);
			}
			return new Text(text, 0, 0);
		},
		renderResult(result, { expanded, isPartial }, theme) {
			if (isPartial) return new Text(theme.fg("warning", "reading..."), 0, 0);
			const content = result.content.find((c) => c.type === "text");
			if (!content || content.type !== "text") return new Text("", 0, 0);
			const lines = content.text.split("\n");
			const details = result.details as ReadToolDetails | undefined;
			let text = theme.fg("success", `${lines.length} lines`);
			if (details?.truncation?.truncated) {
				text += theme.fg("warning", ` (truncated from ${details.truncation.totalLines})`);
			}
			if (expanded) text += expandedBlock(content.text, theme);
			return new Text(text, 0, 0);
		},
	});

	// --- edit: path + +/- stats ---
	const edit = createEditToolDefinition(cwd);
	pi.registerTool({
		...edit,
		renderCall(args, theme) {
			return new Text(
				theme.fg("toolTitle", theme.bold("edit ")) + theme.fg("accent", args.path),
				0,
				0,
			);
		},
		renderResult(result, { expanded, isPartial }, theme) {
			if (isPartial) return new Text(theme.fg("warning", "editing..."), 0, 0);
			const content = result.content.find((c) => c.type === "text");
			if (content?.type === "text" && /error/i.test(content.text)) {
				return new Text(theme.fg("error", content.text.split("\n")[0]), 0, 0);
			}
			const diff = (result.details as EditToolDetails | undefined)?.diff;
			if (!diff) return new Text(theme.fg("success", "applied"), 0, 0);

			let additions = 0;
			let removals = 0;
			for (const line of diff.split("\n")) {
				if (line.startsWith("+") && !line.startsWith("+++")) additions++;
				if (line.startsWith("-") && !line.startsWith("---")) removals++;
			}
			let text = theme.fg("success", `+${additions}`) + theme.fg("dim", " / ") + theme.fg("error", `-${removals}`);
			if (expanded) {
				for (const line of diff.split("\n")) {
					if (line.startsWith("+") && !line.startsWith("+++")) {
						text += `\n${theme.fg("success", line)}`;
					} else if (line.startsWith("-") && !line.startsWith("---")) {
						text += `\n${theme.fg("error", line)}`;
					} else {
						text += `\n${theme.fg("dim", line)}`;
					}
				}
			}
			return new Text(text, 0, 0);
		},
	});

	// --- write: path + line count ---
	const write = createWriteToolDefinition(cwd);
	pi.registerTool({
		...write,
		renderCall(args, theme) {
			const lineCount = args.content ? args.content.split("\n").length : 0;
			return new Text(
				theme.fg("toolTitle", theme.bold("write ")) +
					theme.fg("accent", args.path) +
					theme.fg("dim", ` (${lineCount} lines)`),
				0,
				0,
			);
		},
		renderResult(result, { isPartial }, theme) {
			if (isPartial) return new Text(theme.fg("warning", "writing..."), 0, 0);
			const content = result.content.find((c) => c.type === "text");
			if (content?.type === "text" && content.text && /error/i.test(content.text)) {
				return new Text(theme.fg("error", content.text.split("\n")[0]), 0, 0);
			}
			return new Text(theme.fg("success", "written"), 0, 0);
		},
	});
}
