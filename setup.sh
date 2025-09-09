#!/usr/bin/env bash
# Interactive installer based on your ~/.zsh_history discoveries
# Run with: bash setup_installer.sh
set -euo pipefail

APT_PACKAGES=(
  docker.io docker-compose-plugin fzf tree lazygit arp-scan htop sqlite3 qemu qemu-kvm
  bridge-utils cpu-checker libvirt-clients libvirt-daemon zoxide stow tmux git make build-essential
)

SNAP_PACKAGES=(
  "nvim --classic"
  "helix --classic"
  "obsidian --classic"
  "goreleaser --classic"
)

GO_TOOLS=(
  "github.com/golangci/golangci-lint/cmd/golangci-lint@latest"
  "github.com/jesseduffield/lazygit@latest"
)

print_heading(){
  echo
  echo "==== $1 ===="
}

confirm(){
  read -r -p "$1 [y/N]: " resp
  case "$resp" in
    [yY][eE][sS]|[yY]) return 0;;
    *) return 1;;
  esac
}

install_apt(){
  if ! command -v apt >/dev/null 2>&1; then
    echo "apt not found, skipping apt installs."
    return
  fi
  print_heading "APT: packages to be installed"
  printf '%s\n' "${APT_PACKAGES[@]}"
  if confirm "Proceed to install apt packages with sudo?"; then
    sudo apt update
    sudo apt install -y "${APT_PACKAGES[@]}"
  else
    echo "Skipping apt installs."
  fi
}

install_snap(){
  if ! command -v snap >/dev/null 2>&1; then
    echo "snap not found, skipping snap installs."
    return
  fi
  print_heading "SNAP: packages to be installed"
  for p in "${SNAP_PACKAGES[@]}"; do echo "$p"; done
  if confirm "Proceed to install snap packages with sudo?"; then
    for p in "${SNAP_PACKAGES[@]}"; do
      sudo snap install $p || echo "snap install failed: $p"
    done
  else
    echo "Skipping snap installs."
  fi
}

install_rustup(){
  if command -v rustup >/dev/null 2>&1; then
    echo "rustup already installed"
    return
  fi
  if confirm "Install rustup (Rust toolchain) via official script?"; then
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
    echo "Rustup installed. Restart your shell or source the toolchain script."
  fi
}

install_nvm_and_node(){
  if [ -d "$HOME/.nvm" ]; then
    echo "nvm already appears installed"
    return
  fi
  if confirm "Install nvm and Node LTS?"; then
    curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
    echo "nvm installed. Open a new shell and run: nvm install --lts"
  fi
}

install_nix(){
  if command -v nix >/dev/null 2>&1; then
    echo "nix appears installed"
    return
  fi
  if confirm "Install Nix (multi-user) via official script?"; then
    sh <(curl -L https://nixos.org/nix/install)
    echo "Nix install started. Follow any interactive prompts."
  fi
}

install_go_tools(){
  if ! command -v go >/dev/null 2>&1; then
    echo "go not found; skipping go tool installs."
    return
  fi
  print_heading "Go tools to be installed (via go install)"
  for t in "${GO_TOOLS[@]}"; do echo "$t"; done
  if confirm "Proceed to install go tools?"; then
    for t in "${GO_TOOLS[@]}"; do
      GO111MODULE=on go install "$t" || echo "go install failed: $t"
    done
  fi
}

add_user_groups(){
  print_heading "Add current user to recommended groups: docker, libvirt, kvm"
  echo "This avoids needing sudo for many container/VM operations."
  if confirm "Add $USER to docker,libvirt,kvm groups now?"; then
    sudo usermod -aG docker,libvirt,kvm "$USER"
    echo "Groups updated. You may need to log out and back in for changes to apply."
  fi
}

show_menu(){
  cat <<EOF
Choose an action:
1) Install apt packages
2) Install snap packages
3) Install rustup (Rust)
4) Install nvm + Node LTS
5) Install Nix
6) Install Go tools
7) Add user to docker/libvirt/kvm groups
8) All of the above
9) Exit
EOF
}

main(){
  while true; do
    show_menu
    read -r -p "Select option [1-9]: " opt
    case "$opt" in
      1) install_apt ;;
      2) install_snap ;;
      3) install_rustup ;;
      4) install_nvm_and_node ;;
      5) install_nix ;;
      6) install_go_tools ;;
      7) add_user_groups ;;
      8)
         install_apt
         install_snap
         install_rustup
         install_nvm_and_node
         install_nix
         install_go_tools
         add_user_groups
         ;;
      9) echo "Exit."; break ;;
      *) echo "Invalid option" ;;
    esac
  done
}

main "$@"
EOF

# make the installer executable
chmod +x ./setup_installer.sh
