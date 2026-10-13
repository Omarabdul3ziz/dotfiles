/**
 * footer.ts — one-row status bar.
 *
 *   `⎇ main +2*1?3 │ Swift-1.5 · think:off │ ctx 19% ▰▰░░░░░░ 24k/128k │ ✓ ready │ hero_brain`
 *    git + dirt       model · thinking       ctx (color, bar, counts)    statuses  session
 *
 * ctx colors: green <70%, warning 70-90%, error >90%. Left edge truncates first.
 * Git dirt from `git status --porcelain`, cached 1s (render runs per keystroke).
 */

import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";
import { execFileSync } from "node:child_process";

const SEP = " │ ";

export default function (pi: ExtensionAPI) {
	// Handler ctx carries model/usage/cwd; capture from session start or the command.
	let ctx: ExtensionContext | undefined;
	pi.on("session_start", async (_event, c) => {
		ctx = c;
		if (enabled) c.ui.setFooter(makeFooter);
	});

	// Registered even when toggled off, so /footer works any time.
	pi.registerCommand("footer", {
		description: "Toggle the one-row status bar",
		handler: async (_args, c) => {
			ctx = c;
			enabled = !enabled;
			c.ui.setFooter(enabled ? makeFooter : undefined);
			c.ui.notify(enabled ? "Footer on" : "Footer off (default restored)", "info");
		},
	});

	const rerender = () => lastTui?.requestRender();
	pi.on("turn_end", async () => rerender());
	pi.on("model_select", async () => rerender());
	pi.on("thinking_level_select", async () => rerender());

	let enabled = true;
	let lastTui: { requestRender(): void } | undefined;
	let dirtCache: { at: number; branch: string; text: string } | undefined;

	function gitDirt(cwd: string, branch: string): string {
		const now = Date.now();
		if (dirtCache && dirtCache.branch === branch && now - dirtCache.at < 1000) return dirtCache.text;
		let text = "";
		try {
			text = execFileSync("git", ["status", "--porcelain"], {
				cwd,
				encoding: "utf8",
				timeout: 500,
				stdio: ["ignore", "pipe", "ignore"],
			});
		} catch {}
		dirtCache = { at: now, branch, text };
		return text;
	}

	const makeFooter = (tui: any, theme: any, footerData: any) => {
		lastTui = tui;
		const unsub = footerData.onBranchChange(() => tui.requestRender());

		return {
			dispose: () => unsub(),
			invalidate() {},
			render(width: number): string[] {
				if (!ctx) return [""];
				const usage = ctx.getContextUsage();
				const model = ctx.model;
				const thinking = pi.getThinkingLevel();
				const branch = footerData.getGitBranch();
				const statuses = footerData.getExtensionStatuses();
				const name = pi.getSessionName() ?? ctx.cwd.split("/").filter(Boolean).pop() ?? null;

				const fmt = (n: number) =>
					n < 1000 ? String(n) : n < 1_000_000 ? `${(n / 1000).toFixed(1)}k` : `${(n / 1_000_000).toFixed(1)}m`;

				// 1. git branch + dirt (+ staged, * unstaged, ? untracked)
				let git = branch ? theme.fg("muted", `⎇ ${branch}`) : "";
				if (branch) {
					const lines = gitDirt(ctx!.cwd, branch).split("\n").filter(Boolean);
					const staged = lines.filter((l) => l[0] !== " " && l[0] !== "?").length;
					const untracked = lines.filter((l) => l.startsWith("??")).length;
					const bits: string[] = [];
					if (staged) bits.push(`+${staged}`);
					if (lines.length - staged - untracked) bits.push(`*${lines.length - staged - untracked}`);
					if (untracked) bits.push(`?${untracked}`);
					if (bits.length) git += theme.fg("warning", ` ${bits.join("")}`);
				}

				// 2. model · thinking level
				const short: Record<string, string> = {
					off: "off", minimal: "min", low: "low", medium: "med", high: "high", xhigh: "xhigh", max: "max",
				};
				const tc = thinking === "off" ? "dim" : thinking === "minimal" ? "muted" : "accent";
				const think = theme.fg(tc, `think:${short[thinking] ?? thinking}`);
				const modelSeg = theme.fg("accent", model ? model.name || model.id : "no-model")
					+ theme.fg("dim", " · ") + think;

				// 3. context: percent + block bar + counts
				let ctxSeg = theme.fg("dim", "ctx —");
				if (usage && usage.tokens != null) {
					const pct = usage.percent ?? 0;
					const color = pct > 90 ? "error" : pct > 70 ? "warning" : "success";
					const filled = Math.round((pct / 100) * 8);
					const bar = "▰".repeat(filled) + "░".repeat(8 - filled);
					ctxSeg = theme.fg(color, `ctx ${Math.round(pct)}% ${bar} ${fmt(usage.tokens)}/${fmt(usage.contextWindow)}`);
				}

				// 4. statuses from other extensions (setStatus); fallback ready
				const statusSeg = statuses.size
					? theme.fg("muted", [...statuses.values()].join(" "))
					: theme.fg("success", "✓ ready");

				// 5. session name (right anchor)
				const right = theme.fg("muted", name ?? "");
				let left = [git, modelSeg, ctxSeg, statusSeg].filter(Boolean).join(SEP);
				const avail = width - visibleWidth(right) - 1;
				if (visibleWidth(left) > avail) left = truncateToWidth(left, Math.max(0, avail));
				const pad = " ".repeat(Math.max(1, width - visibleWidth(left) - visibleWidth(right)));
				return [truncateToWidth(left + pad + right, width)];
			},
		};
	};
}