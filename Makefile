# Which packages are linked into $HOME. This line is the profile: everything
# under pkg/ is tracked, only what is listed here is active.
PKGS := core shell fish claude desktop herdr ghostty nvim helix tui

# Off by default, kept for reference: zsh zellij tmux alacritty
#   make on  PKG=zellij
#   make off PKG=zellij

# --no-folding forces per-file links. Without it stow would symlink whole
# directories into the repo, and vendor-owned dirs (~/.config/omarchy,
# ~/.config/hypr) would end up writing into git.
STOW := stow --no-folding -d pkg -t $(HOME)

.PHONY: apply delete adopt on off list ade-check toggl

apply:                      ## link PKGS into $HOME (idempotent, prunes stale links)
	@$(STOW) -R $(PKGS)
	@echo "linked: $(PKGS)"

delete:                     ## unlink PKGS
	@$(STOW) -D $(PKGS)

adopt:                      ## one-time: pull existing $HOME files into the repo, then link
	@$(STOW) --adopt $(PKGS)
	@echo "review 'git diff' before committing -- adopt overwrites repo files with \$$HOME's"

on:                         ## make on PKG=zellij
	@test -n "$(PKG)" || { echo "usage: make on PKG=<name>" >&2; exit 2; }
	@$(STOW) -R $(PKG)

off:                        ## make off PKG=zellij
	@test -n "$(PKG)" || { echo "usage: make off PKG=<name>" >&2; exit 2; }
	@$(STOW) -D $(PKG)

list:                       ## show every package and whether it is active
	@for p in $$(ls pkg); do \
	  case " $(PKGS) " in *" $$p "*) echo "  on   $$p" ;; *) echo "  off  $$p" ;; esac; \
	done

ade-check:
	@sh scripts/ade-check.sh

toggl:
	@bash scripts/omarchy-toggl-install.sh
