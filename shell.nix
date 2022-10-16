{ pkgs ? import <nixpkgs> {
  overlays = [ (import (builtins.fetchTarball "https://github.com/oxalica/rust-overlay/archive/master.tar.gz")) ];
} }:

let
  rust = pkgs.rust-bin.stable.latest.default.override {
    extensions = [ "rust-src" ];
    # targets = [ "arm-unknown-linux-gnueabihf" ];
  };
in pkgs.mkShell {
  name = "metashine";

  buildInputs = with pkgs; [
    rust
    cargo
    rustfmt
    rust-analyzer

    nodejs-16_x
    nodePackages.pnpm
    electron_15
  ];
}
