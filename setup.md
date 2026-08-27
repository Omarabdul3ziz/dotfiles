# Setup plan and discovered tools

This document summarizes tools and configurations found in your `~/.zsh_history` and groups them for easy installation or configuration.

## apt installation
- docker.io (or docker-ce) + docker-compose-plugin
- fzf
- tree
- lazygit
- arp-scan
- htop
- sqlite3
- qemu / qemu-kvm
- bridge-utils
- cpu-checker (kvm-ok)
- libvirt-clients
- libvirt-daemon
- virt-install
- zoxide
- stow (GNU stow)
- tmux
- git
- make / build-essential

## snap installation
- nvim (beta / classic)
- helix (--classic)
- obsidian (--classic)
- goreleaser (--classic)

## other / language/tool managers and installs
- rustup / cargo / rust toolchain (installed via rustup script)
- nix (Nix install script)
- Go toolchain (go install / go get used frequently)
  - golangci-lint (installed via `go install` in history)
  - lazygit (also installed via `go install` in history)
- nvm + node (nvm install --lts, npm i)
- mycelium (ad-hoc binary run from Downloads)

## configuration tasks
- Configure sudoless (rootless) Docker or add user to `docker` group to avoid sudo
- Ensure `stow` properly manages dotfiles and back them up before changes
- Backup and restore GNOME/dconf (`dconf dump / > gnome-settings-backup.ini`)
- Manage `~/.ssh` keys and `~/.ssh/config` consistently
- oh-my-zsh and plugins to keep: zsh-autosuggestions, zsh-syntax-highlighting, zsh-z
- tmux + TPM and `~/.tmux.conf` setup
- libvirt / KVM: add user to `kvm` and `libvirt` groups and configure bridges if using QEMU
- Check and edit `/etc/docker/daemon.json` if you need custom Docker settings
- nvm setup (ensure your shell loads nvm in `~/.zshrc`/`~/.bashrc`)
- Go environment variables (GOPATH/GOBIN) set in `~/.env` or shell config
- Rust default toolchain and components via `rustup`
- Snap application permissions (classic confinement where required)
- Keep periodic backups of installed packages: `dpkg --get-selections > packages.list` and `snap list > snaps.list`

## notes / important observations
- Some tools were installed multiple ways (neovim via apt and snap; helix via apt and snap; lazygit via apt and go). Choose a single installation method to avoid conflicts.
- Docker is used extensively; ensure `docker compose` is available (docker-compose-plugin or Docker Desktop) so `docker compose ...` works.
- You already use `dconf dump` and `dpkg --get-selections`; include those in a routine backup script.
- Back up `~/.env`, `~/.zshrc`, `~/.config/dconf/user`, and `~/.ssh` before major changes.
- Add your user to relevant groups (docker, libvirt, kvm) to avoid repeated sudo usage for VMs/containers.
- `stow` is used frequently — ensure restow after changes.

## Quick example commands (adapt to your preferences)
```bash
# update and install common apt packages
sudo apt update && sudo apt install -y docker.io docker-compose-plugin fzf tree lazygit \
  arp-scan htop sqlite3 qemu qemu-kvm bridge-utils cpu-checker libvirt-clients libvirt-daemon \
  zoxide stow tmux git make build-essential

# snap installs
sudo snap install --classic nvim
sudo snap install --classic helix
sudo snap install --classic obsidian
sudo snap install --classic goreleaser

# nvm + node (if not installed)
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
# then in a new shell:
nvm install --lts

# rustup
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# add current user to docker/kvm/libvirt groups
sudo usermod -aG docker,libvirt,kvm $USER

## Environment

- fish (login shell) · ghostty (terminal) · helix · nvim
- herdr — terminal workspace manager for agents (see ADE.md)
- zoxide, fzf, lazygit, glow, delta, jq, stow
