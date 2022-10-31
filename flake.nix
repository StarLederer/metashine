{
  description = "A very basic flake";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-22.05";
    rust-overlay.url = "github:oxalica/rust-overlay";
    flake-utils.url = "github:numtide/flake-utils/master";
  };

  outputs = { self, nixpkgs, rust-overlay, flake-utils }:
  let
    system = "x86_64-linux";
    overlays = [ (import rust-overlay) ];
    pkgs = import nixpkgs {
      inherit system overlays;
    };
    rust = pkgs.rust-bin.stable.latest.default.override {
      extensions = [ "rust-src" ];
      # targets = [ "arm-unknown-linux-gnueabihf" ];
    };
  in {
    devShell.${system} = pkgs.mkShell {
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
    };
  };
}
