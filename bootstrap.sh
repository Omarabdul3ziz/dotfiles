#!/bin/bash
# This script will bootstrap a new Ubuntu installation with my preferred software and settings.
# It is idempotent and can be run multiple times without causing issues.
# Configurable, you can choose what to install

echo "Up..."
export DEBIAN_FRONTEND=noninteractive
sudo apt update
sudo apt upgrade

echo "Installing needed packages..."
sudo apt -y install git wget curl tmux zsh gpg apt-transport-https vim build-essintials

echo "Installing VS Code..."
sudo snap install --classic code

echo "Installing Rust..."
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
code --install-extension rust-lang.rust-analyzer

echo "Installing Go..."
wget https://go.dev/dl/go1.21.1.linux-amd64.tar.gz
rm -rf /usr/local/go && tar -C /usr/local -xzf go1.21.1.linux-amd64.tar.gz
echo "export PATH=$PATH:/usr/local/go/bin" >>~/.profile
code --install-extension golang.Go

echo "Setting dotfiles..."
apt install stow
git clone https://github.com/Omarabdul3ziz/dotfiles ~/github.com/Omarabdul3ziz/dotfiles/
cd ~/github.com/Omarabdul3ziz/dotfiles/
stow -t /home/omar/ .
