{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  buildInputs = with pkgs; [
    fd
    xclip
    ripgrep
    nerdfonts
    mc
    vivaldi
    obsidian
    docker
    go
    flameshot
    qemu
    vlc
    kazam
    vscode
    arch-install-scripts
    arp-scan
    gcc
    gnumake
    gpp
    glibc
    libstdcxx
    dpkg
    stow
  ];
}

