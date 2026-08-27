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

.PHONY: apply delete adopt on off list ade-check toggl print-pkgs env-backup env-restore

apply:                      ## link PKGS into $HOME (idempotent, prunes stale links)
	@$(STOW) -R $(PKGS)
	@echo "linked: $(PKGS)"

delete:                     ## unlink PKGS
	@$(STOW) -D $(PKGS)

adopt:                      ## absorb existing $HOME files into the repo, then link
	@$(STOW) --adopt $(if $(PKG),$(PKG),$(PKGS))
	@echo "review 'git diff' before committing -- adopt overwrites repo files with \$$HOME's"

on:                         ## make on PKG=zellij  (add PKG to PKGS to keep it on)
	@test -n "$(PKG)" || { echo "usage: make on PKG=<name>" >&2; exit 2; }
	@$(STOW) -R $(PKG) 2>/dev/null || { \
	  echo "$(PKG) has files already in \$$HOME -- run: make adopt PKG=$(PKG)" >&2; exit 1; }

off:                        ## make off PKG=zellij
	@test -n "$(PKG)" || { echo "usage: make off PKG=<name>" >&2; exit 2; }
	@$(STOW) -D $(PKG)

list:                       ## show every package and whether it is active
	@for p in $$(ls pkg); do \
	  case " $(PKGS) " in *" $$p "*) echo "  on   $$p" ;; *) echo "  off  $$p" ;; esac; \
	done

# ~/.env is never tracked, encrypted or not -- this repo is public. These write
# to a path you pass in: a password manager, an external drive, a private repo.
env-backup:                 ## make env-backup DEST=/path/env.gpg
	@test -n "$(DEST)" || { echo "usage: make env-backup DEST=/path/env.gpg" >&2; exit 2; }
	@case "$(abspath $(DEST))" in "$(CURDIR)"/*) \
	  echo "refusing: $(DEST) is inside the repo" >&2; exit 2 ;; esac
	@test -s "$(HOME)/.env" || { echo "no ~/.env to back up" >&2; exit 1; }
	@gpg --symmetric --cipher-algo AES256 --yes --output "$(DEST)" "$(HOME)/.env"
	@echo "wrote $(DEST)"

env-restore:                ## make env-restore SRC=/path/env.gpg
	@test -n "$(SRC)" || { echo "usage: make env-restore SRC=/path/env.gpg" >&2; exit 2; }
	@test ! -e "$(HOME)/.env" || { echo "~/.env exists -- move it first" >&2; exit 1; }
	@gpg --decrypt --output "$(HOME)/.env" "$(SRC)"
	@chmod 600 "$(HOME)/.env"
	@echo "~/.env restored (mode 600)"

ade-check:
	@sh scripts/ade-check.sh

toggl:
	@bash scripts/omarchy-toggl-install.sh

print-pkgs:
	@echo $(PKGS)
