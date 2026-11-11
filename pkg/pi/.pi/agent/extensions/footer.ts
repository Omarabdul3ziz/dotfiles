/**
 * footer.ts — one-row status bar.
 *
 *   `~/hero/var/workspaces/ai (⎇ main +2*1) │ Swift-1.5 (think:off) │ 19%`
 *    cwd + git (branch, dirt)      model (thinking)        ctx (color only)
 *
 * ctx colors: green <70%, warning 70-90%, error >90%. Left edge truncates first.
 * Git dirt from `git status --porcelain`, cached 1s (render runs per keystroke).
 * Extension statuses (setStatus, e.g. pi-lens LSP) are deliberately NOT rendered.
 */

import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { truncateToWidth } from "@earendil-works/pi-tui";
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

				const fmt = (n: number) =>
					n < 1000 ? String(n) : n < 1_000_000 ? `${(n / 1000).toFixed(1)}k` : `${(n / 1_000_000).toFixed(1)}m`;

				// 1. cwd, home-relative, with git branch + dirt (+ staged, * unstaged, ? untracked)
				const home = process.env.HOME || process.env.USERPROFILE;
				let cwd = ctx.cwd;
				if (home && cwd.startsWith(home)) cwd = "~" + cwd.slice(home.length);
				let git = theme.fg("muted", cwd);
				if (branch) {
					let g = `⎇ ${branch}`;
					const lines = gitDirt(ctx.cwd, branch).split("\n").filter(Boolean);
					const staged = lines.filter((l) => l[0] !== " " && l[0] !== "?").length;
					const untracked = lines.filter((l) => l.startsWith("??")).length;
					const bits: string[] = [];
					if (staged) bits.push(`+${staged}`);
					if (lines.length - staged - untracked) bits.push(`*${lines.length - staged - untracked}`);
					if (untracked) bits.push(`?${untracked}`);
					if (bits.length) g += theme.fg("warning", ` ${bits.join("")}`);
					git += theme.fg("dim", " (") + g + theme.fg("dim", ")");
				}

				// 2. model (thinking level)
				const short: Record<string, string> = {
					off: "off", minimal: "min", low: "low", medium: "med", high: "high", xhigh: "xhigh", max: "max",
				};
				const modelSeg = theme.fg("accent", model ? model.name || model.id : "no-model")
					+ theme.fg("dim", " (think:")
					+ theme.fg(thinking === "off" ? "dim" : thinking === "minimal" ? "muted" : "accent", short[thinking] ?? thinking)
					+ theme.fg("dim", ")");

				// 3. context: percent only, colored by usage
				let ctxSeg = theme.fg("dim", "—%");
				if (usage && usage.percent != null) {
					const pct = usage.percent;
					const color = pct > 90 ? "error" : pct > 70 ? "warning" : "success";
					ctxSeg = theme.fg(color, `${Math.round(pct)}%`);
				}

				// Exactly three segments; extension statuses (pi-lens etc.) are not rendered.
				const left = [git, modelSeg, ctxSeg].filter(Boolean).join(SEP);
				return [truncateToWidth(left, width)];
			},
		};
	};
}