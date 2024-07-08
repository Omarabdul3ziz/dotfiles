#!/bin/bash

sudo apt update
sudo apt -y install git wget curl tmux zsh

cp ./.zshrc ~/.zshrc
source ~/.zshrc

cp ./.tmux.conf ~/.tmux.conf
tmux source ~/.tmux.conf
