apply:
	stow -t ~ root

delete:
	stow -D -t ~ root

ade-check:
	@sh scripts/ade-check.sh

toggl:
	bash scripts/omarchy-toggl-install.sh
