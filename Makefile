apply:
	stow -t ~ .

delete:
	stow -D .

ade-check:
	@sh scripts/ade-check.sh
