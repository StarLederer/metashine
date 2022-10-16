{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  name = "metashine";

  buildInputs = with pkgs; [
    rustc
    cargo
    electron_15
    nodejs-16_x
    nodePackages.pnpm
  ];
}
