{ pkgs ? import <nixpkgs> {
  overlays = [ (import (builtins.fetchTarball "https://github.com/oxalica/rust-overlay/archive/master.tar.gz")) ];
} }:


let
  rust = pkgs.rust-bin.stable.latest.default.override {
    extensions = [ "rust-src" ];
    # targets = [ "arm-unknown-linux-gnueabihf" ];
  };
in pkgs.mkShell {
  buildInputs = with pkgs; [
    xorg.libX11
    xorg.libXcomposite
    xorg.libXdamage
    xorg.libXext
    xorg.libXfixes
    xorg.libXrandr
    xorg.libxcb
    xorg.libxshmfence
    alsaLib
    at-spi2-core
    nss
    expat
    cups
    nspr
    glib
    atk
    mesa
    libxkbcommon
    at-spi2-atk
    dbus
    libdrm
    gtk3
    pango
    cairo
    gdk-pixbuf
    # Needed to compile some of the node_modules dependencies from source
    # autoreconfHook
    # autoPatchelfHook

    rust
    cargo
    rustfmt
    rust-analyzer

    nodejs-16_x
    nodePackages.pnpm
    electron_15
  ];
}
